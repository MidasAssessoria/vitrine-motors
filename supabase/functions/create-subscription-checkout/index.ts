// Supabase Edge Function: create-subscription-checkout
// Deploy: supabase functions deploy create-subscription-checkout
// Required secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Stripe Price IDs por tier e periodo (configurar no Stripe Dashboard)
// Substituir pelos IDs reais apos criar os Products/Prices no Stripe
const PRICE_IDS: Record<string, Record<string, string>> = {
  silver: {
    monthly: Deno.env.get('STRIPE_PRICE_SILVER_MONTHLY') || 'price_silver_monthly',
    annual: Deno.env.get('STRIPE_PRICE_SILVER_ANNUAL') || 'price_silver_annual',
  },
  gold: {
    monthly: Deno.env.get('STRIPE_PRICE_GOLD_MONTHLY') || 'price_gold_monthly',
    annual: Deno.env.get('STRIPE_PRICE_GOLD_ANNUAL') || 'price_gold_annual',
  },
  platinum: {
    monthly: Deno.env.get('STRIPE_PRICE_PLATINUM_MONTHLY') || 'price_platinum_monthly',
    annual: Deno.env.get('STRIPE_PRICE_PLATINUM_ANNUAL') || 'price_platinum_annual',
  },
};

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { tier, billing_period, user_id, success_url, cancel_url } = await req.json();

    if (!tier || !billing_period || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const priceId = PRICE_IDS[tier]?.[billing_period];
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Invalid tier or billing period' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar email do usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', user_id)
      .single();

    // Buscar ou criar Stripe Customer
    let customerId: string | undefined;

    const { data: existingSub } = await supabaseAdmin
      .from('seller_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else if (profile?.email) {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name,
        metadata: { user_id },
      });
      customerId = customer.id;
    }

    // Criar Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || 'https://vitrinemotors.com/panel?subscription=success',
      cancel_url: cancel_url || 'https://vitrinemotors.com/precios?canceled=true',
      subscription_data: {
        metadata: {
          user_id,
          tier,
          billing_period,
        },
      },
      metadata: {
        user_id,
        tier,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
