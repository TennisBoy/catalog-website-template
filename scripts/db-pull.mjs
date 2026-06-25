import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read-only sync: pull the live cloud catalog into public/catalog.json.
// Uses the public anon key (public read), so no login is required.
//
// Usage: node scripts/db-pull.mjs

const config = JSON.parse(fs.readFileSync('public/config.json', 'utf8'));
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

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
  // Preserve the dismiss flags so the snapshot round-trips "Keep both" /
  // "no shelf needed" decisions instead of dropping them.
  if (row.shelf_dismissed) item.shelfDismissed = true;
  if (row.dup_dismissed) item.dupDismissed = true;
  return item;
}

async function main() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  const local = data.map(toLocal);
  fs.writeFileSync('public/catalog.json', JSON.stringify(local, null, 2) + '\n', 'utf8');
  const byStatus = {};
  for (const i of local) byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  console.log(`Pulled ${local.length} items into public/catalog.json.`);
  console.log('Status breakdown:', JSON.stringify(byStatus));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
