import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Promote "Needs review" -> "Cataloged" for items whose placement fields are all
// filled (quantity > 0, section, shelf), then resync public/catalog.json from cloud.
//
// Usage:
//   node scripts/db-promote.mjs <email> <password>            (apply changes)
//   node scripts/db-promote.mjs <email> <password> --dry-run  (preview only)

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [email, password] = args.filter((a) => !a.startsWith('--'));
if (!email || !password) {
  console.error('Usage: node scripts/db-promote.mjs <email> <password> [--dry-run]');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync('public/config.json', 'utf8'));
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const qualifies = (i) =>
  i.status === 'Needs review' && Number(i.quantity) > 0 && filled(i.section) && filled(i.shelf);

function toLocal(row) {
  const item = {
    id: row.id,
    title: row.title,
    quantity: row.quantity,
    category: row.category,
    materialType: row.material_type,
    location: { section: row.section || '', shelf: row.shelf || '' },
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (filled(row.author)) item.author = row.author;
  if (filled(row.isbn)) item.isbn = row.isbn;
  if (filled(row.notes)) item.notes = row.notes;
  if (filled(row.condition)) item.condition = row.condition;
  return item;
}

async function main() {
  console.log(`Signing in as ${email}...`);
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Authentication failed:', authError.message);
    process.exit(1);
  }
  console.log('Authenticated.');

  const { data: all, error: selErr } = await supabase.from('items').select('*');
  if (selErr) {
    console.error('Fetch failed:', selErr.message);
    process.exit(1);
  }
  console.log(`Fetched ${all.length} items from cloud.`);

  const targets = all.filter(qualifies);
  console.log(`\n${targets.length} "Needs review" items qualify for promotion (qty>0 + section + shelf):`);
  for (const t of targets) console.log(`  - ${t.title}  [qty ${t.quantity}, ${t.section}/${t.shelf}]`);

  if (dryRun) {
    console.log('\n--dry-run: no changes written.');
    return;
  }
  if (targets.length === 0) {
    console.log('\nNothing to promote.');
    return;
  }

  const ids = targets.map((t) => t.id);
  const { error: updErr } = await supabase
    .from('items')
    .update({ status: 'Cataloged', updated_at: new Date().toISOString() })
    .in('id', ids);
  if (updErr) {
    console.error('Update failed:', updErr.message);
    process.exit(1);
  }
  console.log(`\nPromoted ${ids.length} items to "Cataloged".`);

  // Resync local catalog.json from the now-updated cloud state.
  const { data: fresh, error: refErr } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: true });
  if (refErr) {
    console.error('Resync fetch failed:', refErr.message);
    process.exit(1);
  }
  const local = fresh.map(toLocal);
  fs.writeFileSync('public/catalog.json', JSON.stringify(local, null, 2) + '\n', 'utf8');
  console.log(`Resynced public/catalog.json from cloud (${local.length} items).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
