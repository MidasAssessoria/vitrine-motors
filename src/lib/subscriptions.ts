import { supabase } from './supabase';
import type { SubscriptionTier, SellerSubscription } from '../types/subscription';

/**
 * Buscar assinatura ativa do usuario
 */
export async function fetchSubscription(userId: string): Promise<SellerSubscription | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('seller_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as SellerSubscription | null;
}

/**
 * Verificar se usuario tem acesso a uma feature
 */
export async function checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
  if (!supabase) return false;

  const subscription = await fetchSubscription(userId);
  const tier = subscription?.tier || 'free';

  const { data, error } = await supabase
    .from('tier_features')
    .select('feature_value')
    .eq('tier', tier)
    .eq('feature_key', feature)
    .maybeSingle();

  if (error || !data) return false;
  return !!data.feature_value;
}

/**
 * Obter tier atual do usuario (rapido, sem buscar na tabela de subscriptions)
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  if (!supabase) return 'free';

  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (error || !data) return 'free';
  return (data.subscription_tier as SubscriptionTier) || 'free';
}

/**
 * Criar sessao de checkout Stripe para subscription
 */
export async function createSubscriptionCheckout(
  tier: SubscriptionTier,
  billingPeriod: 'monthly' | 'annual',
  userId: string
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
    body: {
      tier,
      billing_period: billingPeriod,
      user_id: userId,
      success_url: `${window.location.origin}/panel?subscription=success`,
      cancel_url: `${window.location.origin}/precios?canceled=true`,
    },
  });

  if (error) {
    console.error('Error creating subscription checkout:', error);
    return null;
  }

  return data?.url || null;
}

/**
 * Abrir portal de gerenciamento Stripe (upgrade, downgrade, cancelar, trocar cartão)
 */
export async function openBillingPortal(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke('create-billing-portal', {
    body: {
      user_id: userId,
      return_url: `${window.location.origin}/panel/assinatura`,
    },
  });

  if (error) {
    console.error('Error creating billing portal:', error);
    return null;
  }

  return data?.url || null;
}
