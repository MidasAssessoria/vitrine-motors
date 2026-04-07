// Supabase Edge Function: sitemap
// Deploy: supabase functions deploy sitemap
// Generates dynamic XML sitemap with all active listings
// Access: GET /functions/v1/sitemap

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://vitrinemotors.com';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async () => {
  try {
    // Fetch all active listings (id, updated_at only for performance)
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('id, updated_at, brand, model, year')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(50000);

    if (error) throw error;

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/comprar', priority: '0.9', changefreq: 'daily' },
      { url: '/autos', priority: '0.8', changefreq: 'daily' },
      { url: '/motos', priority: '0.8', changefreq: 'daily' },
      { url: '/barcos', priority: '0.8', changefreq: 'daily' },
      { url: '/login', priority: '0.3', changefreq: 'monthly' },
      { url: '/registro', priority: '0.3', changefreq: 'monthly' },
      { url: '/terminos', priority: '0.1', changefreq: 'yearly' },
      { url: '/privacidad', priority: '0.1', changefreq: 'yearly' },
    ];

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic listing pages
    for (const listing of (listings || [])) {
      const lastmod = listing.updated_at
        ? new Date(listing.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/vehiculo/${listing.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache 1 hour
      },
    });
  } catch (err) {
    console.error('Sitemap error:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
