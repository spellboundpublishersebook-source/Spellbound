-- 1. Add email and contact info to uploaders and licenses
ALTER TABLE uploaders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add uploaded_by and status to books
ALTER TABLE books ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 3. Create reading_sessions table (for enforcing seats)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON reading_sessions FOR ALL USING (true) WITH CHECK (true);

-- 4. Create book_views table (for analytics)
CREATE TABLE IF NOT EXISTS book_views (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  license_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE book_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON book_views FOR ALL USING (true) WITH CHECK (true);

-- Reload schema
NOTIFY pgrst, 'reload schema';
