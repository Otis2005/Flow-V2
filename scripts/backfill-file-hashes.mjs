/**
 * Backfill `tenders.file_hash` for every existing tender row.
 *
 * Why: rows created before Layer 1 dedupe shipped have file_hash = NULL,
 * so future re-uploads of the same PDF will NOT trigger the duplicate
 * check (no row matches NULL). This script re-hashes every uploaded PDF
 * in Supabase Storage and writes the hash back to the row.
 *
 * What it does:
 *   1. SELECT id, documents FROM tenders WHERE file_hash IS NULL
 *   2. For each row, download the first PDF from its documents jsonb
 *   3. SHA-256 the bytes
 *   4. UPDATE tenders SET file_hash = <hash> WHERE id = ...
 *
 * Conflicts: if two existing rows turn out to share the same hash (i.e.
 * you already have a duplicate in the DB before this script runs), the
 * unique index will reject the second UPDATE. The script catches that,
 * logs the colliding pair, and leaves both rows untouched so you can
 * decide which one to keep.
 *
 * Usage (from the repo root):
 *   node scripts/backfill-file-hashes.mjs
 *
 * Requires env vars (use a .env or pass inline):
 *   SUPABASE_URL              your project URL
 *   SUPABASE_SERVICE_ROLE_KEY service role key (bypasses RLS for read+update)
 *
 * Safe to re-run: it only processes rows where file_hash IS NULL.
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars and re-run.');
  console.error('You can find both in Supabase Dashboard → Project Settings → API.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

const BUCKET = 'tender-pdfs';

async function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function main() {
  const { data: rows, error } = await supabase
    .from('tenders')
    .select('id, title, documents, file_hash')
    .is('file_hash', null);

  if (error) {
    console.error('Failed to read tenders:', error.message);
    process.exit(1);
  }
  console.log(`Found ${rows.length} tender row(s) with NULL file_hash.`);

  const collisions = [];
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const docs = Array.isArray(row.documents) ? row.documents : [];
    // Match the client: hash whatever the first uploaded document is,
    // regardless of extension. Most are PDFs but docx and xlsx also flow
    // through the same dropzone.
    const firstDoc = docs.find(d => d.storage_path);
    if (!firstDoc) {
      console.log(`- skip "${row.title}" (${row.id.slice(0, 8)}): no uploaded document`);
      skipped++;
      continue;
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(firstDoc.storage_path);
    if (dlErr) {
      console.log(`- skip "${row.title}": download failed (${dlErr.message})`);
      skipped++;
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    const hash = await sha256(buf);

    const { error: upErr } = await supabase
      .from('tenders')
      .update({ file_hash: hash })
      .eq('id', row.id);

    if (upErr) {
      if (upErr.code === '23505') {
        // Unique-index collision: another existing row already has this hash.
        // Find that row so we can tell the user.
        const { data: other } = await supabase
          .from('tenders')
          .select('id, title, created_at')
          .eq('file_hash', hash)
          .maybeSingle();
        collisions.push({
          duplicate: { id: row.id, title: row.title },
          original: other,
          hash
        });
        console.log(`- COLLISION "${row.title}" matches existing "${other?.title}"`);
      } else {
        console.log(`- error updating "${row.title}": ${upErr.message}`);
      }
      skipped++;
      continue;
    }

    console.log(`- updated "${row.title}" (${row.id.slice(0, 8)}) → ${hash.slice(0, 12)}...`);
    updated++;
  }

  console.log('');
  console.log(`Done. Updated ${updated} / ${rows.length}. Skipped ${skipped}.`);
  if (collisions.length) {
    console.log('');
    console.log('Pre-existing duplicate tenders found (same PDF, separate rows):');
    for (const c of collisions) {
      console.log(`  - "${c.duplicate.title}" (${c.duplicate.id})`);
      console.log(`    matches`);
      console.log(`    "${c.original?.title || '?'}" (${c.original?.id || '?'})`);
      console.log(`    hash: ${c.hash.slice(0, 16)}...`);
      console.log('');
    }
    console.log('Decide which to keep. Delete the other in Supabase Table Editor,');
    console.log('then re-run this script to hash the keeper.');
  }
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
