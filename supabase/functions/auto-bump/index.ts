// Supabase Edge Function: auto-bump
// Deploy: supabase functions deploy auto-bump
// Schedule: Run daily via Supabase Cron or external trigger
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async () => {
  try {
    const now = new Date().toISOString();

    // 1. Auto-bump: listings com boost auto_bump ativo e não expirado
    const { data: bumpedListings, error: bumpError } = await supabaseAdmin
      .from('boost_purchases')
      .select('listing_id, package:boost_packages(auto_bump)')
      .gt('expires_at', now);

    if (!bumpError && bumpedListings) {
      const listingIds = bumpedListings
        .filter((bp: { package?: { auto_bump?: boolean } }) => bp.package?.auto_bump)
        .map((bp: { listing_id: string }) => bp.listing_id);

      if (listingIds.length > 0) {
        await supabaseAdmin
          .from('listings')
          .update({ last_bump_at: now })
          .in('id', listingIds);
      }

      console.log(`Auto-bumped ${listingIds.length} listings`);
    }

    // 2. Expire: reset tier para listings com boost expirado
    const { error: expireError } = await supabaseAdmin
      .from('listings')
      .update({ tier: 'free', boost_expires_at: null })
      .lt('boost_expires_at', now)
      .neq('tier', 'free');

    if (expireError) {
      console.error('Expire error:', expireError);
    } else {
      console.log('Expired boosts cleaned up');
    }

    return new Response(JSON.stringify({ success: true, bumped: 'done', expired: 'done' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Auto-bump error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
