// Vercel serverless function: POST /api/extract-tender
//
// Body: { storage_path: string } — path of an already-uploaded file in the
// "tender-pdfs" Supabase Storage bucket. The function downloads the file
// server-side, sends it to Claude for structured field extraction, and
// returns the extracted tender data as JSON.
//
// Auth: requires a Supabase access token belonging to an email on the
// admin allowlist (ADMIN_EMAILS env var).

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 60
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'kennedynange@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const EXTRACTION_PROMPT = `You are extracting structured tender data from a procurement document.

Output a single JSON object with EXACTLY these fields. Use null when a field is not stated in the document. Do not invent values.

{
  "title": string — the tender title or subject line,
  "issuer": string — the issuing organisation, ministry, or company,
  "country": string — the African country (e.g. "Kenya", "Nigeria"),
  "region": string — "East Africa" | "West Africa" | "Southern Africa" | "Central Africa" | "North Africa",
  "source": "Government" | "Private" | "SME" — best classification of the issuer,
  "sector": string — one of: Construction, ICT, Energy, Healthcare, Logistics, Water & Sanitation, Apparel, Hospitality, Professional Services, Creative, Agriculture, Education, Security, Media, Consulting, Supplies,
  "ref_no": string — the tender reference number,
  "value": number — estimated value in numeric form (no currency symbol). 0 if "refer to BoQ" or not stated,
  "currency": "USD" | "EUR" | "KES" | "NGN" | "ZAR" | "GHS" | "RWF" | "UGX" | "TZS",
  "published_at": "YYYY-MM-DD" — date the tender was published,
  "closes_at": "YYYY-MM-DD" — bid submission deadline,
  "summary": string — 2-3 sentence neutral summary of what is being procured,
  "scope": string — paragraph describing scope of work (or null),
  "eligibility": string — paragraph describing bidder eligibility (or null),
  "submission": string — how/where to submit (e.g. "eGP portal", "Sealed bids — HQ Nairobi"),
  "fields_detected": number — how many of the above fields you populated with non-null values,
  "needs_review": string[] — names of fields where confidence is low (e.g. ["closes_at", "value"]),
  "confidence": number — overall confidence between 0 and 1
}

Return ONLY the JSON object. No prose. No markdown fences.`;

export default async function handler(req, res) {
  // Always set JSON content type so any error response stays parseable.
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ─── Auth ───────────────────────────────────────────────
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        error: 'Server is missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const email = (userData.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Not an admin email' });
    }

    // ─── Body ──────────────────────────────────────────────
    const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
    const storagePath = body?.storage_path;
    if (!storagePath || typeof storagePath !== 'string') {
      return res.status(400).json({ error: 'Missing storage_path in body' });
    }

    // ─── Download file from Supabase Storage ───────────────
    const { data: fileBlob, error: dlError } = await supabase.storage
      .from('tender-pdfs')
      .download(storagePath);
    if (dlError || !fileBlob) {
      return res.status(404).json({
        error: `Could not download file from storage: ${dlError?.message || 'not found'}`
      });
    }
    const arrayBuf = await fileBlob.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuf);
    if (fileBuffer.length > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'File exceeds 25 MB' });
    }

    const isPdf =
      (fileBlob.type || '').toLowerCase().includes('pdf') ||
      storagePath.toLowerCase().endsWith('.pdf');

    // ─── Call Claude ───────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
    }
    const anthropic = new Anthropic({ apiKey });

    let content;
    if (isPdf) {
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: fileBuffer.toString('base64')
          }
        },
        { type: 'text', text: EXTRACTION_PROMPT }
      ];
    } else {
      content = [
        { type: 'text', text: fileBuffer.toString('utf8').slice(0, 200_000) },
        { type: 'text', text: EXTRACTION_PROMPT }
      ];
    }

    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content }]
      });
    } catch (e) {
      console.error('[extract-tender] Anthropic error:', e);
      return res.status(502).json({
        error: `Claude API error: ${e?.message || 'unknown'}`,
        status: e?.status,
        type: e?.error?.type
      });
    }

    const text = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n')
      .trim();

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(502).json({
        error: 'Model did not return JSON',
        sample: text.slice(0, 500)
      });
    }

    let extracted;
    try {
      extracted = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch (e) {
      return res.status(502).json({
        error: 'Model returned malformed JSON',
        sample: text.slice(0, 500)
      });
    }

    return res.status(200).json(extracted);
  } catch (e) {
    // Last-resort handler so the client always gets JSON.
    console.error('[extract-tender] Unhandled error:', e);
    return res.status(500).json({
      error: e?.message || String(e)
    });
  }
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
