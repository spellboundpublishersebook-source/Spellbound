-- ==============================================================================
-- SPELLBOUND / ATHENAEUM PLATFORM - COMPLETE DATABASE SCHEMA & MIGRATION
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to set up or migrate the database.
-- It is idempotent: safe to run on fresh databases or existing ones.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT NOT NULL,
  publisher TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#1E293B',
  firstpublish TEXT,
  copyright TEXT,
  printisbn TEXT,
  onlineisbn TEXT,
  description TEXT,
  totalpages NUMERIC,
  pages JSONB DEFAULT '[]'::JSONB,
  pdfurl TEXT,
  coverurl TEXT,
  pubtype TEXT DEFAULT 'Books',
  uploaded_by TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created in an earlier version
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdfurl TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS coverurl TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS pubtype TEXT DEFAULT 'Books';
ALTER TABLE books ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE books ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- UPLOADERS TABLE
CREATE TABLE IF NOT EXISTS uploaders (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE uploaders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE uploaders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- LICENSES TABLE (Institutions)
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'license',
  bookids JSONB DEFAULT '[]'::JSONB,
  seats INTEGER DEFAULT 100,
  price NUMERIC DEFAULT 0,
  startdate TEXT,
  enddate TEXT,
  createdat TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS bookids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- TRIAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS trial_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT,
  status TEXT DEFAULT 'pending',
  requestedat TEXT,
  password TEXT,
  expiresat TEXT,
  bookids JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS bookids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- READERS TABLE (Approved individual & trial readers)
CREATE TABLE IF NOT EXISTS readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  email TEXT,
  account_type TEXT DEFAULT 'free_trial',
  bookids JSONB DEFAULT '[]'::JSONB,
  startdate TIMESTAMPTZ DEFAULT NOW(),
  enddate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE readers ADD COLUMN IF NOT EXISTS bookids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE readers ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'free_trial';

-- SUBSCRIBERS TABLE (Newsletter subscriptions)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- READING SESSIONS TABLE (Live seat and concurrency tracking)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- BOOK VIEWS TABLE (Analytics and popularity tracking)
CREATE TABLE IF NOT EXISTS book_views (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  license_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEATURED AUTHORS TABLE
CREATE TABLE IF NOT EXISTS featured_authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  subject TEXT,
  body TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS TABLE (Global portal configuration, genres, static pages)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  genres JSONB DEFAULT '[]'::JSONB,
  pub_types JSONB DEFAULT '[]'::JSONB,
  custom_headings JSONB DEFAULT '[]'::JSONB,
  homepage_config JSONB DEFAULT '{}'::JSONB,
  pages JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- BOOKS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read books" ON books;
DROP POLICY IF EXISTS "Allow public insert books" ON books;
DROP POLICY IF EXISTS "Allow public update books" ON books;
DROP POLICY IF EXISTS "Allow public delete books" ON books;
CREATE POLICY "Allow public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public insert books" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update books" ON books FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete books" ON books FOR DELETE USING (true);

-- ADMINS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access admins" ON admins;
CREATE POLICY "Allow public access admins" ON admins FOR ALL USING (true) WITH CHECK (true);

-- UPLOADERS
ALTER TABLE uploaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access uploaders" ON uploaders;
CREATE POLICY "Allow public access uploaders" ON uploaders FOR ALL USING (true) WITH CHECK (true);

-- LICENSES
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access licenses" ON licenses;
CREATE POLICY "Allow public access licenses" ON licenses FOR ALL USING (true) WITH CHECK (true);

-- TRIAL REQUESTS
ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access trial_requests" ON trial_requests;
CREATE POLICY "Allow public access trial_requests" ON trial_requests FOR ALL USING (true) WITH CHECK (true);

-- READERS
ALTER TABLE readers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access readers" ON readers;
CREATE POLICY "Allow public access readers" ON readers FOR ALL USING (true) WITH CHECK (true);

-- SUBSCRIBERS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access subscribers" ON subscribers;
CREATE POLICY "Allow public access subscribers" ON subscribers FOR ALL USING (true) WITH CHECK (true);

-- READING SESSIONS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access reading_sessions" ON reading_sessions;
CREATE POLICY "Allow public access reading_sessions" ON reading_sessions FOR ALL USING (true) WITH CHECK (true);

-- BOOK VIEWS
ALTER TABLE book_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access book_views" ON book_views;
CREATE POLICY "Allow public access book_views" ON book_views FOR ALL USING (true) WITH CHECK (true);

-- FEATURED AUTHORS
ALTER TABLE featured_authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access featured_authors" ON featured_authors;
CREATE POLICY "Allow public access featured_authors" ON featured_authors FOR ALL USING (true) WITH CHECK (true);

-- EMAIL TEMPLATES
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access email_templates" ON email_templates;
CREATE POLICY "Allow public access email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access settings" ON settings;
CREATE POLICY "Allow public access settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. STORAGE BUCKETS (COVERS & PDFS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies
DROP POLICY IF EXISTS "Allow public read covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete covers" ON storage.objects;

CREATE POLICY "Allow public read covers" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('covers', 'pdfs'));

CREATE POLICY "Allow public upload covers" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id IN ('covers', 'pdfs'));

