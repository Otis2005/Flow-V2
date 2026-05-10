// Vercel serverless function: POST /api/notify-consultant
//
// Sends an email to every admin (ADMIN_EMAILS env var) whenever a new
// consultant submits an application. Uses Resend by default.
//
// Required env vars in Vercel:
//   RESEND_API_KEY    - get free at https://resend.com (3000 emails/month free)
//   ADMIN_EMAILS      - comma-separated list of admin emails (already set)
//
// Optional:
//   RESEND_FROM       - sender address. Defaults to "TenderFlow <onboarding@resend.dev>"
//                       which works WITHOUT verifying a domain, BUT can only send
//                       to the email the Resend account was created with. Once you
//                       verify a domain in Resend, set this to e.g.
//                       "TenderFlow <hello@tenderflow.africa>".
//
// If RESEND_API_KEY is missing the endpoint returns 200 + a "skipped" flag
// so the consultant signup flow never blocks on email failures.

import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'kennedynange@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const FROM = process.env.RESEND_FROM || 'TenderFlow <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || 'https://flow-v2-livid.vercel.app';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailHtml(c) {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1B2C45; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="font-family: Georgia, serif; font-weight: 500; font-size: 26px; margin: 0 0 6px;">New consultant application</h2>
  <p style="color: #6f7a8a; margin: 0 0 24px; font-size: 14px;">A new consultant has applied to be listed on TenderFlow. Review and approve from the admin dashboard.</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 28px;">
    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a; width: 35%;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; font-weight: 600;">${escapeHtml(c.name)}</td></tr>
    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6;">${escapeHtml(c.email)}</td></tr>
    ${c.phone ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a;">Phone</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6;">${escapeHtml(c.phone)}</td></tr>` : ''}
    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a;">Sectors</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6;">${escapeHtml((c.specialties || []).join(', ') || '—')}</td></tr>
    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a;">Countries</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6;">${escapeHtml((c.countries || []).join(', ') || '—')}</td></tr>
    ${c.cv_url ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6; color: #6f7a8a;">CV</td><td style="padding: 10px 0; border-bottom: 1px solid #e6e3d6;"><a href="${escapeHtml(c.cv_url)}" style="color: #1B2C45;">Download CV</a></td></tr>` : ''}
  </table>
  ${c.bio ? `<div style="padding: 16px; background: #f5f6eb; border-left: 3px solid #d8a73b; font-size: 14px; line-height: 1.5; margin-bottom: 28px;">${escapeHtml(c.bio)}</div>` : ''}
  <a href="${SITE_URL}/admin/consultants" style="display: inline-block; background: #1B2C45; color: #f5f6eb; padding: 12px 24px; text-decoration: none; font-weight: 600;">Review in admin dashboard</a>
  <p style="color: #6f7a8a; margin-top: 36px; font-size: 12px;">You are receiving this because you are listed in ADMIN_EMAILS for TenderFlow.</p>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate the caller — must be the consultant submitting their own
    // application, identified by Supabase access token.
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing access token' });
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const consultantId = body?.consultant_id;
    if (!consultantId) return res.status(400).json({ error: 'Missing consultant_id' });

    // Load the consultant row to make sure the user owns it.
    const { data: consultant, error: cErr } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', consultantId)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (cErr || !consultant) {
      return res.status(404).json({ error: 'Consultant record not found' });
    }

    // No Resend key configured? Bail gracefully — the application still got
    // created in the DB, admin will see it in the dashboard.
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'RESEND_API_KEY not configured. Admin will see this in the dashboard.'
      });
    }

    const html = emailHtml(consultant);
    const subject = `[TenderFlow] New consultant application: ${consultant.name}`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: ADMIN_EMAILS,
        subject,
        html
      })
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('[notify-consultant] Resend error', r.status, text);
      return res.status(200).json({
        ok: true,
        emailSent: false,
        warning: `Resend returned ${r.status}: ${text.slice(0, 300)}`
      });
    }

    return res.status(200).json({ ok: true, emailSent: true });
  } catch (e) {
    console.error('[notify-consultant] Unhandled', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
