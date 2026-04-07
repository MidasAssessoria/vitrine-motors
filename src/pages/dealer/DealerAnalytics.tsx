import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointer, Heart, Loader2 } from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { useAuthStore } from '../../stores/authStore';
import { fetchDealerByOwner } from '../../lib/dealers';
import { fetchDealerKPIs } from '../../lib/analytics';
import type { DealerKPIs } from '../../types';

export function DealerAnalytics() {
  const user = useAuthStore((s) => s.user);
  const [kpis, setKpis] = useState<DealerKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDealerByOwner(user.id).then((d) => {
      if (d) fetchDealerKPIs(d.id).then((k) => { setKpis(k); setLoading(false); });
      else setLoading(false);
    });
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!kpis) {
    return <div className="text-center py-12 text-text-secondary text-sm">Sin datos de analytics</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Rendimiento de tus anuncios</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard icon={Eye} label="Views totales" value={kpis.ctrByListing.reduce((s, c) => s + c.views, 0)} />
        <KPICard icon={MousePointer} label="Clicks totales" value={kpis.ctrByListing.reduce((s, c) => s + c.clicks, 0)} />
        <KPICard icon={BarChart3} label="CTR promedio" value={
          kpis.ctrByListing.length > 0
            ? `${(kpis.ctrByListing.reduce((s, c) => s + c.ctr, 0) / kpis.ctrByListing.length).toFixed(1)}%`
            : '0%'
        } />
        <KPICard icon={Heart} label="% Destacados" value={`${kpis.featuredPercentage}%`} />
      </div>

      {/* Ranking de listings por CTR */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-text-primary">Ranking por CTR</h2>
        </div>
        <div className="divide-y divide-border">
          {kpis.ctrByListing.sort((a, b) => b.ctr - a.ctr).map((item, i) => (
            <div key={item.listingId} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-secondary/30 transition-colors">
              <span className="text-lg font-bold text-text-secondary w-8">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views}</span>
                  <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> {item.clicks}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">{item.ctr.toFixed(1)}%</p>
                <div className="w-24 h-2 bg-bg-secondary rounded-full mt-1">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(item.ctr * 2, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}

          {kpis.ctrByListing.length === 0 && (
            <div className="text-center py-12 text-text-secondary text-sm">Sin datos de analytics aún</div>
          )}
        </div>
      </div>
    </div>
  );
}
