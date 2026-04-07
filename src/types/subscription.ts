export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface SellerSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierFeature {
  id: string;
  tier: SubscriptionTier;
  feature_key: string;
  feature_value: unknown;
  created_at: string;
}

export interface PricingTier {
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  badge: string;
  features: {
    maxListings: number | 'Ilimitado';
    featuredPerMonth: number | 'Ilimitado';
    searchPosition: string;
    analytics: string;
    autoBump: string;
    support: string;
    crm: boolean;
    teamManagement: boolean;
    api: boolean;
  };
}

// Dados estaticos dos tiers (conforme Deep Dive v1)
export const PRICING_TIERS: PricingTier[] = [
  {
    tier: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    badge: '',
    features: {
      maxListings: 5,
      featuredPerMonth: 0,
      searchPosition: 'Base',
      analytics: 'No',
      autoBump: 'No',
      support: '—',
      crm: false,
      teamManagement: false,
      api: false,
    },
  },
  {
    tier: 'silver',
    name: 'Silver',
    priceMonthly: 29,
    priceAnnual: 278, // ~20% desconto
    badge: 'Prata',
    features: {
      maxListings: 25,
      featuredPerMonth: 2,
      searchPosition: 'Medio',
      analytics: 'Basico',
      autoBump: 'Semanal',
      support: 'Email',
      crm: false,
      teamManagement: false,
      api: false,
    },
  },
  {
    tier: 'gold',
    name: 'Gold',
    priceMonthly: 69,
    priceAnnual: 662, // ~20% desconto
    popular: true,
    badge: 'Ouro',
    features: {
      maxListings: 100,
      featuredPerMonth: 5,
      searchPosition: 'Topo - 1',
      analytics: 'Avanzado',
      autoBump: 'Diario',
      support: 'Chat',
      crm: true,
      teamManagement: false,
      api: false,
    },
  },
  {
    tier: 'platinum',
    name: 'Platinum',
    priceMonthly: 149,
    priceAnnual: 1430, // ~20% desconto
    badge: 'Platina + Verificado',
    features: {
      maxListings: 'Ilimitado',
      featuredPerMonth: 'Ilimitado',
      searchPosition: 'Topo absoluto',
      analytics: 'Avanzado + API',
      autoBump: 'Diario + Prioridad',
      support: 'Telefono + Gerente',
      crm: true,
      teamManagement: true,
      api: true,
    },
  },
];
