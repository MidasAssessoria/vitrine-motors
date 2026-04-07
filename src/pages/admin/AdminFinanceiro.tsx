import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Users, CreditCard,
  ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { supabase } from '../../lib/supabase';
import { PRICING_TIERS } from '../../types/subscription';
import type { SellerSubscription } from '../../types/subscription';

interface RevenueByTier {
  tier: string;
  count: number;
  mrr: number;
  color: string;
}

const TIER_COLORS: Record<string, string> = {
  free:     'bg-gray-300',
  silver:   'bg-slate-400',
  gold:     'bg-amber-400',
  platinum: 'bg-violet-500',
};

const TIER_TEXT: Record<string, string> = {
  free:     'text-gray-600',
  silver:   'text-slate-600',
  gold:     'text-amber-600',
  platinum: 'text-violet-600',
};

// Mock data para quando Supabase nao esta disponivel
function getMockData() {
  const subs: SellerSubscription[] = [
    { id: '1', user_id: 'u1', stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_1', tier: 'gold',     status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: false, created_at: '2026-01-15', updated_at: '2026-03-01' },
    { id: '2', user_id: 'u2', stripe_subscription_id: 'sub_2', stripe_customer_id: 'cus_2', tier: 'silver',   status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: false, created_at: '2026-02-10', updated_at: '2026-03-01' },
    { id: '3', user_id: 'u3', stripe_subscription_id: 'sub_3', stripe_customer_id: 'cus_3', tier: 'platinum', status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: false, created_at: '2026-01-01', updated_at: '2026-03-01' },
    { id: '4', user_id: 'u4', stripe_subscription_id: 'sub_4', stripe_customer_id: 'cus_4', tier: 'gold',     status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: false, created_at: '2026-02-20', updated_at: '2026-03-01' },
    { id: '5', user_id: 'u5', stripe_subscription_id: 'sub_5', stripe_customer_id: 'cus_5', tier: 'silver',   status: 'trialing', current_period_start: '2026-03-15', current_period_end: '2026-04-15', cancel_at_period_end: false, created_at: '2026-03-15', updated_at: '2026-03-15' },
    { id: '6', user_id: 'u6', stripe_subscription_id: 'sub_6', stripe_customer_id: 'cus_6', tier: 'gold',     status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: true,  created_at: '2026-01-20', updated_at: '2026-03-10' },
    { id: '7', user_id: 'u7', stripe_subscription_id: 'sub_7', stripe_customer_id: 'cus_7', tier: 'platinum', status: 'active',   current_period_start: '2026-03-01', current_period_end: '2026-04-01', cancel_at_period_end: false, created_at: '2025-12-01', updated_at: '2026-03-01' },
  ];
  return subs;
}

function calcRevenue(subs: SellerSubscription[]) {
  const active = subs.filter((s) => s.status === 'active' || s.status === 'trialing');
  const canceling = subs.filter((s) => s.cancel_at_period_end);

  let mrr = 0;
  const byTier: Record<string, { count: number; mrr: number }> = {
    free: { count: 0, mrr: 0 },
    silver: { count: 0, mrr: 0 },
    gold: { count: 0, mrr: 0 },
    platinum: { count: 0, mrr: 0 },
  };

  for (const sub of active) {
    const tier = PRICING_TIERS.find((t) => t.tier === sub.tier);
    const monthly = tier?.priceMonthly ?? 0;
    mrr += monthly;
    if (byTier[sub.tier]) {
      byTier[sub.tier].count++;
      byTier[sub.tier].mrr += monthly;
    }
  }

  const revenueByTier: RevenueByTier[] = Object.entries(byTier).map(([tier, data]) => ({
    tier,
    count: data.count,
    mrr: data.mrr,
    color: TIER_COLORS[tier],
  }));

  return { mrr, arr: mrr * 12, active: active.length, canceling: canceling.length, revenueByTier };
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Cancela pronto</span>;
  if (status === 'active')   return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Activo</span>;
  if (status === 'trialing') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Trial</span>;
  if (status === 'past_due') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Vencido</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{status}</span>;
}

export function AdminFinanceiro() {
  const [subs, setSubs] = useState<SellerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setSubs(getMockData());
        setIsMock(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('seller_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data?.length) {
        setSubs(getMockData());
        setIsMock(true);
      } else {
        setSubs(data as SellerSubscription[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { mrr, arr, active, canceling, revenueByTier } = calcRevenue(subs);
  const maxMrr = Math.max(...revenueByTier.map((r) => r.mrr), 1);
  const recent = [...subs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Financiero</h1>
          <p className="text-sm text-text-secondary mt-1">Ingresos y suscripciones</p>
        </div>
        {isMock && (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-full">
            Datos de demostración
          </span>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={DollarSign}
          label="MRR"
          value={`$${mrr.toLocaleString()}`}
          subtitle="Ingreso mensual recurrente"
        />
        <KPICard
          icon={TrendingUp}
          label="ARR"
          value={`$${arr.toLocaleString()}`}
          subtitle="Ingreso anual proyectado"
        />
        <KPICard
          icon={Users}
          label="Suscriptores activos"
          value={active}
          subtitle={`${canceling} cancelando`}
        />
        <KPICard
          icon={CreditCard}
          label="ARPU"
          value={active > 0 ? `$${(mrr / active).toFixed(0)}` : '$0'}
          subtitle="Ingreso promedio por usuario"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by tier */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-base font-heading font-bold text-text-primary mb-6">Ingresos por plan</h2>
          <div className="space-y-4">
            {revenueByTier.map((r) => {
              const tierInfo = PRICING_TIERS.find((t) => t.tier === r.tier);
              return (
                <div key={r.tier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold capitalize ${TIER_TEXT[r.tier]}`}>
                        {tierInfo?.name ?? r.tier}
                      </span>
                      <span className="text-xs text-text-secondary">{r.count} suscriptores</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      ${r.mrr.toLocaleString()}/mes
                    </span>
                  </div>
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.color} transition-all duration-700`}
                      style={{ width: `${(r.mrr / maxMrr) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-secondary">Total MRR</span>
            <div className="flex items-center gap-1 text-lg font-extrabold text-primary font-heading">
              ${mrr.toLocaleString()}
              <ArrowUpRight size={16} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Subscriber distribution donut-like */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-base font-heading font-bold text-text-primary mb-6">Distribución de planes</h2>
          <div className="space-y-3">
            {revenueByTier.filter((r) => r.count > 0).map((r) => {
              const tierInfo = PRICING_TIERS.find((t) => t.tier === r.tier);
              const pct = active > 0 ? ((r.count / active) * 100).toFixed(0) : '0';
              return (
                <div key={r.tier} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${r.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-text-primary">{tierInfo?.name ?? r.tier}</span>
                      <span className="text-xs text-text-secondary">{r.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {canceling > 0 && (
            <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-orange-600">
              <ArrowDownRight size={16} />
              <span className="text-sm font-medium">{canceling} suscripcion{canceling > 1 ? 'es' : ''} cancelando al fin de período</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent subscriptions */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-heading font-bold text-text-primary">Suscripciones recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary">MRR</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((sub) => {
                const tierInfo = PRICING_TIERS.find((t) => t.tier === sub.tier);
                return (
                  <tr key={sub.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-6 py-3 text-xs text-text-secondary font-mono">
                      {sub.stripe_subscription_id?.slice(0, 14) ?? sub.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold capitalize ${TIER_TEXT[sub.tier] ?? 'text-text-primary'}`}>
                        {tierInfo?.name ?? sub.tier}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={sub.status} cancelAtPeriodEnd={sub.cancel_at_period_end} />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-text-primary">
                      ${tierInfo?.priceMonthly ?? 0}/mes
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-text-secondary">
                      {new Date(sub.created_at).toLocaleDateString('es-PY')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
