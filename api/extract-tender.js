// Vercel serverless function: POST /api/extract-tender
//
// Body: { storage_path: string } — path of an already-uploaded file in the
// "tender-pdfs" Supabase Storage bucket. The function downloads the file
// server-side, extracts plain text from it, and sends THE TEXT (not the
// PDF document) to Claude Haiku for structured field extraction.
//
// Cost: ~$0.005 per typical tender vs ~$0.25 with the previous Sonnet +
// document-block approach. ~50x reduction. We keep a Sonnet + document
// fallback for cases where text extraction fails (image-only PDFs).
//
// Auth: requires a Supabase access token belonging to an email on the
// admin allowlist (ADMIN_EMAILS env var).

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 60
};

// Hard cap on pages we feed the model. Anything beyond this is unlikely
// to contain extraction-relevant fields (these are usually appendices,
// drawings, BoQ rows). Lower than the previous 50 because we go text-only
// most of the time, where token count scales with text length not page
// count, but we still want a sane upper bound.
const MAX_PDF_PAGES = 30;

// We clip the extracted text to keep token usage predictable. ~60K chars
// is roughly 15K tokens, which is well within Haiku's context window and
// covers the first 15-30 dense pages of any real-world tender PDF.
const MAX_TEXT_CHARS = 60_000;

// Magic bytes for a PDF file: "%PDF". Anything else is rejected before
// we waste compute or call out to the model.
const PDF_MAGIC = Buffer.from('%PDF');

const PRIMARY_MODEL = 'claude-haiku-4-5';
const FALLBACK_MODEL = 'claude-sonnet-4-5';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'kennedynange@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const EXTRACTION_PROMPT = `You are extracting structured tender data from a procurement document.

Output a single JSON object with EXACTLY these fields. Use null when a field is not stated in the document. Do not invent values.

