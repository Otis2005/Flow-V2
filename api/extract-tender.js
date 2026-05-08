// Vercel serverless function: POST /api/extract-tender
//
// Receives a multipart/form-data PDF, sends it to Claude for structured
// extraction, and returns the extracted tender fields as JSON. Authentication:
// requires a Supabase access token belonging to an email on the admin
// allowlist. The Anthropic API key is server-side only.

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false
  }
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

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Tiny multipart parser — only needs to extract the first file part.
function parseMultipart(buffer, boundary) {
  const boundaryBuf = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;
  let idx;
  while ((idx = buffer.indexOf(boundaryBuf, start)) !== -1) {
    if (start !== 0) {
      parts.push(buffer.slice(start, idx - 2)); // strip trailing \r\n
    }
    start = idx + boundaryBuf.length;
    if (buffer.slice(start, start + 2).toString() === '--') break;
    start += 2; // skip \r\n after boundary
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd).toString('utf8');
    const body = part.slice(headerEnd + 4);
    const dispMatch = headers.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!dispMatch) continue;
    const [, name, filename] = dispMatch;
    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (filename) {
      return {
        filename,
        contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
        data: body,
        fieldName: name
      };
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 1. Authenticate via Supabase access token
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'Server is missing Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).' });
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  const email = (userData.user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    res.status(403).json({ error: 'Not an admin email' });
    return;
  }

  // 2. Parse multipart body
  const ct = req.headers['content-type'] || '';
  const bMatch = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = bMatch ? (bMatch[1] || bMatch[2]).trim() : null;
  if (!boundary) {
    res.status(400).json({ error: 'Missing multipart boundary' });
    return;
  }

  let buffer;
  try { buffer = await readBody(req); } catch { res.status(400).json({ error: 'Could not read body' }); return; }
  const file = parseMultipart(buffer, boundary);
  if (!file || !file.data?.length) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  if (file.data.length > 25 * 1024 * 1024) {
    res.status(413).json({ error: 'File exceeds 25 MB' });
    return;
  }

  // 3. Send to Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
    return;
  }
  const anthropic = new Anthropic({ apiKey });

  const isPdf =
    file.contentType?.toLowerCase().includes('pdf') ||
    file.filename?.toLowerCase().endsWith('.pdf');

  let content;
  if (isPdf) {
    content = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.data.toString('base64')
        }
      },
      { type: 'text', text: EXTRACTION_PROMPT }
    ];
  } else {
    // Best-effort: treat as text
    content = [
      { type: 'text', text: file.data.toString('utf8').slice(0, 200_000) },
      { type: 'text', text: EXTRACTION_PROMPT }
    ];
  }

  let extracted;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content }]
    });
    const text = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n')
      .trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Model did not return JSON');
    }
    extracted = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch (e) {
    console.error('[extract-tender] Claude error:', e);
    res.status(502).json({ error: 'Extraction failed: ' + (e.message || 'unknown error') });
    return;
  }

  res.status(200).json(extracted);
}
