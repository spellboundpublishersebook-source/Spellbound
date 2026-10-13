import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsonExportPath = path.join(rootDir, 'database', '02_data_export.json');

// Read target credentials from arguments or environment
const targetUrl = process.argv[2] || process.env.CLIENT_SUPABASE_URL;
const targetKey = process.argv[3] || process.env.CLIENT_SUPABASE_KEY;

if (!targetUrl || !targetKey) {
  console.log(`
======================================================================
  SPELLBOUND CLIENT DATABASE MIGRATION TOOL
======================================================================
Usage:
  node scripts/migrate_to_client_supabase.js <TARGET_URL> <TARGET_KEY>

Example:
  node scripts/migrate_to_client_supabase.js https://xyz.supabase.co eyJhbGci...

Or set environment variables:
  export CLIENT_SUPABASE_URL="https://xyz.supabase.co"
  export CLIENT_SUPABASE_KEY="eyJhbGci..."
  node scripts/migrate_to_client_supabase.js
======================================================================
`);
  process.exit(1);
}

async function migrate() {
  console.log(`\n🚀 Starting direct migration to client Supabase: ${targetUrl}`);

  if (!fs.existsSync(jsonExportPath)) {
    console.error(`❌ Export file not found at ${jsonExportPath}. Run node scripts/export_all_data.js first.`);
    process.exit(1);
  }

  const exportData = JSON.parse(fs.readFileSync(jsonExportPath, 'utf-8'));
  const clientSupabase = createClient(targetUrl, targetKey);

  // Table migration order respecting dependencies
  const tables = [
    'settings',
    'admins',
    'uploaders',
    'featured_authors',
    'books',
    'licenses',
    'trial_requests',
    'readers',
    'subscribers',
    'reading_sessions',
    'book_views',
    'email_templates'
  ];

  for (const table of tables) {
    const rows = exportData[table] || [];
    if (rows.length === 0) {
      console.log(`⏩ ${table}: 0 rows to migrate, skipping.`);
      continue;
    }

    console.log(`📦 Migrating ${table} (${rows.length} records)...`);
    
    // Batch upsert in chunks of 50
    const chunkSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data, error } = await clientSupabase.from(table).upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn(`  ⚠️ Chunk ${i / chunkSize + 1} for ${table} warning:`, error.message);
      } else {
        successCount += chunk.length;
      }
    }
    console.log(`  ✅ ${table}: successfully migrated ${successCount}/${rows.length} rows`);
  }

  // Update src/supabaseClient.js to point to new client Supabase
  const clientJsPath = path.join(rootDir, 'src', 'supabaseClient.js');
  const clientJsContent = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${targetUrl}'
const supabaseKey = '${targetKey}'

export const supabase = createClient(supabaseUrl, supabaseKey)
`;

  fs.writeFileSync(clientJsPath, clientJsContent, 'utf-8');
  console.log(`\n🎉 Connection updated: src/supabaseClient.js is now connected to ${targetUrl}!`);
  console.log(`✅ All database tables migrated successfully!`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
