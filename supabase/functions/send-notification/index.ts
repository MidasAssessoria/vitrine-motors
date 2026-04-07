// Supabase Edge Function: send-notification
// Deploy: supabase functions deploy send-notification
// Required secrets: RESEND_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FROM_EMAIL = 'VitrineMotors <noreply@vitrinemotors.com>';

interface NotificationPayload {
  type: 'new_lead' | 'listing_approved' | 'listing_rejected' | 'dealer_approved';
  // Aceita email direto OU seller_id para buscar email
  to?: string;
  seller_id?: string;
  listing_id?: string;
  lead_id?: string;
  data?: Record<string, string>;
}

const TEMPLATES: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  new_lead: (data) => ({
    subject: `Nuevo contacto para ${data.listing_title || 'tu vehiculo'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#F97316">Nuevo contacto recibido</h2>
        <p>Hola ${data.seller_name || ''},</p>
        <p>Alguien esta interesado en tu vehiculo <strong>${data.listing_title || ''}</strong>.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>Nombre:</strong> ${data.buyer_name || ''}</p>
          <p><strong>Telefono:</strong> ${data.buyer_phone || ''}</p>
          ${data.buyer_email ? `<p><strong>Email:</strong> ${data.buyer_email}</p>` : ''}
        </div>
        <p>Ingresa a tu panel para gestionar este lead.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">VitrineMotors — Marketplace Automotriz de Paraguay</p>
      </div>
    `,
  }),

  listing_approved: (data) => ({
    subject: `Tu anuncio fue aprobado: ${data.listing_title || ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#22c55e">Anuncio aprobado</h2>
        <p>Hola ${data.seller_name || ''},</p>
        <p>Tu anuncio <strong>${data.listing_title || ''}</strong> fue aprobado y ya esta visible para compradores.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">VitrineMotors — Marketplace Automotriz de Paraguay</p>
      </div>
    `,
  }),

  listing_rejected: (data) => ({
    subject: `Tu anuncio fue rechazado: ${data.listing_title || ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#ef4444">Anuncio rechazado</h2>
        <p>Hola ${data.seller_name || ''},</p>
        <p>Tu anuncio <strong>${data.listing_title || ''}</strong> fue rechazado. Revisa los datos e intenta publicar nuevamente.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">VitrineMotors — Marketplace Automotriz de Paraguay</p>
      </div>
    `,
  }),

  dealer_approved: (data) => ({
    subject: 'Tu concesionaria fue aprobada en VitrineMotors',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#22c55e">Concesionaria aprobada</h2>
        <p>Hola ${data.dealer_name || ''},</p>
        <p>Tu concesionaria fue aprobada y ya puedes acceder al panel de dealer con todas las funcionalidades.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">VitrineMotors — Marketplace Automotriz de Paraguay</p>
      </div>
    `,
  }),
};

serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.type || !TEMPLATES[payload.type]) {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resolver email e dados do seller via Supabase se não fornecido diretamente
    let toEmail = payload.to || '';
    const data: Record<string, string> = payload.data || {};

    if (!toEmail && payload.seller_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Buscar email e nome do seller
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', payload.seller_id)
        .single();

      if (profile?.email) {
        toEmail = profile.email;
        data.seller_name = data.seller_name || profile.name || '';
      }

      // Buscar dados do listing se listing_id fornecido
      if (payload.listing_id) {
        const { data: listing } = await supabase
          .from('listings')
          .select('title, brand, model')
          .eq('id', payload.listing_id)
          .single();

        if (listing) {
          data.listing_title = data.listing_title || listing.title || `${listing.brand} ${listing.model}`;
        }
      }

      // Buscar dados do lead se lead_id fornecido
      if (payload.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('buyer_name, buyer_phone, buyer_email')
          .eq('id', payload.lead_id)
          .single();

        if (lead) {
          data.buyer_name = data.buyer_name || lead.buyer_name || '';
          data.buyer_phone = data.buyer_phone || lead.buyer_phone || '';
          data.buyer_email = data.buyer_email || lead.buyer_email || '';
        }
      }
    }

    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'No recipient email found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = TEMPLATES[payload.type](data);

    if (!RESEND_API_KEY) {
      console.log(`[NOTIFICATION] Would send "${template.subject}" to ${toEmail}`);
      return new Response(JSON.stringify({ success: true, mode: 'dry-run', to: toEmail }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
