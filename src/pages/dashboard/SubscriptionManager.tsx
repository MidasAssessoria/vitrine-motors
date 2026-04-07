import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  ArrowUpCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuthStore } from '../../stores/authStore';
import { openBillingPortal } from '../../lib/subscriptions';

export default function SubscriptionManager() {
  const user = useAuthStore((s) => s.user);
  const { tier, subscription, loading, tierData } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleOpenPortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    const url = await openBillingPortal(user.id);
    setPortalLoading(false);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const isFreePlan = tier === 'free';
  const isCanceling = subscription?.cancel_at_period_end;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary font-heading mb-6">
        Mi Suscripción
      </h1>

      {/* Plan atual */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-text-primary font-heading">
                Plan {tierData?.name || 'Free'}
              </h2>
              {!isFreePlan && (
                <span className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {isFreePlan
                ? 'Estás en el plan gratuito. Upgrade para acceder a más funciones.'
                : `USD ${tierData?.priceMonthly}/mes`}
            </p>
          </div>

          {isFreePlan ? (
            <Link
              to="/precios"
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <ArrowUpCircle size={16} />
              Elegir plan
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 bg-bg-secondary text-text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-border transition-colors disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              Gestionar en Stripe
              <ExternalLink size={12} />
            </button>
          )}
        </div>

        {/* Alerta de cancelamento */}
        {isCanceling && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 text-amber-800 rounded-xl p-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Tu suscripción se cancelará al final del período actual.</p>
              <p className="text-amber-700">
                Tenés acceso hasta el {formatDate(subscription?.current_period_end)}.
                Podés reactivarla desde el portal de Stripe.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detalles de facturación */}
      {!isFreePlan && subscription && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h3 className="text-sm font-bold text-text-primary font-heading mb-4">
            Detalles de facturación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary">Inicio del período</p>
                <p className="text-sm font-semibold text-text-primary">
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary">Próxima renovación</p>
                <p className="text-sm font-semibold text-text-primary">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funcionalidades do plano */}
      {tierData && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-text-primary font-heading mb-4">
            Lo que incluye tu plan
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Anuncios', value: String(tierData.features.maxListings) },
              { label: 'Destacados/mes', value: String(tierData.features.featuredPerMonth) },
              { label: 'Posición en búsqueda', value: tierData.features.searchPosition },
              { label: 'Analytics', value: tierData.features.analytics },
              { label: 'Auto-bump', value: tierData.features.autoBump },
              { label: 'Soporte', value: tierData.features.support },
              { label: 'CRM de leads', value: tierData.features.crm ? 'Sí' : 'No' },
              { label: 'Gestión de equipo', value: tierData.features.teamManagement ? 'Sí' : 'No' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  {item.value === 'No' || item.value === '—' || item.value === '0' ? (
                    <span className="text-text-secondary/50">{item.value}</span>
                  ) : (
                    <>
                      <CheckCircle2 size={14} className="text-success-green" />
                      {item.value}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Upgrade CTA para planos abaixo de Platinum */}
          {tier !== 'platinum' && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/precios"
                className="flex items-center justify-center gap-1.5 w-full bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <ArrowUpCircle size={16} />
                Comparar y cambiar de plan
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
