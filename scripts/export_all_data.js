import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../src/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'database');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (Array.isArray(val) || typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportAll() {
  console.log('🔄 Exporting full database from current Supabase...');
  
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

  const exportData = {};
  let sqlStatements = [];

  sqlStatements.push(`-- ================================================================`);
  sqlStatements.push(`-- SPELLBOUND PLATFORM: FULL DATA MIGRATION INSERT SCRIPT`);
  sqlStatements.push(`-- Exported on: ${new Date().toISOString()}`);
  sqlStatements.push(`-- ================================================================\n`);

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`⚠️ Warning fetching ${table}:`, error.message);
        exportData[table] = [];
        continue;
      }
      exportData[table] = data || [];
      console.log(`✅ ${table}: exported ${data?.length || 0} rows`);

      if (data && data.length > 0) {
        sqlStatements.push(`-- ── Data for: ${table} (${data.length} rows) ──`);
        for (const row of data) {
          const cols = Object.keys(row);
          const vals = cols.map(c => escapeSql(row[c]));
          sqlStatements.push(
            `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;`
          );
        }
        sqlStatements.push('');
      }
    } catch (err) {
      console.error(`❌ Error on ${table}:`, err.message);
    }
  }

  // Write JSON export
  const jsonPath = path.join(dbDir, '02_data_export.json');
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`📁 Saved full JSON backup to: ${jsonPath}`);

  // Write SQL insert script
  const sqlPath = path.join(dbDir, '02_data_insert.sql');
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`📁 Saved full SQL migration insert script to: ${sqlPath}`);

  console.log('🎉 Full database export complete!');
}

exportAll().catch(err => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
