import { useState, useEffect } from 'react';
import { Check, Shield, Trash2, Loader2 } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { fetchAllDealers, approveDealership, verifyDealership, deleteDealership } from '../../lib/dealers';
import { formatDate } from '../../utils/formatters';
import type { Dealership } from '../../types';

export function AdminDealerships() {
  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllDealers().then((data) => { setDealers(data); setLoading(false); });
  }, []);

  const handleApprove = async (id: string) => {
    setDealers((p) => p.map((d) => (d.id === id ? { ...d, approved: true } : d)));
    await approveDealership(id);
  };

  const handleVerify = async (id: string, current: boolean) => {
    setDealers((p) => p.map((d) => (d.id === id ? { ...d, verified: !current } : d)));
    await verifyDealership(id, !current);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta concesionaria?')) return;
    setDealers((p) => p.filter((d) => d.id !== id));
    await deleteDealership(id);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Concesionarias</h1>
        <p className="text-sm text-text-secondary mt-1">{dealers.length} concesionarias registradas</p>
      </div>

      <div className="space-y-3">
        {dealers.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {d.logo_url ? (
                  <img src={d.logo_url} alt={d.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold">
                    {d.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-heading font-bold text-text-primary">{d.name}</h3>
                  <p className="text-xs text-text-secondary">{d.city} · {d.address || 'Sin dirección'}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Registrada: {formatDate(d.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.plan} />
                {d.verified && <StatusBadge status="verified" />}
                {!d.approved && <StatusBadge status="pending" />}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              {!d.approved && (
                <button onClick={() => handleApprove(d.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-green/10 text-success-green text-xs font-medium hover:bg-success-green/20 transition-colors cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Aprobar
                </button>
              )}
              <button onClick={() => handleVerify(d.id, d.verified)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${d.verified ? 'bg-verified-blue/10 text-verified-blue' : 'bg-bg-secondary text-text-secondary hover:text-verified-blue'}`}>
                <Shield className="w-3.5 h-3.5" /> {d.verified ? 'Verificada' : 'Verificar'}
              </button>
              <button onClick={() => handleDelete(d.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-colors cursor-pointer ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </div>
        ))}

        {dealers.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm bg-white rounded-2xl border border-border">
            No hay concesionarias registradas
          </div>
        )}
      </div>
    </div>
  );
}
