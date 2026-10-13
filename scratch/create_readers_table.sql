CREATE TABLE readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  email TEXT,
  account_type TEXT DEFAULT 'free_trial',
  bookids JSONB,
  startdate TIMESTAMPTZ DEFAULT NOW(),
  enddate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE readers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read readers" ON readers FOR SELECT USING (true);
CREATE POLICY "Allow insert readers" ON readers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update readers" ON readers FOR UPDATE USING (true);
CREATE POLICY "Allow delete readers" ON readers FOR DELETE USING (true);

-- Migrate existing approved trials to the new readers table
INSERT INTO readers (login_id, password, name, email, account_type, bookids, startdate, enddate)
SELECT email, password, name, email, 'free_trial', bookids, NULLIF(requestedat, '')::TIMESTAMPTZ, NULLIF(expiresat, '')::TIMESTAMPTZ
FROM trial_requests
WHERE status = 'approved'
ON CONFLICT (login_id) DO NOTHING;