CREATE POLICY "Allow public update covers" ON storage.objects 
  FOR UPDATE USING (bucket_id IN ('covers', 'pdfs')) WITH CHECK (bucket_id IN ('covers', 'pdfs'));

CREATE POLICY "Allow public delete covers" ON storage.objects 
  FOR DELETE USING (bucket_id IN ('covers', 'pdfs'));

-- ==============================================================================
-- 5. INITIAL SEED DATA
-- ==============================================================================

-- Default Admin Account
INSERT INTO admins (id, password, name, email) 
VALUES ('admin', 'admin123', 'Publisher Admin', 'spellboudpd@gmail.com') 
ON CONFLICT (id) DO NOTHING;

-- Default Uploader Account
INSERT INTO uploaders (id, password, name, email) 
VALUES ('uploader1', 'upload123', 'Editorial Team', 'editorial@spellboudpd.in') 
ON CONFLICT (id) DO NOTHING;

-- Default Email Templates
INSERT INTO email_templates (id, name, subject, body) VALUES
(
  'trial_approved',
  'trial_approved',
  'Your 30-Day Trial is Approved! 🎉',
  'Hello {{name}},\n\nYour trial request for SpellBound ( Publishers and Distributors ) has been approved!\n\nHere are your login details:\nLogin ID: {{id}}\nPassword: {{password}}\n\nThis trial gives you full access for 30 days and will expire on {{endDate}}.\n\nEnjoy reading!\n- The SpellBound ( Publishers and Distributors ) Team'
),
(
  'trial_rejected',
  'trial_rejected',
  'Update on your Trial Request',
  'Hello {{name}},\n\nThank you for your interest in SpellBound ( Publishers and Distributors ). Unfortunately, we are unable to approve your trial request at this time.\n\nIf you believe this was a mistake or you are representing an institution, please reply to this email.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team'
),
(
  'institution_created',
  'institution_created',
  'Your Institution Access Details - SpellBound ( Publishers and Distributors )',
  'Hello {{name}},\n\nYour institution has been successfully registered on SpellBound ( Publishers and Distributors ).\n\nHere are your official access details:\nInstitution ID (Login): {{id}}\nPassword: {{password}}\n\nPurchasing Date: {{startDate}}\nExpiration Date: {{endDate}}\n\nYour members can use these credentials to read the books in your purchased catalog.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team'
)
ON CONFLICT (id) DO UPDATE SET 
  subject = EXCLUDED.subject, 
  body = EXCLUDED.body;

