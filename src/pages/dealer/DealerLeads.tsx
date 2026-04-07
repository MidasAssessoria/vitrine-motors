import { useState, useEffect } from 'react';
import {
  Phone, Mail, MessageCircle, Loader2, Clock, XCircle,
  DollarSign, Car, Download, AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { LeadInteractionPanel } from '../../components/crm/LeadInteractionPanel';
import { SaleClosureModal } from '../../components/crm/SaleClosureModal';
import { useAuthStore } from '../../stores/authStore';
import { fetchLeads, updateLeadStatus, updateLeadTemperature } from '../../lib/leads';
import { isLeadAged, getValidLeadTransitions, LEAD_STATUS_LABELS } from '../../lib/leadUtils';
import { downloadLeadsCsv } from '../../lib/leadExport';
import { formatDate } from '../../utils/formatters';
import type { Lead, LeadStatus, LeadTemperature } from '../../types';

const TEMP_COLORS: Record<LeadTemperature, { bg: string; text: string; label: string }> = {
  hot:  { bg: 'bg-red-100',  text: 'text-red-700',  label: '🔥 Caliente' },
  warm: { bg: 'bg-amber-100',text: 'text-amber-700', label: '☀️ Tibio' },
  cold: { bg: 'bg-blue-100', text: 'text-blue-700',  label: '❄️ Frío' },
};

const STATUS_FLOW: { value: LeadStatus; label: string; icon: typeof Clock }[] = [
  { value: 'new',         label: 'Nuevo',      icon: Clock },
  { value: 'contacted',   label: 'Contactado', icon: Phone },
  { value: 'negotiating', label: 'Negociando', icon: MessageCircle },
  { value: 'test_drive',  label: 'Test Drive', icon: Car },
  { value: 'sold',        label: 'Vendido',    icon: DollarSign },
  { value: 'lost',        label: 'Perdido',    icon: XCircle },
];

export function DealerLeads() {
  const user = useAuthStore((s) => s.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [closingLead, setClosingLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchLeads({ sellerId: user.id }).then((data) => {
      setLeads(data);
      setLoading(false);
    });
  }, [user]);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    if (status === 'sold') {
      const lead = leads.find((l) => l.id === id);
      if (lead) { setClosingLead(lead); return; }
    }
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
    await updateLeadStatus(id, status);
  };

  const handleTempChange = async (id: string, temperature: LeadTemperature) => {
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, temperature } : l)));
    await updateLeadTemperature(id, temperature);
  };

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const agedCount = leads.filter((l) => isLeadAged(l)).length;

  const counts = {
    all:         leads.length,
    new:         leads.filter((l) => l.status === 'new').length,
    contacted:   leads.filter((l) => l.status === 'contacted').length,
    negotiating: leads.filter((l) => l.status === 'negotiating').length,
    test_drive:  leads.filter((l) => l.status === 'test_drive').length,
    sold:        leads.filter((l) => l.status === 'sold').length,
    lost:        leads.filter((l) => l.status === 'lost').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Leads / CRM</h1>
          <p className="text-sm text-text-secondary mt-1">
            {leads.length} leads en total · {counts.new} nuevos
          </p>
        </div>
        {leads.length > 0 && (
          <button
            type="button"
            onClick={() => downloadLeadsCsv(leads)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-secondary border border-border rounded-xl hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Aged leads alert */}
      {agedCount > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {agedCount} {agedCount === 1 ? 'lead nuevo lleva' : 'leads nuevos llevan'} más de 24h sin atención
          </p>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {[{ value: 'all' as const, label: 'Todos' }, ...STATUS_FLOW].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filter === s.value
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-text-secondary hover:border-primary'
            }`}
          >
            {s.label} ({counts[s.value as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <MessageCircle className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Sin leads</h3>
          <p className="text-sm text-text-secondary">Los leads aparecerán cuando compradores contacten por tus anuncios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const aged = isLeadAged(lead);
            const validNext = getValidLeadTransitions(lead.status);

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-2xl border shadow-card p-5 ${aged ? 'border-amber-300' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-heading font-bold text-text-primary">{lead.buyer_name}</h3>
                      {aged && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Sin atención +24h
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {lead.listing?.title || 'Vehículo'} · {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={lead.temperature}
                      onChange={(e) => handleTempChange(lead.id, e.target.value as LeadTemperature)}
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer ${TEMP_COLORS[lead.temperature]?.bg} ${TEMP_COLORS[lead.temperature]?.text}`}
                    >
                      <option value="hot">🔥 Caliente</option>
                      <option value="warm">☀️ Tibio</option>
                      <option value="cold">❄️ Frío</option>
                    </select>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>

                {/* Contact info */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <a href={`tel:${lead.buyer_phone}`} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {lead.buyer_phone}
                  </a>
                  {lead.buyer_email && (
                    <a href={`mailto:${lead.buyer_email}`} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {lead.buyer_email}
                    </a>
                  )}
                  <a
                    href={`https://wa.me/${lead.buyer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-whatsapp hover:opacity-80 transition-opacity"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>

                {/* Notes */}
                {lead.notes && (
                  <p className="text-xs text-text-secondary bg-bg-secondary rounded-lg p-3 mb-3">{lead.notes}</p>
                )}

                {/* Status flow — apenas transições válidas + estado atual */}
                <div className="flex items-center gap-1 pt-3 border-t border-border overflow-x-auto scrollbar-hide">
                  {STATUS_FLOW.map((s) => {
                    const Icon = s.icon;
                    const isActive = lead.status === s.value;
                    const isAllowed = isActive || validNext.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        onClick={() => isAllowed && !isActive && handleStatusChange(lead.id, s.value)}
                        disabled={!isAllowed || isActive}
                        title={!isAllowed ? `No se puede ir de "${LEAD_STATUS_LABELS[lead.status]}" a "${s.label}"` : undefined}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-primary text-white cursor-default'
                            : isAllowed
                              ? 'bg-bg-secondary text-text-secondary hover:text-primary cursor-pointer'
                              : 'bg-bg-secondary text-text-secondary/30 cursor-not-allowed'
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Interaction history */}
                <LeadInteractionPanel leadId={lead.id} />
              </div>
            );
          })}
        </div>
      )}

      {/* Sale closure modal */}
      {closingLead && (
        <SaleClosureModal
          leadId={closingLead.id}
          buyerName={closingLead.buyer_name}
          listingTitle={closingLead.listing?.title}
          currentDealValue={closingLead.deal_value}
          onConfirm={({ deal_value }) => {
            setLeads((p) => p.map((l) =>
              l.id === closingLead.id ? { ...l, status: 'sold', deal_value } : l
            ));
            setClosingLead(null);
          }}
          onCancel={() => setClosingLead(null)}
        />
      )}
    </div>
  );
}