{
  "title": string  the tender title or subject line,
  "issuer": string  the issuing organisation, ministry, or company,
  "country": one of "Kenya", "Uganda", "Tanzania" if mentioned (we currently only cover East Africa). Use null if outside these three.,
  "region": "East Africa" or null,
  "source": one of "Government", "NGO", "SME"  best classification of the issuer. Government for any state body or parastatal, NGO for non-governmental organisations / donor-funded projects / foundations / large corporate or institutional buyers, SME only for small private buyers.,
  "sector": string  one of Construction, ICT, Energy, Healthcare, Logistics, Water & Sanitation, Apparel, Hospitality, Professional Services, Creative, Agriculture, Education, Security, Media, Consulting, Supplies,
  "ref_no": string  the tender reference number,
  "value": number  estimated value in numeric form (no currency symbol). 0 if "refer to BoQ" or not stated,
  "currency": one of "USD", "EUR", "KES", "UGX", "TZS",
  "published_at": "YYYY-MM-DD"  date the tender was published,
  "closes_at": "YYYY-MM-DD"  bid submission deadline,
  "summary": string  2-3 sentence neutral summary of what is being procured,
  "scope": string  paragraph describing scope of work (or null),
  "eligibility": string  paragraph describing bidder eligibility (or null),
  "submission": string  how/where to submit (e.g. "eGP portal", "Sealed bids at HQ Nairobi"),
  "bid_security": string  the bid security or bid bond amount as stated, e.g. "USD 50,000" or "2% of bid sum". Return null if no bid security is required.,
  "agpo_category": one of "youth", "women", "pwd", "general", or null  set this only if the document explicitly mentions AGPO (Access to Government Procurement Opportunities, Kenya's 30% reservation programme) or an equivalent reservation for youth-owned, women-owned, or disability-owned businesses. Null if no reservation is mentioned.,
  "checklist": array of objects [{"text": string}]  a comprehensive checklist of mandatory documents and requirements a bidder must submit. Pull from sections titled "Mandatory Requirements", "Eligibility", "Documents Required", "Submission Requirements", and similar. Each item should be one concrete, actionable requirement. Aim for 8-20 items. Return [] if you cannot find any.,
  "fields_detected": number  how many of the above fields you populated with non-null values,
  "needs_review": string[]  names of fields where confidence is low,
  "confidence": number  overall confidence between 0 and 1
}

Important: do not use em-dashes anywhere in the strings. Use commas, periods, or colons instead.

Return ONLY the JSON object. No prose. No markdown fences.`;

export default async function handler(req, res) {
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
    if (!token) return res.status(401).json({ error: 'Missing access token' });

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

    // ─── Download ──────────────────────────────────────────
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

    // ─── File-type validation (magic bytes) ───────────────
    // We accept PDF only. The client also restricts via accept= on the
    // input, but client-side validation is bypassable so we re-check here.
    if (!fileBuffer.slice(0, 4).equals(PDF_MAGIC)) {
      return res.status(400).json({
        error: 'Uploaded file is not a valid PDF (magic bytes mismatch)'
      });
    }

    // ─── Clip to MAX_PDF_PAGES (cost control + Claude limit) ──
    let pdfPayload = fileBuffer;
    let clippedFromPages = null;
    let totalPages = null;
    try {
      const src = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      totalPages = src.getPageCount();
      if (totalPages > MAX_PDF_PAGES) {
        const out = await PDFDocument.create();
        const idx = Array.from({ length: MAX_PDF_PAGES }, (_, i) => i);
        const copied = await out.copyPages(src, idx);
        copied.forEach(p => out.addPage(p));
        pdfPayload = Buffer.from(await out.save());
        clippedFromPages = totalPages;
      }
    } catch (e) {
      console.warn('[extract-tender] pdf-lib clip failed:', e?.message);
    }

    // ─── Try text extraction first (cheap path) ───────────
    // pdf-parse pulls plain text out of the PDF without sending image
    // tokens to the model. For text-heavy tender PDFs (the vast majority)
    // this gets us identical extraction quality for a fraction of the cost.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
    }
    const anthropic = new Anthropic({ apiKey });

    let extractedText = '';
    try {
      const parsed = await pdfParse(pdfPayload);
      extractedText = (parsed?.text || '').trim();
    } catch (e) {
      console.warn('[extract-tender] pdf-parse failed, will use document block:', e?.message);
    }

    // Image-only / scanned PDFs come back with little or no text. Fall
    // back to the Sonnet + document-block path for those.
    const useTextPath = extractedText.length >= 500;

    let response;
    const meta = {
      total_pages: totalPages,
      clipped_from_pages: clippedFromPages,
      extraction_path: useTextPath ? 'text' : 'document',
      model_used: useTextPath ? PRIMARY_MODEL : FALLBACK_MODEL,
      text_chars: extractedText.length
    };

    try {
      if (useTextPath) {
        const clippedText = extractedText.slice(0, MAX_TEXT_CHARS);
        const promptNote = clippedFromPages
          ? `\n\nNote: this PDF originally had ${clippedFromPages} pages; you are seeing text from the first ${MAX_PDF_PAGES}.`
          : '';
        const userText =
          `${EXTRACTION_PROMPT}${promptNote}\n\n--- TENDER DOCUMENT TEXT BEGINS ---\n${clippedText}\n--- TENDER DOCUMENT TEXT ENDS ---`;

        response = await anthropic.messages.create({
          model: PRIMARY_MODEL,
          max_tokens: 2048,
          messages: [{ role: 'user', content: userText }]
        });
      } else {
        // Image / scanned PDFs: fall back to document content blocks.
        const promptWithContext = clippedFromPages
          ? `${EXTRACTION_PROMPT}\n\nNote: this PDF originally had ${clippedFromPages} pages; you are seeing the first ${MAX_PDF_PAGES}. Make best-effort extraction from those.`
          : EXTRACTION_PROMPT;
        const content = [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfPayload.toString('base64')
            }
          },
          { type: 'text', text: promptWithContext }
        ];
        response = await anthropic.messages.create({
          model: FALLBACK_MODEL,
          max_tokens: 2048,
          messages: [{ role: 'user', content }]
        });
      }
    } catch (e) {
      console.error('[extract-tender] Anthropic error:', e);
      return res.status(502).json({
        error: `Claude API error: ${e?.message || 'unknown'}`,
        status: e?.status,
        type: e?.error?.type,
        meta
      });
    }

    // ─── Parse Claude's response ──────────────────────────
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
        sample: text.slice(0, 500),
        meta
      });
    }

    let extracted;
    try {
      extracted = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch (e) {
      return res.status(502).json({
        error: 'Model returned malformed JSON',
        sample: text.slice(0, 500),
        meta
      });
    }

    // Normalize dates: Claude occasionally returns partial values like
    // "2026-05" or prose like "May 2026" when the PDF doesn't state an
    // exact day. Anything that doesn't match YYYY-MM-DD becomes null so
    // the client can render the date input as empty and the admin sees
    // a clear "needs review" flag instead of a Postgres save error.
    extracted.published_at = normalizeDate(extracted.published_at);
    extracted.closes_at = normalizeDate(extracted.closes_at);

    // If we nulled a date, flag it for the admin's attention.
    const reviewNotes = new Set(Array.isArray(extracted.needs_review) ? extracted.needs_review : []);
    if (extracted.published_at === null) reviewNotes.add('published_at');
    if (extracted.closes_at === null) reviewNotes.add('closes_at');
    extracted.needs_review = Array.from(reviewNotes);

    // Surface extraction metadata so the admin UI can show the user
    // which path ran and what model was used.
    return res.status(200).json({ ...extracted, _meta: meta });
  } catch (e) {
    console.error('[extract-tender] Unhandled error:', e);
    return res.status(500).json({
      error: e?.message || String(e)
    });
  }
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

// Coerce a model-returned date to YYYY-MM-DD, or null if we can't.
// Postgres' date type rejects anything that isn't a complete calendar date,
// so we'd rather null a partial like "2026-05" than let it cause a save
// error downstream. We also strip full ISO timestamps to just the date part.
function normalizeDate(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Sanity check: month 1-12, day 1-31. Postgres will reject 2026-13-40
    // with the same error class, so catch it here too.
    const [y, m, d] = trimmed.split('-').map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return trimmed;
  }
  // Full ISO timestamp like "2026-05-15T00:00:00Z"
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return isoMatch[1];
  // Anything else (partial, prose, malformed) -> null
  return null;
}
