import { useState, useEffect } from 'react';
import { Save, Loader2, Store } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OperatingHours } from '../../components/dealer/OperatingHours';
import { TeamManager } from '../../components/dealer/TeamManager';
import { useAuthStore } from '../../stores/authStore';
import { fetchDealerByOwner, updateDealerProfile } from '../../lib/dealers';
import type { Dealership } from '../../types';
import type { OperatingHoursData } from '../../components/dealer/OperatingHours';

interface DealerForm {
  name: string;
  address: string;
  city: string;
  logo_url: string;
  phone: string;
  whatsapp: string;
  website: string;
  ruc: string;
  description: string;
  operating_hours: OperatingHoursData | null;
}

export function DealerProfile() {
  const user = useAuthStore((s) => s.user);
  const [dealer, setDealer] = useState<Dealership | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<DealerForm>({
    name: '', address: '', city: '', logo_url: '',
    phone: '', whatsapp: '', website: '', ruc: '',
    description: '', operating_hours: null,
  });

  useEffect(() => {
    if (!user) return;
    fetchDealerByOwner(user.id).then((d) => {
      setDealer(d);
      if (d) {
        setForm({
          name: d.name,
          address: d.address,
          city: d.city,
          logo_url: d.logo_url,
          phone: d.phone ?? '',
          whatsapp: d.whatsapp ?? '',
          website: d.website ?? '',
          ruc: d.ruc ?? '',
          description: d.description ?? '',
          operating_hours: (d as Dealership & { operating_hours?: OperatingHoursData | null }).operating_hours ?? null,
        });
      }
      setLoading(false);
    });
  }, [user]);

  const set = (key: keyof DealerForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!dealer) return;
    setSaving(true);
    await updateDealerProfile(dealer.id, form as Partial<Dealership>);
    setDealer({ ...dealer, ...form } as Dealership);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!dealer) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
        <Store className="w-16 h-16 text-border mx-auto mb-4" />
        <h2 className="text-lg font-heading font-bold text-text-primary mb-2">Sin concesionaria</h2>
        <p className="text-sm text-text-secondary">Contactá al administrador para crear tu concesionaria.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Perfil de la tienda</h1>
        <p className="text-sm text-text-secondary mt-1">Editá la información de tu concesionaria</p>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* ─── Información básica ─── */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-5">
          <h2 className="text-sm font-bold text-text-primary">Información básica</h2>

          <Input label="Nombre de la concesionaria" value={form.name}
            onChange={(e) => set('name', e.target.value)} />
          <Input label="Dirección" value={form.address}
            onChange={(e) => set('address', e.target.value)} placeholder="Av. España 1234" />
          <Input label="Ciudad" value={form.city}
            onChange={(e) => set('city', e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Concesionaria especializada en..."
              rows={3}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Input label="RUC" value={form.ruc}
            onChange={(e) => set('ruc', e.target.value)} placeholder="80012345-6" />

          {/* Logo */}
          <Input label="URL del logo" value={form.logo_url}
            onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
          {form.logo_url && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">Preview:</span>
              <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
            </div>
          )}
        </div>

        {/* ─── Contacto ─── */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-5">
          <h2 className="text-sm font-bold text-text-primary">Datos de contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Teléfono" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} placeholder="+595 21 000 000" />
            <Input label="WhatsApp" value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)} placeholder="+595 981 000 000" />
          </div>
          <Input label="Sitio web" value={form.website}
            onChange={(e) => set('website', e.target.value)} placeholder="https://mitienda.com.py" />
        </div>

        {/* ─── Horario de funcionamento ─── */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-bold text-text-primary mb-4">Horario de atención</h2>
          <OperatingHours
            value={form.operating_hours}
            onChange={(hours) => setForm((f) => ({ ...f, operating_hours: hours }))}
          />
        </div>

        {/* ─── Estado del plan ─── */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>Plan: <strong className="text-text-primary capitalize">{dealer.plan}</strong></span>
            <span>·</span>
            <span>{dealer.verified ? '✓ Verificada' : 'No verificada'}</span>
            <span>·</span>
            <span>{dealer.approved ? '✓ Aprobada' : 'Pendiente aprobación'}</span>
          </div>
        </div>

        {/* ─── Equipe (Platinum) ─── */}
        <TeamManager
          dealershipId={dealer.id}
          isPlatinum={dealer.plan === 'premium'}
          canManage={true}
        />

        {/* ─── Guardar ─── */}
        <Button onClick={handleSave} disabled={saving} className="rounded-xl">
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
            : saved
              ? <><Save className="w-4 h-4 mr-2" />¡Guardado!</>
              : <><Save className="w-4 h-4 mr-2" />Guardar cambios</>
          }
        </Button>
      </div>
    </div>
  );
}
