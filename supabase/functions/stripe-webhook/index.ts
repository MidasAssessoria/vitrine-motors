// Supabase Edge Function: stripe-webhook
// Deploy: supabase functions deploy stripe-webhook
// Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// ─── Idempotency: check if event was already processed ───
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .maybeSingle();
  return !!data;
}

async function markEventProcessed(eventId: string, eventType: string, payload: unknown): Promise<void> {
  await supabaseAdmin.from('stripe_webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    payload,
    processed_at: new Date().toISOString(),
  });
}

// ─── Handler: checkout.session.completed (one-time boost purchase) ───
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};

  // Only process boost purchases (has package_id)
  if (!meta.package_id) return;

  // 1. Register transaction
  await supabaseAdmin.from('payment_transactions').insert({
    user_id: meta.user_id,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    amount_usd: (session.amount_total || 0) / 100,
    status: 'completed',
    webhook_verified: true,
  });

  // 2. Get package tier
  const { data: pkg } = await supabaseAdmin
    .from('boost_packages')
    .select('tier, duration_days')
    .eq('id', meta.package_id)
    .single();

  // 3. Create boost purchase
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(meta.duration_days || pkg?.duration_days || 30));

  const { data: purchase } = await supabaseAdmin
    .from('boost_purchases')
    .insert({
      dealer_id: meta.dealer_id,
      package_id: meta.package_id,
      listing_id: meta.listing_id,
      credits_used: 0,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  // 4. Update listing tier and boost expiry
  if (pkg?.tier) {
    await supabaseAdmin.from('listings').update({
      tier: pkg.tier,
      boost_expires_at: expiresAt.toISOString(),
      last_bump_at: new Date().toISOString(),
    }).eq('id', meta.listing_id);
  }

  // 5. Link transaction to purchase
  if (purchase) {
    await supabaseAdmin.from('payment_transactions')
      .update({ boost_purchase_id: purchase.id })
      .eq('stripe_session_id', session.id);
  }
}

// ─── Handler: subscription events (for future Sprint 4) ───
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const meta = subscription.metadata || {};
  const userId = meta.user_id;
  if (!userId) return;

  const tierMap: Record<string, string> = {
    'price_silver': 'silver',
    'price_gold': 'gold',
    'price_platinum': 'platinum',
  };

  const priceId = subscription.items.data[0]?.price?.id || '';
  const tier = meta.tier || tierMap[priceId] || 'silver';

  await supabaseAdmin.from('seller_subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    tier,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: 'user_id' });

  // Update profile tier
  await supabaseAdmin.from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Reuse same logic as created
  await handleSubscriptionCreated(subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const meta = subscription.metadata || {};
  const userId = meta.user_id;
  if (!userId) return;

  await supabaseAdmin.from('seller_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  await supabaseAdmin.from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('id', userId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  await supabaseAdmin.from('seller_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);
}

// ─── Main handler ───
serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);

    // Idempotency check
    if (await isEventProcessed(event.id)) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route by event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventProcessed(event.id, event.type, event.data.object);

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
