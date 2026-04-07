import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/SEOHead';
import { useAuthStore } from '../../stores/authStore';
import { createSubscriptionCheckout } from '../../lib/subscriptions';
import { PRICING_TIERS } from '../../types/subscription';
import type { SubscriptionTier } from '../../types/subscription';
import { Check, X, Crown, Star, Zap, Shield } from 'lucide-react';

const tierIcons: Record<string, typeof Crown> = {
  free: Shield,
  silver: Star,
  gold: Zap,
  platinum: Crown,
};

const tierColors: Record<string, string> = {
  free: 'border-border',
  silver: 'border-gray-400',
  gold: 'border-yellow-500 ring-2 ring-yellow-500/20',
  platinum: 'border-purple-600 ring-2 ring-purple-600/20',
};

const tierBadgeColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
};

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;

    if (!isAuthenticated) {
      navigate('/registro');
      return;
    }

    setLoadingTier(tier);
    const url = await createSubscriptionCheckout(tier, billingPeriod, user!.id);
    setLoadingTier(null);

    if (url) {
      window.location.href = url;
    }
  };

  const featureRows: { label: string; key: string; boolean?: boolean }[] = [
    { label: 'Max Publicaciones', key: 'maxListings' },
    { label: 'Destacados / mes', key: 'featuredPerMonth' },
    { label: 'Posicion en busqueda', key: 'searchPosition' },
    { label: 'Analytics', key: 'analytics' },
    { label: 'Auto-bump', key: 'autoBump' },
    { label: 'Soporte', key: 'support' },
    { label: 'CRM de leads', key: 'crm', boolean: true },
    { label: 'Gestion de equipo', key: 'teamManagement', boolean: true },
    { label: 'API de inventario', key: 'api', boolean: true },
  ];

  return (
    <div className="bg-bg min-h-screen py-12 md:py-16">
      <SEOHead
        title="Planes y Precios"
        description="Planes de suscripcion para concesionarias y vendedores en VitrineMotors. Desde gratis hasta Platinum."
      />

      <Container>
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-3"
          >
            Planes para cada negocio
          </motion.h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Elige el plan que mejor se adapte a tu concesionaria. Todos los planes incluyen publicacion de vehiculos y acceso al marketplace.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-text-primary' : 'text-text-secondary'}`}>
              Mensual
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                billingPeriod === 'annual' ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-text-primary' : 'text-text-secondary'}`}>
              Anual
            </span>
            {billingPeriod === 'annual' && (
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                -20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PRICING_TIERS.map((plan, index) => {
            const Icon = tierIcons[plan.tier];
            const price = billingPeriod === 'monthly' ? plan.priceMonthly : Math.round(plan.priceAnnual / 12);
            const isPopular = plan.popular;
            const isLoading = loadingTier === plan.tier;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border bg-white p-6 flex flex-col ${tierColors[plan.tier]} ${
                  isPopular ? 'shadow-lg scale-[1.02] glow-gold' : 'shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    MAS POPULAR
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tierBadgeColors[plan.tier]}`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-text-primary">{plan.name}</h3>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-heading font-bold text-text-primary">
                    ${price}
                  </span>
                  <span className="text-sm text-text-secondary">/mes</span>
                  {billingPeriod === 'annual' && plan.priceMonthly > 0 && (
                    <div className="text-xs text-text-secondary mt-0.5">
                      <span className="line-through">${plan.priceMonthly}/mes</span>
                      {' '}· Facturado ${plan.priceAnnual}/ano
                    </div>
                  )}
                </div>

                {/* Key features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>{plan.features.maxListings === 'Ilimitado' ? 'Publicaciones ilimitadas' : `Hasta ${plan.features.maxListings} publicaciones`}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.features.featuredPerMonth ? (
                      <Check size={16} className="text-green-500 shrink-0" />
                    ) : (
                      <X size={16} className="text-gray-300 shrink-0" />
                    )}
                    <span>{plan.features.featuredPerMonth === 'Ilimitado' ? 'Destacados ilimitados' : plan.features.featuredPerMonth ? `${plan.features.featuredPerMonth} destacados/mes` : 'Sin destacados'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>Busqueda: {plan.features.searchPosition}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.features.analytics !== 'No' ? (
                      <Check size={16} className="text-green-500 shrink-0" />
                    ) : (
                      <X size={16} className="text-gray-300 shrink-0" />
                    )}
                    <span>Analytics: {plan.features.analytics}</span>
                  </li>
                  {plan.features.crm && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-green-500 shrink-0" />
                      <span>CRM de leads</span>
                    </li>
                  )}
                  {plan.features.teamManagement && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-green-500 shrink-0" />
                      <span>Gestion de equipo</span>
                    </li>
                  )}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.tier)}
                  variant={isPopular ? 'primary' : 'outline'}
                  className="w-full !rounded-xl"
                  disabled={isLoading || plan.tier === 'free'}
                >
                  {isLoading
                    ? 'Redirigiendo...'
                    : plan.tier === 'free'
                    ? 'Plan actual'
                    : 'Suscribirme'}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-heading font-bold text-text-primary text-center mb-6">
            Comparacion detallada
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary w-1/5">Feature</th>
                  {PRICING_TIERS.map((plan) => (
                    <th key={plan.tier} className="py-3 px-4 text-sm font-bold text-text-primary text-center">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr key={row.key} className="border-b border-border/50 hover:bg-bg-secondary/30">
                    <td className="py-3 px-4 text-sm text-text-secondary">{row.label}</td>
                    {PRICING_TIERS.map((plan) => {
                      const value = plan.features[row.key as keyof typeof plan.features];
                      return (
                        <td key={plan.tier} className="py-3 px-4 text-sm text-center">
                          {row.boolean ? (
                            value ? (
                              <Check size={18} className="text-green-500 mx-auto" />
                            ) : (
                              <X size={18} className="text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="font-medium text-text-primary">{String(value)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-12 text-sm text-text-secondary">
          <p>Todos los precios en USD. Pago seguro via Stripe.</p>
          <p className="mt-1">Podes cambiar o cancelar tu plan en cualquier momento.</p>
        </div>
      </Container>
    </div>
  );
}
