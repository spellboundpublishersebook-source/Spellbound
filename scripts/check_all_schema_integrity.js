import pg from 'pg';
const { Client } = pg;

async function checkSchema() {
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
  console.log('Connected to PostgreSQL for full schema audit...\n');

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

  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = '${t}'
      ORDER BY ordinal_position;
    `);
    console.log(`📋 Table: ${t} (${res.rows.length} columns)`);
    console.log('   ' + res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  await client.end();
}

checkSchema().catch(console.error);
