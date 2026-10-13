# 📚 SpellBound (Publishers & Distributors) - Digital Library Platform

A high-performance digital library and academic publication platform tailored for publishers, universities, research institutions, and readers.

---

## 🌟 Key Features

- **Public Book Catalog**:
  - Live search with instant keyword autocomplete.
  - Multi-attribute filtering (Genre, Publication Type, Author, Publication Year).
  - Tactile 3D book cover cards with elevation animations and dual-layer hover effects.
  - Curated carousels: "Trending Now", "New Releases", "Featured Authors", and "Created For You".

- **Secure Reader & Content Protection**:
  - In-browser digital reader for PDFs and text publications.
  - Watermarking, right-click restrictions, and print/download prevention.
  - Electron client-level screenshot protection via `win.setContentProtection(true)`.
  - Dynamic page jumping, text-to-speech narration, bookmarking, and progress caching.

- **Institution & License Management**:
  - Concurrent seat tracking and active reader session monitoring.
  - Granular title-by-title catalog access assignment for institutional licenses.
  - Automated credential emails and expiration countdown indicators.

- **Free Trial Workflow**:
  - Readers can apply for a 30-day trial with instant admin review.
  - Customizable title access per trial.
  - Automated approval/rejection notification emails via EmailJS.

- **Editorial & Uploader Panel**:
  - Direct PDF uploading and cover image processing via Supabase Storage.
  - Metadata editor (ISBN, DOI, publisher, copyright, publication year, genres).
  - Draft vs. published status controls.

- **Administrative Control Suite**:
  - Homepage layout curation (Custom vs. Auto modes for Trending and New Releases).
  - Custom genre and publication type taxonomy management.
  - Editable static pages (Terms of Service, Privacy Policy, FAQs, About Us, Contact Us).
  - Real-time reading analytics and views tracking.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Storage Buckets)
- **Desktop Wrapper**: Electron (Cross-platform with native content protection)
- **Email Delivery**: EmailJS

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Shariiffx/-athenaeum-platform-.git
cd -athenaeum-platform-

# Install project dependencies
npm install
```

### 3. Database Configuration
1. Open [`database/MIGRATION_GUIDE.md`](file:///Users/sharifmolla/Downloads/athenaeum-platform/database/MIGRATION_GUIDE.md).
2. Run the single-file schema migration in your Supabase SQL Editor:
   [`database/01_complete_schema.sql`](file:///Users/sharifmolla/Downloads/athenaeum-platform/database/01_complete_schema.sql).
3. Connect your Supabase credentials in [`src/supabaseClient.js`](file:///Users/sharifmolla/Downloads/athenaeum-platform/src/supabaseClient.js):
   ```javascript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

### 4. Running the Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 5. Running the Desktop Application (Electron)
```bash
npm run start:app
```

### 6. Production Web Build
```bash
npm run build
```
The optimized production bundle will be output to the `dist/` folder.

---

## 🔑 Default Accounts (Seed Data)

| Role | Login ID | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full Administrative & Settings Access |
| **Uploader** | `uploader1` | `upload123` | Catalog Uploads & Metadata Editing |
| **Institution** | `GVC-1042` | `Kx82Lq` | Licensed Institutional Reader Access |

*(Credentials can be modified directly in the Admin Panel or Supabase database)*

---

## 📁 Project Structure

```
├── database/
│   ├── 01_complete_schema.sql    # Master database schema, RLS, and seed data
│   └── MIGRATION_GUIDE.md        # Step-by-step database setup instructions
├── public/                       # Static public assets (brand logo)
├── src/
│   ├── components/               # Reusable UI components & animations
│   │   ├── AnimatedSweepButton.jsx # High-performance counter-mask sweep button
│   │   ├── BookLoader.jsx        # 3D page-flip reader initialization loader
│   │   └── Header.jsx            # Main site navigation and profile drawer
│   ├── pages/                    # Main views
│   │   ├── AdminPanel.jsx        # Administrative portal & curation
│   │   ├── AuthorsPage.jsx       # Featured author index
│   │   ├── BookDetailsPage.jsx   # Publication overview and citation generator
│   │   ├── CatalogPage.jsx       # Public browsing catalog with multi-filters
│   │   ├── LoginPage.jsx         # Unified authentication portal
│   │   ├── ReaderDashboard.jsx   # Multi-category institution reader dashboard
│   │   ├── SecureReader.jsx      # Protected in-browser book reader
│   │   ├── StaticPage.jsx        # Dynamic legal and information pages
│   │   ├── TrialPage.jsx         # 30-day reader trial request form
│   │   └── UploaderPanel.jsx     # Editorial publishing console
│   ├── data/                     # Mock fallback datasets
│   ├── email.js                  # EmailJS notification dispatchers
│   ├── supabaseClient.js         # Supabase client connector
│   └── theme.js                  # Typography, colors, and dynamic settings
├── main.cjs                      # Electron main entry point
├── package.json                  # Dependencies and scripts
└── vite.config.js                # Vite build configuration
```

---

## 📄 License
All rights reserved © SpellBound (Publishers & Distributors).
