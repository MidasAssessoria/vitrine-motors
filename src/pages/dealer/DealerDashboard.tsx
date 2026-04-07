import { useState, useEffect } from 'react';
import { Car, Users, TrendingUp, Clock, Star, BarChart3, Loader2 } from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { fetchDealerByOwner } from '../../lib/dealers';
import { fetchDealerKPIs } from '../../lib/analytics';
import { useAuthStore } from '../../stores/authStore';
import type { DealerKPIs, Dealership } from '../../types';

export function DealerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [dealer, setDealer] = useState<Dealership | null>(null);
  const [kpis, setKpis] = useState<DealerKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDealerByOwner(user.id).then((d) => {
      setDealer(d);
      if (d) {
        fetchDealerKPIs(d.id).then((k) => { setKpis(k); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!dealer) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
        <Car className="w-16 h-16 text-border mx-auto mb-4" />
        <h2 className="text-lg font-heading font-bold text-text-primary mb-2">No tenés concesionaria vinculada</h2>
        <p className="text-sm text-text-secondary mb-6">Contactá al administrador para vincular tu cuenta a una concesionaria.</p>
      </div>
    );
  }

  const k = kpis!;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">{dealer.name}</h1>
        <p className="text-sm text-text-secondary mt-1">Panel de gestión de tu concesionaria</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={Car} label="Inventario" value={k.totalInventory} subtitle={`${k.activeInventory} activos`} />
        <KPICard icon={Users} label="Leads totales" value={k.totalLeads} />
        <KPICard icon={TrendingUp} label="Leads hoy" value={k.newLeadsToday} />
        <KPICard icon={TrendingUp} label="Leads 7 días" value={k.leadsLast7d} />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KPICard icon={Clock} label="Aging promedio" value={`${k.avgInventoryAgeDays} días`} subtitle="Tiempo en inventario" />
        <KPICard icon={Star} label="% Destacados" value={`${k.featuredPercentage}%`} subtitle="Del inventario total" />
        <KPICard icon={BarChart3} label="CTR promedio" value={
          k.ctrByListing.length > 0
            ? `${(k.ctrByListing.reduce((s, c) => s + c.ctr, 0) / k.ctrByListing.length).toFixed(1)}%`
            : '0%'
        } subtitle="Cliques / Visualizaciones" />
      </div>

      {/* CTR por listing */}
      {k.ctrByListing.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-4">CTR por anuncio</h2>
          <div className="space-y-3">
            {k.ctrByListing.sort((a, b) => b.ctr - a.ctr).map((item) => (
              <div key={item.listingId} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.views} views · {item.clicks} clicks</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{item.ctr.toFixed(1)}%</p>
                  {/* Bar visual */}
                  <div className="w-20 h-1.5 bg-bg-secondary rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(item.ctr, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
