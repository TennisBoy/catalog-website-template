import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/db-upload.mjs <email> <password>');
  process.exit(1);
}

const [email, password] = args;

const config = JSON.parse(fs.readFileSync('public/config.json', 'utf8'));
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upload() {
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.error('Authentication failed:', authError.message);
    process.exit(1);
  }
  
  console.log('Successfully authenticated with Supabase.');
  
  const localData = JSON.parse(fs.readFileSync('public/catalog.json', 'utf8'));
  console.log(`Loaded ${localData.length} items from public/catalog.json.`);
  
  const mapped = localData.map(item => ({
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
    updated_at: item.updatedAt
  }));
  
  console.log('Uploading items in batches to Supabase...');
  
  const batchSize = 50;
  for (let i = 0; i < mapped.length; i += batchSize) {
    const batch = mapped.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('items')
      .insert(batch);
      
    if (insertError) {
      console.error(`Error uploading batch starting at index ${i}:`, insertError.message);
      process.exit(1);
    }
    console.log(`Uploaded batch ${i} to ${i + batch.length}...`);
  }
  
  console.log('All items successfully uploaded to Supabase!');
}

upload().catch(err => {
  console.error(err);
  process.exit(1);
});
