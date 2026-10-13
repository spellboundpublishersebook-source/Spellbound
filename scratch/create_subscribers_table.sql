CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert subscribers" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read subscribers" ON subscribers FOR SELECT USING (true);
CREATE POLICY "Allow admin delete subscribers" ON subscribers FOR DELETE USING (true);
