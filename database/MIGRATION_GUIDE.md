# 🚀 SpellBound Platform - Database Migration Guide

This guide details how to migrate or initialize the complete Supabase database for the **SpellBound (Publishers & Distributors)** platform.

---

## 📋 What This Migration Sets Up

1. **All 12 Core Tables**:
   - `books` (Full catalog, PDF streaming URLs, covers, metadata, genres, publication types)
   - `admins` (Administrator accounts)
   - `uploaders` (Editorial and uploader accounts)
   - `licenses` (Institutional accounts, allocated seats, book access lists)
   - `trial_requests` (Free trial applications, approval tracking, assigned book IDs)
   - `readers` (Active individual and trial readers)
   - `subscribers` (Newsletter email subscriptions)
   - `reading_sessions` (Concurrent seat limit enforcement and real-time activity)
   - `book_views` (Popularity counters and reading analytics)
   - `featured_authors` (Author profiles, photos, and biographies)
   - `email_templates` (Customizable notification templates for trial & license approvals)
   - `settings` (Global portal configuration, genres list, publication types, customized static pages)

2. **Storage Buckets**:
   - `covers` (Public storage bucket for book cover images)
   - `pdfs` (Public storage bucket for streamed digital books)

3. **Row Level Security (RLS)**:
   - Configures permissive policies for the frontend web application and secure admin operations.

4. **Seed Data**:
   - Default Administrator: `admin` / `admin123`
   - Default Uploader: `uploader1` / `upload123`
   - Default Global Portal Settings (Genres, Publication Types, Static Pages)
   - Default Email Templates (`trial_approved`, `trial_rejected`, `institution_created`)

---

## ⚡ Method 1: Using Supabase Dashboard (Recommended - 2 Minutes)

1. **Open Supabase**:
   Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project.

2. **Open the SQL Editor**:
   Click on the **SQL Editor** tab (the `>_` terminal icon) on the left sidebar.

3. **Run the Migration**:
   - Click **New Query**.
   - Copy the entire contents of [`database/01_complete_schema.sql`](file:///Users/sharifmolla/Downloads/athenaeum-platform/database/01_complete_schema.sql).
   - Paste into the query editor and click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).

4. **Verify Storage Buckets**:
   - In Supabase, navigate to **Storage**.
   - Verify that both `covers` and `pdfs` buckets exist and have the **Public** badge enabled.
   - If either bucket does not show Public, click the three dots (`...`) next to the bucket name, choose **Edit bucket**, and toggle **Public bucket** to `ON`.

5. **Connect the App**:
   Open [`src/supabaseClient.js`](file:///Users/sharifmolla/Downloads/athenaeum-platform/src/supabaseClient.js) and ensure your Project URL and Anon Public Key are set:
   ```javascript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_PUBLIC_KEY'

   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

---

## 💻 Method 2: Using Postgres Direct Connection (`psql`)

If you have direct database connection access or are using the command line:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:5432/postgres" -f database/01_complete_schema.sql
```

---

## ✅ Post-Migration Verification Checklist

- [ ] Run `SELECT count(*) FROM books;` in the SQL Editor to verify table creation.
- [ ] Log in to Admin Panel (`/` -> **Admin Login**) using `admin` / `admin123`.
- [ ] Check **Settings** tab in Admin Panel to verify that default genres and static pages load properly.
- [ ] Test uploading a book with PDF & cover in **Uploader Panel** (`uploader1` / `upload123`).
- [ ] Test requesting a free trial from the **Free Trial** page.
- [ ] Test newsletter subscription in the catalog footer.
