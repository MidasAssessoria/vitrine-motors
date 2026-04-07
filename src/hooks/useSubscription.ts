import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { fetchSubscription } from '../lib/subscriptions';
import type { SubscriptionTier, SellerSubscription } from '../types/subscription';
import { PRICING_TIERS } from '../types/subscription';

interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  subscription: SellerSubscription | null;
  loading: boolean;
  /** Verificar se o tier atual tem acesso a uma feature */
  hasFeature: (feature: keyof typeof featureChecks) => boolean;
  /** Dados do tier atual */
  tierData: (typeof PRICING_TIERS)[number] | undefined;
}

const featureChecks = {
  crm: (tier: SubscriptionTier) => tier === 'gold' || tier === 'platinum',
  teamManagement: (tier: SubscriptionTier) => tier === 'platinum',
  api: (tier: SubscriptionTier) => tier === 'platinum',
  advancedAnalytics: (tier: SubscriptionTier) => tier === 'gold' || tier === 'platinum',
  autoBump: (tier: SubscriptionTier) => tier !== 'free',
  featured: (tier: SubscriptionTier) => tier !== 'free',
} as const;

export function useSubscription(): UseSubscriptionReturn {
  const user = useAuthStore((s) => s.user);
  const [subscription, setSubscription] = useState<SellerSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const tier: SubscriptionTier = subscription?.tier || 'free';
  const tierData = PRICING_TIERS.find((t) => t.tier === tier);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchSubscription(user.id)
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const hasFeature = (feature: keyof typeof featureChecks): boolean => {
    return featureChecks[feature](tier);
  };

  return { tier, subscription, loading, hasFeature, tierData };
}