-- Default Global Settings
INSERT INTO settings (id, genres, pub_types, custom_headings, homepage_config, pages) VALUES (
  'global',
  '[
    "ACCOUNTING", "AGRICULTURE", "ANTHROPOLOGY", "AQUACULTURE, FISHERIES & FISH SCIENCE", 
    "ARCHAEOLOGY", "ARCHITECTURE & PLANNING", "ART & APPLIED ARTS", "BIOMEDICAL ENGINEERING", 
    "BUSINESS & MANAGEMENT", "CHEMICAL & BIOCHEMICAL ENGINEERING"
  ]'::jsonb,
  '["Books", "Journals", "Reference works", "Book Series"]'::jsonb,
  '[]'::jsonb,
  '{
    "trendingMode": "auto", 
    "trendingBookIds": [], 
    "newReleasesMode": "auto", 
    "newReleasesBookIds": [],
    "createdForYouMode": "auto", 
    "createdForYouBookIds": [], 
    "featuredAuthorsMode": "auto", 
    "featuredAuthorsList": []
  }'::jsonb,
  '{
    "about-us": {
      "title": "About Us",
      "content": "Welcome to SPELLBOUND Publishers & Distributors. We provide a vast collection of books, academic journals, and research publications curated for institutions and individual readers."
    },
    "contact-us": {
      "title": "Contact Us",
      "content": "Reach out to us using the following details:\n\nAddress: 113, Vivekananda Rd, Manicktala, Azad Hind Bag, Kolkata, West Bengal 700006\nPhone: 6289998227\nEmail: spellboudpd@gmail.com\nWebsite: www.spellboudpd.in"
    },
    "terms": {
      "title": "Terms of Service",
      "content": "Welcome to SPELLBOUND Publishers & Distributors. By accessing or using our digital library platform, you agree to be bound by these Terms of Service.\n\n1. License and Access\nYour institution or personal account has been granted a limited, non-exclusive, non-transferable license to access the digital catalog for the duration specified in your license agreement. You may not share your login credentials with unauthorized users.\n\n2. Intellectual Property\nAll books, journals, covers, and written materials provided on this platform are protected by copyright laws. You may not reproduce, distribute, or create derivative works from the content without express written permission from the respective publishers.\n\n3. Account Restrictions\nWe reserve the right to suspend or terminate accounts that exhibit suspicious activity, share credentials, or violate our copyright policies.\n\n4. Changes to Terms\nWe may update these terms at any time. Continued use of the platform constitutes your agreement to the updated terms."
    },
    "privacy-policy": {
      "title": "Privacy Policy",
      "content": "At SPELLBOUND Publishers & Distributors, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.\n\n1. Information We Collect\nWe collect the information you provide when creating an account or requesting a trial, including your name, email address, and institutional affiliation.\n\n2. How We Use Your Information\n- To provide access to your licensed digital library.\n- To notify you about expiring licenses or upcoming renewals.\n- To improve our platform and user experience.\n\n3. Data Protection\nWe implement industry-standard security measures to ensure your data is protected against unauthorized access, alteration, or disclosure. We do not sell your personal data to third parties."
    },
    "faqs": {
      "title": "Frequently Asked Questions",
      "content": "Frequently Asked Questions\n\nQ: How do I request a trial for my institution?\nA: You can request a trial by clicking the Request Trial button on any book in the catalog. Fill out the form with your details, and our administrative team will review your request and issue a 30-day trial pass.\n\nQ: How do I know when my access expires?\nA: You can view your remaining access days directly in your Reader Dashboard. If your access is expiring soon, the dashboard will display a warning indicator.\n\nQ: Can I read books offline?\nA: Currently, books are securely streamed directly to your browser through our secure reader to protect publisher copyrights. An active internet connection is required.\n\nQ: Why can''t I take screenshots of the books?\nA: To comply with our publisher agreements and protect intellectual property, our secure reader restricts screenshot capabilities and right-click saving.\n\nQ: Who do I contact for technical support?\nA: Please use the Contact Us page or reach out to spellboudpd@gmail.com."
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Synchronize any approved trials to the readers table
INSERT INTO readers (login_id, password, name, email, account_type, bookids, startdate, enddate)
SELECT email, password, name, email, 'free_trial', bookids, NULLIF(requestedat, '')::TIMESTAMPTZ, NULLIF(expiresat, '')::TIMESTAMPTZ
FROM trial_requests
WHERE status = 'approved' AND email IS NOT NULL AND password IS NOT NULL
ON CONFLICT (login_id) DO NOTHING;

-- ==============================================================================
-- 6. RELOAD SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
