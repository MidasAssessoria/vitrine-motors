import { useState, useEffect } from 'react';
import {
  Phone, MessageCircle, Mail, FileText, MapPin,
  Plus, ChevronDown, ChevronUp, Loader2, Clock,
} from 'lucide-react';
import { fetchLeadInteractions, addInteraction } from '../../lib/leads';
import { useAuthStore } from '../../stores/authStore';
import type { LeadInteraction, InteractionType } from '../../types';

const TYPE_CONFIG: Record<InteractionType, { label: string; Icon: typeof Phone; color: string }> = {
  call:     { label: 'Llamada',     Icon: Phone,          color: 'text-blue-600 bg-blue-50' },
  whatsapp: { label: 'WhatsApp',    Icon: MessageCircle,  color: 'text-green-600 bg-green-50' },
  email:    { label: 'Email',       Icon: Mail,           color: 'text-purple-600 bg-purple-50' },
  note:     { label: 'Nota interna',Icon: FileText,       color: 'text-amber-600 bg-amber-50' },
  visit:    { label: 'Visita',      Icon: MapPin,         color: 'text-rose-600 bg-rose-50' },
};

interface Props {
  leadId: string;
}

export function LeadInteractionPanel({ leadId }: Props) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<InteractionType>('call');
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextDate, setNextDate] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLeadInteractions(leadId).then((data) => {
      setInteractions(data);
      setLoading(false);
    });
  }, [open, leadId]);

  const handleSave = async () => {
    if (!user || content.trim().length < 3) return;
    setSaving(true);
    const interaction = await addInteraction({
      lead_id: leadId,
      type,
      content: content.trim(),
      created_by: user.id,
      outcome: outcome.trim() || undefined,
      next_action_date: nextDate || null,
    });
    if (interaction) {
      setInteractions((prev) => [interaction, ...prev]);
    }
    setContent('');
    setOutcome('');
    setNextDate('');
    setShowForm(false);
    setSaving(false);
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (h < 1) return 'hace un momento';
    if (h < 24) return `hace ${h}h`;
    if (d === 1) return 'ayer';
    return `hace ${d} días`;
  };

  return (
    <div className="border-t border-border mt-3 pt-3">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors w-full cursor-pointer"
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="font-medium">Historial de contactos</span>
        {interactions.length > 0 && (
          <span className="ml-1 bg-bg-secondary text-text-secondary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            {interactions.length}
          </span>
        )}
        <span className="ml-auto">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Add interaction button */}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar contacto
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
              {/* Type selector */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TYPE_CONFIG) as InteractionType[]).map((t) => {
                  const { label, Icon } = TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        type === t
                          ? 'bg-primary text-white'
                          : 'bg-white border border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué pasó en este contacto?"
                rows={3}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />

              {/* Outcome + Next date */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Resultado (opcional)"
                  className="text-xs border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
                <input
                  type="datetime-local"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  title="Próxima acción"
                  className="text-xs border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setContent(''); setOutcome(''); setNextDate(''); }}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || content.trim().length < 3}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Interaction list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : interactions.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-3">
              Sin contactos registrados aún
            </p>
          ) : (
            <div className="space-y-2">
              {interactions.map((i) => {
                const cfg = TYPE_CONFIG[i.type];
                const Icon = cfg.Icon;
                return (
                  <div key={i.id} className="flex gap-3 bg-white rounded-xl border border-border p-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-text-primary">{cfg.label}</span>
                        <span className="text-[10px] text-text-secondary shrink-0">{formatRelative(i.created_at)}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{i.content}</p>
                      {i.outcome && (
                        <p className="text-[11px] text-text-secondary/70 mt-1 italic">→ {i.outcome}</p>
                      )}
                      {i.next_action_date && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="text-[10px] text-primary font-medium">
                            Próx: {new Date(i.next_action_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
