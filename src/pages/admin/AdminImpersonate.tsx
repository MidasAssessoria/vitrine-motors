import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, LogIn, Loader2, Car, Users, TrendingUp, Clock, Star, BarChart3 } from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { fetchAllDealers } from '../../lib/dealers';
import { fetchDealerKPIs } from '../../lib/analytics';
import { useImpersonationStore } from '../../stores/impersonationStore';
import type { Dealership, DealerKPIs } from '../../types';

export function AdminImpersonate() {
  const navigate = useNavigate();
  const { start } = useImpersonationStore();

  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<DealerKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllDealers().then((data) => { setDealers(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedId) {
      setKpis(null);
      fetchDealerKPIs(selectedId).then(setKpis);
    }
  }, [selectedId]);

  const selectedDealer = dealers.find((d) => d.id === selectedId);

  const handleImpersonate = () => {
    if (!selectedDealer) return;
    start({ id: selectedDealer.id, name: selectedDealer.name });
    navigate('/dealer');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
          <Eye className="w-6 h-6 text-primary" /> Impersonar Concesionaria
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Navegá el panel como si fueras el lojista. Solo vos ves este banner.
        </p>
      </div>

      {/* Dealer selector */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card mb-6">
        <label className="text-sm font-medium text-text-primary mb-2 block">
          Seleccioná una concesionaria
        </label>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="flex-1 min-w-0 sm:max-w-sm border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">-- Elegir concesionaria --</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.city}){d.approved ? '' : ' — no aprobada'}
              </option>
            ))}
          </select>

          {selectedDealer && (
            <button
              type="button"
              onClick={handleImpersonate}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-4 h-4" />
              Entrar como {selectedDealer.name}
            </button>
          )}
        </div>
      </div>

      {/* KPIs del dealer seleccionado */}
      {selectedId && kpis && (
        <div>
          <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
            Vista previa: {selectedDealer?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard icon={Car} label="Inventario total" value={kpis.totalInventory} subtitle={`${kpis.activeInventory} activos`} />
            <KPICard icon={Users} label="Leads totales" value={kpis.totalLeads} />
            <KPICard icon={TrendingUp} label="Leads hoy" value={kpis.newLeadsToday} />
            <KPICard icon={TrendingUp} label="Leads últimos 7d" value={kpis.leadsLast7d} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard icon={Clock} label="Aging promedio" value={`${kpis.avgInventoryAgeDays}d`} subtitle="Tiempo en inventario" />
            <KPICard icon={Star} label="% Destacados" value={`${kpis.featuredPercentage}%`} />
            <KPICard icon={BarChart3} label="CTR promedio" value={
              kpis.ctrByListing.length > 0
                ? `${(kpis.ctrByListing.reduce((s, c) => s + c.ctr, 0) / kpis.ctrByListing.length).toFixed(1)}%`
                : '—'
            } />
          </div>
        </div>
      )}

      {selectedId && !kpis && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
