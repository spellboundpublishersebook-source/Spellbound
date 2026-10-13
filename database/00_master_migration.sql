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
-- ================================================================
-- SPELLBOUND PLATFORM: FULL DATA MIGRATION INSERT SCRIPT
-- Exported on: 2026-10-13T11:01:57.067Z
-- ================================================================

-- ── Data for: settings (1 rows) ──
INSERT INTO settings ("id", "genres", "pub_types", "custom_headings", "homepage_config", "pages") VALUES ('global', '["ACCOUNTING","AGRICULTURE","ANTHROPOLOGY","AQUACULTURE, FISHERIES & FISH SCIENCE","ARCHAEOLOGY","ARCHITECTURE & PLANNING","ART & APPLIED ARTS","BENGALI LINGUISTIC","BIOMEDICAL ENGINEERING","BIOSCIENCE","BOTANY","BUSINESS & MANAGEMENT","CHEMICAL & BIOCHEMICAL ENGINEERING","HISTOLOGY","IMMUNOLOGY","IT","LINGUISTIC"]'::jsonb, '["Books","Journals","Reference works","Book Series"]'::jsonb, NULL, '{"trendingMode":"manual","newReleasesMode":"auto","trendingBookIds":["b1791471092760","b1791470938275","b1791470605353"],"createdForYouMode":"auto","newReleasesBookIds":[],"featuredAuthorsList":[],"featuredAuthorsMode":"auto","createdForYouBookIds":[]}'::jsonb, '{"faqs":{"title":"FAQs","content":"Q: How do I request a trial?\nA: Click ''Request Trial'' on the book page."},"terms":{"title":"Terms","content":"By using this platform, you agree to our terms of service."},"about-us":{"title":"About Us","content":"Welcome to World Knowledge. We provide a vast collection of books."},"contact-us":{"title":"Contact Us","content":"Reach out to us at support@worldknowledge.example.com"},"privacy-policy":{"title":"Privacy Policy","content":"We respect your privacy and protect your data."}}'::jsonb) ON CONFLICT DO NOTHING;

-- ── Data for: admins (1 rows) ──
INSERT INTO admins ("id", "password", "name") VALUES ('admin', 'admin123', 'Publisher Admin') ON CONFLICT DO NOTHING;

-- ── Data for: uploaders (1 rows) ──
INSERT INTO uploaders ("id", "password", "name", "email") VALUES ('uploader1', 'upload123', 'Editorial Team', NULL) ON CONFLICT DO NOTHING;

