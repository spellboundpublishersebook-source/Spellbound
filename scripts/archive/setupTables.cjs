const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:baszys-maVsaw-turxi4@db.cctdfzdcnunkiriwqnyn.supabase.co:5432/postgres'
});

async function setup() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres!");
    
    // 1. Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL
      );
    `);
    
    // 2. Create uploaders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaders (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL
      );
    `);

    // 3. Create licenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        bookids JSONB,
        seats INTEGER,
        price NUMERIC,
        startdate TEXT,
        enddate TEXT,
        createdat TEXT
      );
    `);

    // 4. Create trial_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trial_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        institution TEXT,
        status TEXT,
        requestedat TEXT,
        password TEXT,
        expiresat TEXT
      );
    `);

    console.log("Tables created successfully.");

    // Insert initial data (ignore if already exists)
    await client.query(`
      INSERT INTO admins (id, password, name) VALUES ('admin', 'admin123', 'Publisher Admin') ON CONFLICT (id) DO NOTHING;
      INSERT INTO uploaders (id, password, name) VALUES ('uploader1', 'upload123', 'Editorial Team') ON CONFLICT (id) DO NOTHING;
      INSERT INTO licenses (id, password, name, type, bookids, seats, price, startdate, enddate, createdat) 
        VALUES ('GVC-1042', 'Kx82Lq', 'Green Valley College', 'license', '["b1", "b2", "b3", "b4", "b5"]'::jsonb, 500, 45000, '2026-01-01', '2026-12-31', '2025-12-20') ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Initial database users inserted.");

    // Configure RLS (Allow public read/write for now so the frontend works without JWTs)
    await client.query(`
      ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public access" ON admins;
      CREATE POLICY "Allow public access" ON admins FOR ALL USING (true) WITH CHECK (true);

      ALTER TABLE uploaders ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public access" ON uploaders;
      CREATE POLICY "Allow public access" ON uploaders FOR ALL USING (true) WITH CHECK (true);

      ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public access" ON licenses;
      CREATE POLICY "Allow public access" ON licenses FOR ALL USING (true) WITH CHECK (true);

      ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public access" ON trial_requests;
      CREATE POLICY "Allow public access" ON trial_requests FOR ALL USING (true) WITH CHECK (true);
    `);
    
    console.log("RLS policies configured.");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

setup();
