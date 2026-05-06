import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, category, severity, description, steps, userEmail, denomination } = await req.json();
    const apiKey = Deno.env.get('RESEND_API_KEY');

    if (!apiKey) {
      // Gracefully degrade — bug still saved to DB, just no email
      console.warn('RESEND_API_KEY not set — bug report saved to DB but email not sent.');
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const severityEmoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #2D3436; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">🐛 New Bug Report — ChristSeeker</h1>
          <p style="margin: 6px 0 0; opacity: 0.7; font-size: 13px;">${new Date().toUTCString()}</p>
        </div>
        <div style="background: #f8f9fa; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none;">
          
          <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-size: 13px; opacity: 0.6; width: 140px;">Title</td><td style="padding: 6px 0; font-size: 14px; font-weight: bold;">${title}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 13px; opacity: 0.6;">Category</td><td style="padding: 6px 0; font-size: 14px;">${category}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 13px; opacity: 0.6;">Severity</td><td style="padding: 6px 0; font-size: 14px;">${severityEmoji} ${severity.charAt(0).toUpperCase() + severity.slice(1)}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 13px; opacity: 0.6;">Reported by</td><td style="padding: 6px 0; font-size: 14px;">${userEmail}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 13px; opacity: 0.6;">Denomination</td><td style="padding: 6px 0; font-size: 14px;">${denomination}</td></tr>
          </table>

          <div style="margin-bottom: 20px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 8px;">Description</p>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</div>
          </div>

          <div>
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 8px;">Steps to Reproduce</p>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${steps}</div>
          </div>

        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChristSeeker Bug Reports <bugs@christseeker.uk>',
        to: ['19e.nixon@gmail.com'],
        subject: `[${severity.toUpperCase()}] Bug: ${title}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', errText);
      // Still return success — the report is saved in the DB
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, emailSent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
