-- Create the books table
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
  pages JSONB DEFAULT '[]'::JSONB,
  pdfurl TEXT,
  coverurl TEXT
);

-- Note: If the table was already created, run these to add the missing columns:
-- ALTER TABLE books ADD COLUMN pdfurl TEXT;
-- ALTER TABLE books ADD COLUMN coverurl TEXT;

-- NOTE: You MUST create two public buckets in Supabase Storage named "pdfs" and "covers" for file uploads to work!

-- Enable Row Level Security (RLS)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow public read, allow insert for now - in production you should restrict inserts)
CREATE POLICY "Allow public read access" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON books FOR DELETE USING (true);