-- ── Data for: featured_authors (1 rows) ──
INSERT INTO featured_authors ("id", "name", "photo_url", "bio") VALUES ('author_1790585143201', 'Allen B. Downey', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/author_1790585139232.jpeg', 'na') ON CONFLICT DO NOTHING;

-- ── Data for: books (33 rows) ──
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790325517401', 'Introduction to Computer Science', 'Dr. Jean-Claude Franchitti (NYU Courant Institute)', 'IT', 'OpenStax, Rice University', 1499, '#5A3B2E', '2024', '2026', 'Color Paperback: 978‑1‑711471‑83‑9; B&W Paperback: 978‑1‑711471‑82‑2; Digital Version: 978‑1‑961584‑58‑7', '2024', 'Dr. Franchitti has over 40 years of industry experience and 30+ years of teaching, with contributions to projects like IBM InfoSphere DataStage and methodologies in enterprise architecture.', 939, '["Dr. Franchitti has over 40 years of industry experience and 30+ years of teaching, with contributions to projects like IBM InfoSphere DataStage and methodologies in enterprise architecture."]'::jsonb, NULL, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790325517401.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790326058608', 'Operating Systems and Infrastructure in Data Science', 'Josef Spillner', 'IT', 'vdf Hochschulverlag AG an der ETH Zürich', 599, '#8C3B3F', '2023', '2026', '2023', '2023', 'Introduction: Context of tools and teamwork in data science.

Concepts: Programming & DataOps: Graphs, streams, pipelines, workflows, sharding, map-reduce.

Concepts: Operating Systems: Fundamentals, current OS (Linux, macOS, Windows), processes, virtualization, networking.

Concepts: Infrastructure: Networks, HPC, cloud computing.

Applications & Tools: Shells, Python modules, package management, Git, containerization.

Middleware: Flask, Streamlit, databases, Spark.

Collaboration Platforms: Jupyter, GitLab, governance.

Execution & Orchestration: Kubernetes, cloud services.

Global Infrastructure: Open data platforms, distributed applications.

This book is essentially a bridge between operating system fundamentals and modern data science infrastructure, showing how tools, workflows, and platforms integrate to support scalable, reproducible, and collaborative data science.', 172, '["Introduction: Context of tools and teamwork in data science.\n\nConcepts: Programming & DataOps: Graphs, streams, pipelines, workflows, sharding, map-reduce.\n\nConcepts: Operating Systems: Fundamentals, current OS (Linux, macOS, Windows), processes, virtualization, networking.\n\nConcepts: Infrastructure: Networks, HPC, cloud computing.\n\nApplications & Tools: Shells, Python modules, package management, Git, containerization.\n\nMiddleware: Flask, Streamlit, databases, Spark.\n\nCollaboration Platforms: Jupyter, GitLab, governance.\n\nExecution & Orchestration: Kubernetes, cloud services.\n\nGlobal Infrastructure: Open data platforms, distributed applications.\n\nThis book is essentially a bridge between operating system fundamentals and modern data science infrastructure, showing how tools, workflows, and platforms integrate to support scalable, reproducible, and collaborative data science."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790326058608.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790326058608.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790324212104', 'The C programming language', 'Brian W. Kernighan and Dennis M. Ritchie', 'BUSINESS & MANAGEMENT', 'Prentice Hall (part of the Prentice Hall Software Series)', 999, '#A97F45', '1978', '2026', '1978', '1978', 'Introduces and defines the C programming language, including syntax, semantics, and idiomatic usage. It’s both a tutorial and a reference manual.', 288, '["Introduces and defines the C programming language, including syntax, semantics, and idiomatic usage. It’s both a tutorial and a reference manual."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790324212104.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790324212104.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791471017590', 'Mushroom Cultivation_2nd EDITION', 'BIPLAB BAGCHI', 'AGRICULTURE', 'Spellbound', 1, '#8C3B3F', '1', '1', '', '1', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791471017590.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791471017590.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790323912543', 'The Little Book of Semaphores', 'Allen B. Downey', 'BUSINESS & MANAGEMENT', 'Techno World ', 7991, '#8C3B3F', '2012', '2026', 'ISBN', 'ISBN', 'Most undergraduate Operating Systems textbooks have a module on Synchro
nization, which usually presents a set of primitives (mutexes, semaphores, mon
itors, and sometimes condition variables), and classical problems like readers
writers and producers-consumers.
WhenI took the Operating Systems class at Berkeley, and taught it at Colby
College, I got the impression that most students were able to understand the
solutions to these problems, but few would have been able to produce them, or
solve similar problems.
One reason students don’t understand this material deeply is that it takes
more time, and more practice, than most classes can spare. Synchronization is
just one of the modules competing for space in an Operating Systems class, and
I’m not sure I can argue that it is the most important. But I do think it is one
of the most challenging, interesting, and (done right) fun.
I wrote the first edition this book with the goal of identifying synchronization
idioms and patterns that could be understood in isolation and then assembled
to solve complex problems. This was a challenge, because synchronization code
doesn’t compose well; as the number of components increases, the number of
interactions grows unmanageably.
Nevertheless, I found patterns in the solutions I saw, and discovered at
least some systematic approaches to assembling solutions that are demonstrably
correct.
I had a chance to test this approach when I taught Operating Systems at
Wellesley College. I used the first edition of The Little Book of Semaphores
along with one of the standard textbooks, and I taught Synchronization as a
concurrent thread for the duration of the course. Each week I gave the students
a few pages from the book, ending with a puzzle, and sometimes a hint. I told
them not to look at the hint unless they were stumped.
I also gave them some tools for testing their solutions: a small magnetic
whiteboard where they could write code, and a stack of magnets to represent
the threads executing the code.
The results were dramatic. Given more time to absorb the material, stu
dents demonstrated a depth of understanding I had not seen before. More
importantly, most of them were able to solve most of the puzzles. In some
cases they reinvented classical solutions; in other cases they found creative new
approaches', 291, '["Most undergraduate Operating Systems textbooks have a module on Synchro\nnization, which usually presents a set of primitives (mutexes, semaphores, mon\nitors, and sometimes condition variables), and classical problems like readers\nwriters and producers-consumers.\nWhenI took the Operating Systems class at Berkeley, and taught it at Colby\nCollege, I got the impression that most students were able to understand the\nsolutions to these problems, but few would have been able to produce them, or\nsolve similar problems.\nOne reason students don’t understand this material deeply is that it takes\nmore time, and more practice, than most classes can spare. Synchronization is\njust one of the modules competing for space in an Operating Systems class, and\nI’m not sure I can argue that it is the most important. But I do think it is one\nof the most challenging, interesting, and (done right) fun.\nI wrote the first edition this book with the goal of identifying synchronization\nidioms and patterns that could be understood in isolation and then assembled\nto solve complex problems. This was a challenge, because synchronization code\ndoesn’t compose well; as the number of components increases, the number of\ninteractions grows unmanageably.\nNevertheless, I found patterns in the solutions I saw, and discovered at\nleast some systematic approaches to assembling solutions that are demonstrably\ncorrect.\nI had a chance to test this approach when I taught Operating Systems at\nWellesley College. I used the first edition of The Little Book of Semaphores\nalong with one of the standard textbooks, and I taught Synchronization as a\nconcurrent thread for the duration of the course. Each week I gave the students\na few pages from the book, ending with a puzzle, and sometimes a hint. I told\nthem not to look at the hint unless they were stumped.\nI also gave them some tools for testing their solutions: a small magnetic\nwhiteboard where they could write code, and a stack of magnets to represent\nthe threads executing the code.\nThe results were dramatic. Given more time to absorb the material, stu\ndents demonstrated a depth of understanding I had not seen before. More\nimportantly, most of them were able to solve most of the puzzles. In some\ncases they reinvented classical solutions; in other cases they found creative new\napproaches"]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790323912543.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790323912543.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790278411362', 'python', 'python', 'Fiction', 'python', 0, '#8C3B3F', 'python', 'python', 'python', 'python', '', 267, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790278411362.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790278411362.png', NULL, 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870917556', 'A Tale of Two Cities', 'Charles Dickens', 'ACCOUNTING', 'Charles Dickens', 799, '#8C3B3F', '1999', 'Charles Dickens', '', '111', 'Set in London and Paris during the French Revolution, this novel follows characters whose lives become intertwined amid political turmoil and personal sacrifice. Dickens explores justice, violence, loyalty, and redemption.', 450, '["Set in London and Paris during the French Revolution, this novel follows characters whose lives become intertwined amid political turmoil and personal sacrifice. Dickens explores justice, violence, loyalty, and redemption."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870917556.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870917556.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871080287', 'Anne of Green Gables', 'L. M. Montgomery', 'ANTHROPOLOGY', 'L. M. Montgomery', 999, '#8C3B3F', '2000', 'L. M. Montgomery', '', '111', 'Anne of Green Gables follows imaginative orphan Anne Shirley as she arrives at Green Gables and gradually finds a home and community. The story celebrates friendship, education, imagination, and belonging.', 350, '["Anne of Green Gables follows imaginative orphan Anne Shirley as she arrives at Green Gables and gradually finds a home and community. The story celebrates friendship, education, imagination, and belonging."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871080287.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871080287.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790326712155', 'Java: A Beginner’s Guide, Sixth Edition', 'Herbert Schildt', 'IT', 'McGraw‑Hill Education', 1799, '#8C3B3F', '2014', '2026', '2014', '2014', 'Java Fundamentals: Syntax, data types, operators, control statements.

Classes & Objects: Constructors, methods, inheritance, polymorphism.

Packages & Interfaces: Modular programming and abstraction.

Exception Handling: Structured error management.

Multithreading: Basics of concurrent programming.

Generics & Collections: Type‑safe programming and data structures.

JavaFX GUI Programming: Building graphical applications.

Advanced Topics: Networking, event handling, lambda expressions (Java 8).

This book is designed to take you from zero knowledge of Java to building real applications, with practical examples and self‑tests at the end of each chapter.', 1153, '["Java Fundamentals: Syntax, data types, operators, control statements.\n\nClasses & Objects: Constructors, methods, inheritance, polymorphism.\n\nPackages & Interfaces: Modular programming and abstraction.\n\nException Handling: Structured error management.\n\nMultithreading: Basics of concurrent programming.\n\nGenerics & Collections: Type‑safe programming and data structures.\n\nJavaFX GUI Programming: Building graphical applications.\n\nAdvanced Topics: Networking, event handling, lambda expressions (Java 8).\n\nThis book is designed to take you from zero knowledge of Java to building real applications, with practical examples and self‑tests at the end of each chapter."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790326712155.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790326712155.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790329408341', 'JavaScript: The Definitive Guide, 6th Edition', 'David Flanagan', 'IT', 'O’Reilly Media & Mallick Publisher ', 499, '#8C3B3F', '2011', '2026', '2011', '2011', 'Comprehensive reference and tutorial for JavaScript, covering both core language features and browser APIs.', 630, '["Comprehensive reference and tutorial for JavaScript, covering both core language features and browser APIs."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790329408341.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790329408341.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790330002303', 'An Open Guide to Data Structures and Algorithms', 'Clément Mihailescu and The AlgoExpert Team', 'IT', 'Mallick Publisher', 999, '#8C3B3F', '2024', '2026', '2024', '2024', 'Provides a clear, practical introduction to data structures and algorithms, focusing on interview preparation and real-world applications.', 350, '["Provides a clear, practical introduction to data structures and algorithms, focusing on interview preparation and real-world applications."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790330002303.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790330002303.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790327972793', 'Foundations of Computation', 'Carol Critchlow and David Eck', 'IT', 'TINT  Publisher', 899, '#8C3B3F', '2011', '2026', '2011', '2011', 'Logic and Proof: Propositional logic, Boolean algebra, deduction, induction, recursion.

Sets, Functions, and Relations: Programming with sets/functions, relational databases.

Regular Expressions & Finite-State Automata: Languages, regex, deterministic and nondeterministic automata.

Grammars: Context-free grammars, parsing, pushdown automata, general grammars.

Turing Machines & Computability: Limits of computation, undecidability.

This book is essentially a gateway into theoretical computer science, blending mathematical rigor with computer science applications.', 256, '["Logic and Proof: Propositional logic, Boolean algebra, deduction, induction, recursion.\n\nSets, Functions, and Relations: Programming with sets/functions, relational databases.\n\nRegular Expressions & Finite-State Automata: Languages, regex, deterministic and nondeterministic automata.\n\nGrammars: Context-free grammars, parsing, pushdown automata, general grammars.\n\nTuring Machines & Computability: Limits of computation, undecidability.\n\nThis book is essentially a gateway into theoretical computer science, blending mathematical rigor with computer science applications."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1790327972793.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790327972793.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791470471304', 'Biochemistry Fundamental Approac', 'S.S. Banerjee', 'BIOSCIENCE', 'Spellbound', 111, '#8C3B3F', '111', '111', '', '111', '', 111, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791470471304.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791470471304.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791470605353', 'Biofertilizer', 'Biblab Bagchi', 'BOTANY', 'Spellbound', 1, '#8C3B3F', 'a', 'a', '', 'a', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791470605353.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791470605353.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791470714818', 'FUNAMENTALS OF Immulogy', 'Dr. Suchandra Chowdhury', 'IMMUNOLOGY', 'Spellbound', 1, '#8C3B3F', '1', '1', '', '1', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791470714818.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791470714818.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791470876857', 'Histology Book', 'Das and Majumder', 'HISTOLOGY', 'Spellbound', 1, '#8C3B3F', '1', '1', '', '1', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791470876857.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791470876857.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791470938275', 'Inside Bengali Linguistics The Science of a Languag', 'Partha Sir', 'BENGALI LINGUISTIC', 'Spellbound', 1, '#8C3B3F', '1', '1', '', '1', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791470938275.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791470938275.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791471092760', 'বাংলা ভাষাতত্ত্বের অন্দরমহলে', 'DR . PARTHA CHATTAPADHAY', 'BENGALI LINGUISTIC', 'Spellbound', 1, '#8C3B3F', '1', '1', '', '1', '', 1, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791471092760.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791471092760.jpg', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870672504', 'Oliver Twist', 'Charles Dickens', 'ARCHAEOLOGY', 'Charles Dickens', 699, '#8C3B3F', '111', 'Charles Dickens', '', '111', 'Oliver Twist follows an orphan navigating poverty, exploitation, and criminal surroundings in nineteenth-century England. Dickens uses Oliver''s experiences to examine social inequality, institutional neglect, and compassion.', 780, '["Oliver Twist follows an orphan navigating poverty, exploitation, and criminal surroundings in nineteenth-century England. Dickens uses Oliver''s experiences to examine social inequality, institutional neglect, and compassion."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870672504.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870672504.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1790323579910', 'Workplace Software and Skills ', 'TAMMIE BOLLING, PELLISSIPPI STATE COMMUNITY COLLEGE  ANGELA MITCHELL, WILMINGTON COLLEGE  TANYA SCOTT, SOUTHERN NEW HAMPSHIRE UNIVERSITY/UNIVERSITY  OF ARIZONA GLOBAL CAMPUS  NYROBI WHEELER, BELLEVUE UNIVERSITY', 'ACCOUNTING', 'Openstax', 2002, '#8C3B3F', '2010', '2025', 'ISBN', 'ISBN', 'Preface 
About OpenStax 
OpenStax is part of Rice University, which is a 501(c)(3) nonprofit charitable corporation. As an educational 
initiative, it’s our mission to improve educational access and learning for everyone. Through our partnerships 
with philanthropic organizations and our alliance with other educational resource companies, we’re breaking 
down the most common barriers to learning. Because we believe that everyone should and can have access to 
knowledge. 
About OpenStax Resources 
Customization 
Workplace Software and Skills is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 
4.0 (CC BY NC-SA) license, which means that you can non-commercially distribute, remix, and build upon the 
content, as long as you provide attribution to OpenStax and its content contributors, and distribute all 
derivatives under the same license. 
Because our books are openly licensed, you are free to use the entire book or select only the sections that are 
most relevant to the needs of your course. Feel free to remix the content by assigning your students certain 
chapters and sections in your syllabus, in the order that you prefer. You can even provide a direct link in your 
syllabus to the sections in the web view of your book. 
Instructors also have the option of creating a customized version of their OpenStax book. Visit the Instructor 
Resources section of your book page on OpenStax.org for more information.', 1047, '["Technology in Everyday Life and Business \nFigure 1.1 Today’s workspaces represent decades of advances in technology. Portable personal computers, cellular communications, \ntablets, and advances in artificial intelligence have changed the way people do their jobs. (credit: modification of \"Home office, \nComputer, Desk\" by Pexels/Pixabay, CC0) \nChapter Outline \n1.1 Computing from Inception to Today \n1.2 Computer Hardware and Networks \n1.3 The Internet, Cloud Computing, and the Internet of Things \n1.4 Safety, Security, Privacy, and the Ethical Use of Technology \nChapter Scenario \nWorldCorp welcomes you to your new position within the company, a multinational corporation where the jobs \nare plentiful, and the future is bright. To be successful at WorldCorp, you will need to know a little bit about the \ncomputing past and a lot about the computing present. You’ll also need to have a sense of the computing \nfuture, especially as it pertains to business. That’s what this chapter is about. You will also need to know how to \nperform basic functions at WorldCorp using two major computer programs you’ve probably heard \nof—Microsoft 365, or more commonly known as Office, and Google Workspace. The next chapter in this \ntextbook, Essentials of Software Applications for Business, covers the basics of these programs. \nWorldCorp activities presented in other chapters will lay out specific computing tasks, such as formatting \ndocuments, creating spreadsheets, designing online slide presentations, posting on social media, and \nconducting virtual meetings. Even though the online environment changes rapidly, these are fundamental \ncomputing skills that workers need regardless of their level of employment. As you move forward in the text, \nyou will learn more about WorldCorp, its structure, products, customers, and strategies."]'::jsonb, NULL, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1790323579910.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791868782578', 'The Art of War ', 'Sun Tzu', 'ANTHROPOLOGY', 'Lionel Giles, M.A. ', 399, '#8C3B3F', '1910', 'Spellbound', '', '111', 'The Art of War is an ancient Chinese treatise on strategy, leadership, planning, and decision-making attributed to Sun Tzu. This edition features an English translation by Lionel Giles, with historical commentary and notes. Its ideas have influenced military strategy, leadership studies, and strategic thinking for centuries.', 101, '["The Art of War is an ancient Chinese treatise on strategy, leadership, planning, and decision-making attributed to Sun Tzu. This edition features an English translation by Lionel Giles, with historical commentary and notes. Its ideas have influenced military strategy, leadership studies, and strategic thinking for centuries."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791868782578.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791868782578.jpg', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791869017507', 'The Republic', 'Plato', 'ANTHROPOLOGY', 'Spellbound', 799, '#8C3B3F', '380 BCE', 'Spellbound', '', '111', 'Plato''s The Republic explores justice, political philosophy, education, morality, and the ideal state through a philosophical dialogue featuring Socrates.', 400, '["Plato''s The Republic explores justice, political philosophy, education, morality, and the ideal state through a philosophical dialogue featuring Socrates."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791869017507.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791869017507.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870091057', 'The Call of the Wild', 'Jack London', 'ANTHROPOLOGY', 'Jack London', 299, '#8C3B3F', '1903', 'Jack London', '', '111', 'his adventure novel follows Buck, a domesticated dog taken to the Yukon during the Klondike Gold Rush. Through hardship and changing circumstances, Buck discovers his instincts and adapts to life in the wilderness.', 150, '["his adventure novel follows Buck, a domesticated dog taken to the Yukon during the Klondike Gold Rush. Through hardship and changing circumstances, Buck discovers his instincts and adapts to life in the wilderness."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870091057.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870091057.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870307244', 'Wuthering Heights', 'Author: Emily Brontë', 'AGRICULTURE', 'Author: Emily Brontë', 899, '#8C3B3F', '1112', 'Author: Emily Brontë', '', '111', 'Set on the Yorkshire moors, Wuthering Heights explores the complicated relationships between Heathcliff, Catherine Earnshaw, and their families. The novel examines love, revenge, social class, and the lasting consequences of past actions.', 600, '["Set on the Yorkshire moors, Wuthering Heights explores the complicated relationships between Heathcliff, Catherine Earnshaw, and their families. The novel examines love, revenge, social class, and the lasting consequences of past actions."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870307244.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870307244.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870444119', 'Jane Eyre', 'Charlotte Brontë', 'ANTHROPOLOGY', 'Charlotte Brontë', 999, '#8C3B3F', '1847', 'Charlotte Brontë', '', '111', 'ane Eyre tells the story of an orphan who grows into an independent woman while navigating education, employment, love, and moral responsibility. The novel explores personal dignity, independence, and social expectations.', 550, '["ane Eyre tells the story of an orphan who grows into an independent woman while navigating education, employment, love, and moral responsibility. The novel explores personal dignity, independence, and social expectations."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870444119.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870444119.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791870561155', 'Great Expectations', 'Charles Dickens', 'ANTHROPOLOGY', 'Charles Dickens', 799, '#8C3B3F', '1899', 'Charles Dickens', '', '111', 'harles Dickens''s Great Expectations follows Pip, an orphan whose unexpected financial prospects change his ambitions and relationships. The novel examines social class, personal growth, loyalty, and the difference between wealth and true character.', 700, '["harles Dickens''s Great Expectations follows Pip, an orphan whose unexpected financial prospects change his ambitions and relationships. The novel examines social class, personal growth, loyalty, and the difference between wealth and true character."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791870561155.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791870561155.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791869756211', 'White Fang', 'Jack London', 'ANTHROPOLOGY', 'Macmillan', 899, '#8C3B3F', '1906', 'Macmillan', '', '111', 'White Fang follows a wild wolf-dog''s journey through the harsh wilderness and his gradual transformation through encounters with humans. T', 350, '["White Fang follows a wild wolf-dog''s journey through the harsh wilderness and his gradual transformation through encounters with humans. The novel explores survival, loyalty, and the relationship between animals and people."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791869756211.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791869756211.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871192754', 'Little Women', 'Louisa May Alcott', 'AGRICULTURE', 'Louisa May Alcott', 899, '#8C3B3F', '2001', 'Louisa May Alcott', '', '111', 'Little Women follows the four March sisters as they grow up, develop their ambitions, and face family and personal challenges. The novel explores sisterhood, independence, generosity, and the transition from childhood to adulthood.', 600, '["Little Women follows the four March sisters as they grow up, develop their ambitions, and face family and personal challenges. The novel explores sisterhood, independence, generosity, and the transition from childhood to adulthood."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871192754.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871192754.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871441918', 'The Secret Garden', 'Frances Hodgson Burnett', 'ANTHROPOLOGY', 'Frances Hodgson Burnett', 899, '#8C3B3F', '1911', 'Frances Hodgson Burnett', '', '', 'The Secret Garden follows Mary Lennox as she discovers a neglected garden on a country estate. As the garden begins to flourish, Mary and the people around her develop new friendships and perspectives.', 300, '["The Secret Garden follows Mary Lennox as she discovers a neglected garden on a country estate. As the garden begins to flourish, Mary and the people around her develop new friendships and perspectives."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871441918.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871441918.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871564533', 'The Wonderful Wizard of Oz', 'L. Frank Baum', 'ACCOUNTING', 'L. Frank Baum', 399, '#8C3B3F', '1900', 'L. Frank Baum', '', '', 'orothy is swept away from Kansas to the magical land of Oz, where she travels with companions in search of their wishes. The story explores courage, friendship, self-discovery, and the meaning of home.c', 250, '["orothy is swept away from Kansas to the magical land of Oz, where she travels with companions in search of their wishes. The story explores courage, friendship, self-discovery, and the meaning of home."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871564533.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871564533.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871722694', 'Adventures of Huckleberry Finn', 'Mark Twain', 'ACCOUNTING', 'Mark Twain', 599, '#8C3B3F', '1902', 'Mark Twain', '', '111', 'Huck Finn travels along the Mississippi River with Jim, an enslaved man seeking freedom. Their journey explores friendship, social prejudice, conscience, and the conflict between accepted customs and moral responsibility.', 400, '["Huck Finn travels along the Mississippi River with Jim, an enslaved man seeking freedom. Their journey explores friendship, social prejudice, conscience, and the conflict between accepted customs and moral responsibility."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871722694.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871722694.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791871899935', 'The Adventures of Tom Sawyer', 'Mark Twain', 'ACCOUNTING', 'Mark Twain', 699, '#8C3B3F', '1876', 'Mark Twain', '', '111', 'Tom Sawyer is an adventurous boy growing up along the Mississippi River. His escapades with friends involve mischief, mysteries, and unexpected dangers, while reflecting the experiences of childhood and small-town life.', 300, '["Tom Sawyer is an adventurous boy growing up along the Mississippi River. His escapades with friends involve mischief, mysteries, and unexpected dangers, while reflecting the experiences of childhood and small-town life."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791871899935.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791871899935.png', 'uploader1', 'published', 'Books') ON CONFLICT DO NOTHING;
INSERT INTO books ("id", "title", "author", "genre", "publisher", "price", "color", "firstpublish", "copyright", "printisbn", "onlineisbn", "description", "totalpages", "pages", "pdfurl", "coverurl", "uploaded_by", "status", "pubtype") VALUES ('b1791889205850', 'DEMO', 'DEMO', 'BIOMEDICAL ENGINEERING', 'DEMO', 1200, '#A97F45', 'DEMO', 'DEMO', '', 'DEMO', '', 120, '["This book has no content pages yet."]'::jsonb, 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/pdfs/b1791889205850.pdf', 'https://cctdfzdcnunkiriwqnyn.supabase.co/storage/v1/object/public/covers/b1791889205850.png', 'admin', 'published', 'Books') ON CONFLICT DO NOTHING;

-- ── Data for: licenses (9 rows) ──
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('DEM-5825', 'kiJcKE', 'demo', 'license', '["b1791868782578","b1791869017507"]'::jsonb, 100, 1222, '2026-09-25T07:41:15.056Z', '2026-09-25', '2026-09-25T07:41:15.056Z', 'thisisforunofficialpuroseonly@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('SHARIF', 'SHARIF', 'SHARIF', 'license', '["b1790325517401","b1790326058608","b1790324212104","b1791471017590","b1790323912543","b1790278411362","b1791870917556","b1791871080287","b1790326712155","b1790329408341","b1790330002303","b1790327972793","b1791470471304","b1791470605353","b1791470714818","b1791470876857","b1791470938275","b1791471092760","b1791870672504","b1790323579910","b1791868782578","b1791869017507","b1791869756211","b1791870091057","b1791870307244","b1791870444119","b1791870561155","b1791871192754","b1791871441918","b1791871564533","b1791871722694","b1791871899935"]'::jsonb, 100, 75, '2026-10-13', '2027-10-13', '2026-10-13T04:57:06.124Z', 'spellboundpublishersebook@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('Test', 'pmr7rf', 'Test1', 'license', '["b1790325517401","b1790326058608","b1790324212104","b1791471017590","b1790323912543","b1790278411362","b1791870917556","b1791871080287","b1790326712155","b1790329408341","b1790330002303","b1790327972793","b1791470471304","b1791470605353","b1791470714818","b1791470876857","b1791470938275","b1791471092760","b1791870672504","b1790323579910","b1791868782578","b1791869017507","b1791870091057","b1791870307244","b1791870444119","b1791870561155","b1791869756211","b1791871192754","b1791871441918","b1791871564533","b1791871722694","b1791871899935"]'::jsonb, 100, 53, '2026-10-13', '2027-11-13', '2026-10-13T10:19:43.429Z', 'sk.imran3038@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('DEM-9072', 'Tn72Pc', 'demo2', 'license', '["b1790278411362","b1790323579910","b1790323912543"]'::jsonb, 100, 123, '2026-09-30', '2027-09-30', '2026-09-30T11:25:10.059Z', 'spellboundpublishersebook@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('GVC-1042', 'Kx82Lq', 'Green Valley College', 'license', '["b1","b2","b3","b4","b5"]'::jsonb, 500, 45000, '2026-01-01', '2026-10-02', '2025-12-20', NULL) ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('TIN-5994', 'YszVa2', 'TINT', 'license', '["b1790278411362","b1790323579910","b1790323912543"]'::jsonb, 100, 1, '2026-09-25', '2026-09-25', '2026-09-25', NULL) ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('Spellbound', 'SPELLBOUND', 'Spellbound', 'license', '["b1791471092760","b1791471017590","b1791470938275","b1791470876857","b1791470714818","b1791470605353","b1791470471304","b1790278411362","b1790323579910","b1790323912543","b1790325517401","b1790326058608","b1790324212104","b1790326712155","b1790329408341","b1790330002303","b1790327972793"]'::jsonb, 100, 1222, '2026-10-08', '2026-10-08', '2026-10-08T14:26:31.683Z', 'spellboundpublishersebook@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('SPELLBOUND', 'SPELLBOUND', 'SPELLBOUND', 'license', '["b1790278411362","b1790323579910","b1790323912543","b1790325517401","b1790326058608","b1790324212104","b1790326712155","b1790329408341","b1790330002303","b1790327972793","b1791471092760","b1791471017590","b1791470938275","b1791470876857","b1791470714818","b1791470605353","b1791470471304"]'::jsonb, 100, 111, '2026-10-08', '2027-10-08', '2026-10-08T14:52:54.697Z', 'spellboundpublishersebook@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO licenses ("id", "password", "name", "type", "bookids", "seats", "price", "startdate", "enddate", "createdat", "email") VALUES ('DEM-3785', '5bhQwp', 'demo1', 'license', '["b1790323579910","b1790278411362","b1790323912543","b1790325517401","b1790326058608","b1790324212104","b1790326712155","b1790329408341","b1790330002303","b1790327972793"]'::jsonb, 100, 12222, '2026-09-30', '2027-09-30', '2026-09-30T11:22:02.559Z', 'spellboundpublishersebook@gmail.com') ON CONFLICT DO NOTHING;

-- ── Data for: trial_requests (14 rows) ──
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790330089937', 'Sharif Roy', 'sharifmolla567@gamil.com', 'TINT', 'approved', '2026-09-25', 'yFi2SJ', '2026-10-25', NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790333366293', 'Jisan Mallick ', 'rm2602600@gmail.com', 'TICT ', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790333439511', 'Tushar Mallick ', 'rm2602500@gmail.com', 'Techno International Newtown ', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790333609871', 'Ankita Mallick', 'rm2602500@gmail.com', 'Techno India College of Technology ', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790333868498', 'Ranita Molla ', 'rm2602500@gmail.com', 'Techno International ', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790334020827', 'Hitiui', 'rm2602500@gmail.com', 'Tict', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790334179730', 'Tusar Khan ', 'rm2602500@gmail.com', 'Hil climb institute ', 'rejected', '2026-09-25', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790334207853', 'Hola ', 'jisanmallick0522@gmail.com', 'Independent reader', 'approved', '2026-09-25', 'CG3FPg', '2026-10-25', NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790493439979', 'Nisha', 'nishashikary@gmail.com', 'Independent reader', 'rejected', '2026-09-27', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790580324048', 'Sreya Ray', 'rm2602500@gmail.com', 'TINT', 'approved', '2026-09-28', 'BJMBSh', '2026-10-28', NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790581127711', 'sg', 'sayantanghosh689@gmail.com', 'tint', 'approved', '2026-09-28', 'GSF3nv', '2026-10-28', NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790580768147', 'Sreya Ray', 'rm2602500@gmail.com', 'Tint', 'rejected', '2026-09-28', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1790766604915', 'rezwanparvej', 'rezwanparvej@gmail.com', 'Independent reader', 'approved', '2026-09-30', 'skHUym', '2026-10-30', '["b1790278411362"]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO trial_requests ("id", "name", "email", "institution", "status", "requestedat", "password", "expiresat", "bookids") VALUES ('t1791886469827', 'Sk Imran', 'sk.imran3038@gmail.com', 'Aliah University ', 'approved', '2026-10-13', 'pMr7rf', '2026-11-13', '["b1790325517401","b1790326058608","b1790324212104","b1791471017590","b1790323912543","b1790278411362","b1791870917556","b1791871080287","b1790326712155","b1790329408341","b1790330002303","b1790327972793","b1791470471304","b1791470605353","b1791470714818","b1791470876857","b1791470938275","b1791471092760","b1791870672504","b1790323579910","b1791868782578","b1791869017507","b1791870091057","b1791870307244","b1791870444119","b1791870561155","b1791869756211","b1791871192754","b1791871441918","b1791871564533","b1791871722694","b1791871899935"]'::jsonb) ON CONFLICT DO NOTHING;

-- ── Data for: readers (6 rows) ──
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('b6c38971-34fc-47dc-9875-051367c3dd81', 'sharifmolla567@gamil.com', 'yFi2SJ', 'Sharif Roy', 'sharifmolla567@gamil.com', 'free_trial', NULL, '2026-09-25T00:00:00+00:00', '2026-10-25T00:00:00+00:00', '2026-10-02T12:18:55.557221+00:00') ON CONFLICT DO NOTHING;
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('bae64fb8-2138-48e6-a8a0-86e0f48e8e57', 'jisanmallick0522@gmail.com', 'CG3FPg', 'Hola ', 'jisanmallick0522@gmail.com', 'free_trial', NULL, '2026-09-25T00:00:00+00:00', '2026-10-25T00:00:00+00:00', '2026-10-02T12:18:55.557221+00:00') ON CONFLICT DO NOTHING;
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('1ba40aa4-3ef8-45a0-8d9d-6199203e5b3f', 'rm2602500@gmail.com', 'BJMBSh', 'Sreya Ray', 'rm2602500@gmail.com', 'free_trial', NULL, '2026-09-28T00:00:00+00:00', '2026-10-28T00:00:00+00:00', '2026-10-02T12:18:55.557221+00:00') ON CONFLICT DO NOTHING;
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('857eed1b-8c4d-4a35-b921-ebac6e138b15', 'sayantanghosh689@gmail.com', 'GSF3nv', 'sg', 'sayantanghosh689@gmail.com', 'free_trial', NULL, '2026-09-28T00:00:00+00:00', '2026-10-28T00:00:00+00:00', '2026-10-02T12:18:55.557221+00:00') ON CONFLICT DO NOTHING;
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('ccc93570-fa6a-455e-adc3-27ae1a95774b', 'rezwanparvej@gmail.com', 'skHUym', 'rezwanparvej', 'rezwanparvej@gmail.com', 'free_trial', '["b1790278411362"]'::jsonb, '2026-09-30T00:00:00+00:00', '2026-10-30T00:00:00+00:00', '2026-10-02T12:18:55.557221+00:00') ON CONFLICT DO NOTHING;
INSERT INTO readers ("id", "login_id", "password", "name", "email", "account_type", "bookids", "startdate", "enddate", "created_at") VALUES ('d08a0c1b-e782-4201-bbaa-1ef40603a6d5', 'sk.imran3038@gmail.com', 'pMr7rf', 'Sk Imran', 'sk.imran3038@gmail.com', 'free_trial', '["b1790325517401","b1790326058608","b1790324212104","b1791471017590","b1790323912543","b1790278411362","b1791870917556","b1791871080287","b1790326712155","b1790329408341","b1790330002303","b1790327972793","b1791470471304","b1791470605353","b1791470714818","b1791470876857","b1791470938275","b1791471092760","b1791870672504","b1790323579910","b1791868782578","b1791869017507","b1791870091057","b1791870307244","b1791870444119","b1791870561155","b1791869756211","b1791871192754","b1791871441918","b1791871564533","b1791871722694","b1791871899935"]'::jsonb, '2026-10-13T00:00:00+00:00', '2026-11-13T00:00:00+00:00', '2026-10-13T10:14:49.589894+00:00') ON CONFLICT DO NOTHING;

-- ── Data for: subscribers (1 rows) ──
INSERT INTO subscribers ("id", "email", "subscribed_at") VALUES ('66b25251-4c01-44d7-98f3-bf87918b0413', 'spellboundpublishersebook@gmail.com', '2026-10-13T06:01:17.117546+00:00') ON CONFLICT DO NOTHING;

-- ── Data for: reading_sessions (1 rows) ──
INSERT INTO reading_sessions ("id", "license_id", "book_id", "last_active") VALUES ('sess_1791888662824', 'Test', 'b1791870917556', '2026-10-13T10:51:34.981+00:00') ON CONFLICT DO NOTHING;

-- ── Data for: book_views (45 rows) ──
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790321660335', 'b1790278411362', 'TIN-5994', '2026-09-25T07:34:20.335+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790321660619', 'b1790278411362', 'TIN-5994', '2026-09-25T07:34:20.619+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790326808101', 'b1790278411362', 'TIN-5994', '2026-09-25T09:00:08.101+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790326808440', 'b1790278411362', 'TIN-5994', '2026-09-25T09:00:08.44+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790943762455', 'b1790323912543', 'DEM-9072', '2026-10-02T12:22:42.455+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790943762686', 'b1790323912543', 'DEM-9072', '2026-10-02T12:22:42.686+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790944456943', 'b1790278411362', 'DEM-9072', '2026-10-02T12:34:16.943+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790944456981', 'b1790278411362', 'DEM-9072', '2026-10-02T12:34:16.981+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790945497417', 'b1790278411362', 'DEM-9072', '2026-10-02T12:51:37.417+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790945497437', 'b1790278411362', 'DEM-9072', '2026-10-02T12:51:37.437+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790946393814', 'b1790323579910', 'DEM-9072', '2026-10-02T13:06:33.814+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790946393840', 'b1790323579910', 'DEM-9072', '2026-10-02T13:06:33.84+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790952824336', 'b1790323579910', 'DEM-9072', '2026-10-02T14:53:44.336+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790952824343', 'b1790323579910', 'DEM-9072', '2026-10-02T14:53:44.343+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790953623149', 'b1790323579910', 'DEM-9072', '2026-10-02T15:07:03.149+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1790953623716', 'b1790323579910', 'DEM-9072', '2026-10-02T15:07:03.716+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791453713259', 'b1790278411362', 'DEM-9072', '2026-10-08T10:01:53.259+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791453713389', 'b1790278411362', 'DEM-9072', '2026-10-08T10:01:53.389+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791454917538', 'b1790323912543', 'DEM-9072', '2026-10-08T10:21:57.538+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791454917700', 'b1790323912543', 'DEM-9072', '2026-10-08T10:21:57.7+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791467749550', 'b1790278411362', 'DEM-9072', '2026-10-08T13:55:49.55+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791467749557', 'b1790278411362', 'DEM-9072', '2026-10-08T13:55:49.557+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791468324091', 'b1790323912543', 'DEM-9072', '2026-10-08T14:05:24.091+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791468324348', 'b1790323912543', 'DEM-9072', '2026-10-08T14:05:24.348+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471236719', 'b1791471017590', 'SPELLBOUND', '2026-10-08T14:53:56.719+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471236912', 'b1791471017590', 'SPELLBOUND', '2026-10-08T14:53:56.912+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471408712', 'b1791470876857', 'SPELLBOUND', '2026-10-08T14:56:48.712+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471408840', 'b1791470876857', 'SPELLBOUND', '2026-10-08T14:56:48.84+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471413834', 'b1791470714818', 'SPELLBOUND', '2026-10-08T14:56:53.834+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791471414120', 'b1791470714818', 'SPELLBOUND', '2026-10-08T14:56:54.12+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791472393524', 'b1791470714818', 'SPELLBOUND', '2026-10-08T15:13:13.524+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791472545208', 'b1791470714818', 'SPELLBOUND', '2026-10-08T15:15:45.208+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791472545791', 'b1791470714818', 'SPELLBOUND', '2026-10-08T15:15:45.791+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791473123327', 'b1791470714818', 'SPELLBOUND', '2026-10-08T15:25:23.327+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791473123988', 'b1791470714818', 'SPELLBOUND', '2026-10-08T15:25:23.988+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791870495278', 'b1790323579910', 'SHARIF', '2026-10-13T05:48:15.278+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791870495394', 'b1790323579910', 'SHARIF', '2026-10-13T05:48:15.394+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791871307625', 'b1791471017590', 'SHARIF', '2026-10-13T06:01:47.625+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791871307819', 'b1791471017590', 'SHARIF', '2026-10-13T06:01:47.819+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791871745512', 'b1790329408341', 'SHARIF', '2026-10-13T06:09:05.512+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791871745707', 'b1790329408341', 'SHARIF', '2026-10-13T06:09:05.707+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791884546475', 'b1791470938275', 'SHARIF', '2026-10-13T09:42:26.475+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791884546112', 'b1791470938275', 'SHARIF', '2026-10-13T09:42:26.112+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791888663504', 'b1791870917556', 'Test', '2026-10-13T10:51:03.504+00:00') ON CONFLICT DO NOTHING;
INSERT INTO book_views ("id", "book_id", "license_id", "viewed_at") VALUES ('v_1791888663630', 'b1791870917556', 'Test', '2026-10-13T10:51:03.63+00:00') ON CONFLICT DO NOTHING;
