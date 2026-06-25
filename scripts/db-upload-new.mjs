import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Insert ONLY items from public/catalog.json that are not already in Supabase
// (matched by id). Safe to re-run: existing rows are skipped, so it never
// collides on the primary key the way db-upload.mjs (which uploads everything)
// would. Use this to push newly-added local items up to the live cloud catalog.
//
// Usage: node scripts/db-upload-new.mjs <email> <password>

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/db-upload-new.mjs <email> <password>');
  process.exit(1);
}
const [email, password] = args;

const config = JSON.parse(fs.readFileSync('public/config.json', 'utf8'));
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Signing in as ${email}...`);
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Authentication failed:', authError.message);
    process.exit(1);
  }
  console.log('Authenticated.');

  // Existing ids in the cloud.
  const { data: existing, error: selErr } = await supabase.from('items').select('id');
  if (selErr) {
    console.error('Failed to read existing items:', selErr.message);
    process.exit(1);
  }
  const have = new Set(existing.map((r) => r.id));
  console.log(`Cloud currently has ${have.size} items.`);

  const local = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
  const toInsert = local
    .filter((item) => !have.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      category: item.category,
      material_type: item.materialType,
      section: item.location?.section || '',
      shelf: item.location?.shelf || '',
      author: item.author || null,
      isbn: item.isbn || null,
      notes: item.notes || null,
      condition: item.condition || null,
      status: item.status || 'Cataloged',
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

  if (toInsert.length === 0) {
    console.log('Nothing to insert — cloud already has every local item.');
    return;
  }
  console.log(`Inserting ${toInsert.length} new item(s)...`);

  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('items').insert(batch);
    if (insErr) {
      console.error(`Error inserting batch at index ${i}:`, insErr.message);
      process.exit(1);
    }
    console.log(`Inserted ${i} to ${i + batch.length}...`);
  }
  console.log(`Done. Inserted ${toInsert.length} new item(s); cloud now has ${have.size + toInsert.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
