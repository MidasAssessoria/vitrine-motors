// Supabase Edge Function: create-checkout
// Deploy: supabase functions deploy create-checkout
// Required secrets: STRIPE_SECRET_KEY, APP_URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

interface CheckoutPayload {
  package_id: string;
  package_name: string;
  price_usd: number;
  listing_id: string;
  dealer_id: string;
  user_id: string;
  duration_days: number;
}

serve(async (req: Request) => {
  try {
    const payload: CheckoutPayload = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VitrineMotors Boost — ${payload.package_name}`,
              description: `Destaque para tu vehiculo por ${payload.duration_days} dias`,
            },
            unit_amount: Math.round(payload.price_usd * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/#/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/#/boost/cancel`,
      metadata: {
        package_id: payload.package_id,
        listing_id: payload.listing_id,
        dealer_id: payload.dealer_id,
        user_id: payload.user_id,
        duration_days: String(payload.duration_days),
      },
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
