import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sqlFile = path.join(rootDir, 'database', '00_master_migration.sql');

async function runMigration() {
  console.log('🚀 Connecting to Client Supabase PostgreSQL instance...');

  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.hmhbbwldajchdxjeidni',
    password: 'Spellbound2026@#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  await client.connect();
  console.log('✅ Connected successfully to Postgres database!');

  console.log(`📄 Reading ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log('⚡ Executing full schema creation & data migration SQL...');
  await client.query(sql);
  console.log('✅ Schema and data successfully applied to database!');

  // Verify all table row counts
  console.log('\n🔍 Verifying table row counts in client database:');
  const tables = [
    'books',
    'admins',
    'uploaders',
    'licenses',
    'trial_requests',
    'readers',
    'subscribers',
    'featured_authors',
    'settings',
    'reading_sessions',
    'book_views',
    'email_templates'
  ];

  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${t};`);
      console.log(`  • ${t.padEnd(20)}: ${res.rows[0].count} records`);
    } catch(err) {
      console.warn(`  ⚠️ ${t.padEnd(20)}: ${err.message}`);
    }
  }

  // Verify storage buckets
  try {
    const bucketRes = await client.query(`SELECT id, name, public FROM storage.buckets WHERE id IN ('covers', 'pdfs');`);
    console.log('\n🪣 Storage buckets configured:');
    bucketRes.rows.forEach(b => console.log(`  • ${b.name} (public: ${b.public})`));
  } catch(err) {
    console.warn('Storage check:', err.message);
  }

  await client.end();
  console.log('\n🎉 Direct Postgres migration finished successfully!');
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
