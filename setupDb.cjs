const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:baszys-maVsaw-turxi4@db.cctdfzdcnunkiriwqnyn.supabase.co:5432/postgres'
});

async function setup() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres!");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        genre TEXT NOT NULL,
        publisher TEXT NOT NULL,
        price NUMERIC NOT NULL DEFAULT 0,
        color TEXT NOT NULL,
        firstpublish TEXT,
        copyright TEXT,
        printisbn TEXT,
        onlineisbn TEXT,
        description TEXT,
        totalpages NUMERIC,
        pages JSONB DEFAULT '[]'::JSONB
      );
    `);
    console.log("Table 'books' created or already exists.");

    await client.query(`
      ALTER TABLE books ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow public read access" ON books;
      CREATE POLICY "Allow public read access" ON books FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Allow public insert access" ON books;
      CREATE POLICY "Allow public insert access" ON books FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Allow public delete access" ON books;
      CREATE POLICY "Allow public delete access" ON books FOR DELETE USING (true);
    `);
    console.log("RLS policies configured.");
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

setup();
