import { supabase } from "./supabaseClient";

export const palette = {
  ink: "#241A14",
  inkSoft: "#4A3B30",
  paper: "#F5EFE1",
  paper2: "#EDE1C8",
  cream: "#FBF7EC",
  forest: "#1F3A30",
  forest2: "#16281F",
  forestTint: "#E7EEE9",
  brass: "#A97F45",
  brassLight: "#D9B77D",
  burgundy: "#6E2A34",
  line: "#e7ded0",
  danger: "#B4423A",
  success: "#2C6E49",
};
export const fontDisplay = { fontFamily: "'Fraunces', Georgia, serif" };
export const fontBody = { fontFamily: "'Source Sans 3', -apple-system, sans-serif" };

const DEFAULT_GENRES = [
  "ACCOUNTING", "AGRICULTURE", "ANTHROPOLOGY", "AQUACULTURE, FISHERIES & FISH SCIENCE", 
  "ARCHAEOLOGY", "ARCHITECTURE & PLANNING", "ART & APPLIED ARTS", "BIOMEDICAL ENGINEERING", 
  "BUSINESS & MANAGEMENT", "CHEMICAL & BIOCHEMICAL ENGINEERING"
];

const DEFAULT_PUB_TYPES = ["Books", "Journals", "Reference works", "Book Series"];

const DEFAULT_HOMEPAGE_CONFIG = {
  trendingMode: "auto", trendingBookIds: [], newReleasesMode: "auto", newReleasesBookIds: [],
  createdForYouMode: "auto", createdForYouBookIds: [], featuredAuthorsMode: "auto", featuredAuthorsList: []
};

export const DEFAULT_PAGES = {
  "about-us": { title: "About Us", content: "Welcome to SPELLBOUND Publishers & Distributors. We provide a vast collection of books." },
  "contact-us": { title: "Contact Us", content: "Reach out to us using the following details:\n\nAddress: 113, Vivekananda Rd, Manicktala, Azad Hind Bag, Kolkata, West Bengal 700006\nPhone: 6289998227\nEmail: spellboudpd@gmail.com\nWebsite: www.spellboudpd.in" },
  "terms": { title: "Terms of Service", content: `Welcome to SPELLBOUND Publishers & Distributors. By accessing or using our digital library platform, you agree to be bound by these Terms of Service.

1. License and Access
Your institution or personal account has been granted a limited, non-exclusive, non-transferable license to access the digital catalog for the duration specified in your license agreement. You may not share your login credentials with unauthorized users.

2. Intellectual Property
All books, journals, covers, and written materials provided on this platform are protected by copyright laws. You may not reproduce, distribute, or create derivative works from the content without express written permission from the respective publishers.

3. Account Restrictions
We reserve the right to suspend or terminate accounts that exhibit suspicious activity, share credentials, or violate our copyright policies.

4. Changes to Terms
We may update these terms at any time. Continued use of the platform constitutes your agreement to the updated terms.

If you have any questions regarding these terms, please contact us.` },
  "privacy-policy": { title: "Privacy Policy", content: `At SPELLBOUND Publishers & Distributors, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.

1. Information We Collect
We collect the information you provide when creating an account or requesting a trial, including your name, email address, and institutional affiliation.

2. How We Use Your Information
- To provide access to your licensed digital library.
- To notify you about expiring licenses or upcoming renewals.
- To improve our platform and user experience.

3. Data Protection
We implement industry-standard security measures to ensure your data is protected against unauthorized access, alteration, or disclosure. We do not sell your personal data to third parties.

4. Cookies
Our platform uses minimal cookies strictly necessary for maintaining your logged-in session and preferences.

5. Your Rights
You have the right to request access to the personal data we hold about you and request its deletion. Please contact our support team for any privacy-related requests.` },
  "faqs": { title: "Frequently Asked Questions", content: `Frequently Asked Questions

Q: How do I request a trial for my institution?
A: You can request a trial by clicking the "Request Trial" button on any book in the catalog. Fill out the form with your details, and our administrative team will review your request and issue a 14-day trial pass.

Q: How do I know when my access expires?
A: You can view your remaining access days directly in your Reader Dashboard. If your access is expiring soon, the dashboard will display a warning indicator.

Q: Can I read books offline?
A: Currently, books are securely streamed directly to your browser through our secure reader to protect publisher copyrights. An active internet connection is required.

Q: Why can't I take screenshots of the books?
A: To comply with our publisher agreements and protect intellectual property, our secure reader restricts screenshot capabilities and right-click saving. 

Q: Who do I contact for technical support?
A: Please use the "Contact Us" page or reach out to your institution's library administrator.` },
};

async function syncToDB(key, data) {
  try {
    const payload = {};
    payload[key] = data;
    await supabase.from('settings').upsert({ id: 'global', ...payload });
  } catch (err) { console.error("Failed to sync to DB:", err); }
}

export function getGenres() {
  const saved = localStorage.getItem("athenaeum_genres");
  return saved ? JSON.parse(saved) : DEFAULT_GENRES;
}
export function setGenres(genres) {
  localStorage.setItem("athenaeum_genres", JSON.stringify(genres));
  syncToDB('genres', genres);
}

export function getPubTypes() {
  const saved = localStorage.getItem("athenaeum_pubtypes");
  return saved ? JSON.parse(saved) : DEFAULT_PUB_TYPES;
}
export function setPubTypes(types) {
  localStorage.setItem("athenaeum_pubtypes", JSON.stringify(types));
  syncToDB('pub_types', types);
}

export function getCustomHeadings() {
  const saved = localStorage.getItem("athenaeum_custom_headings");
  return saved ? JSON.parse(saved) : [];
}
export function setCustomHeadings(headings) {
  localStorage.setItem("athenaeum_custom_headings", JSON.stringify(headings));
  syncToDB('custom_headings', headings);
}

export function getHomepageConfig() {
  const saved = localStorage.getItem("athenaeum_homepage_config");
  return saved ? JSON.parse(saved) : DEFAULT_HOMEPAGE_CONFIG;
}
export function setHomepageConfig(config) {
  localStorage.setItem("athenaeum_homepage_config", JSON.stringify(config));
  syncToDB('homepage_config', config);
}

export function getPages() {
  const local = localStorage.getItem("athenaeum_pages");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (!parsed["terms"]?.content || parsed["terms"].content.length < 150) {
        parsed["terms"] = DEFAULT_PAGES["terms"];
      }
      if (!parsed["privacy-policy"]?.content || parsed["privacy-policy"].content.length < 150) {
        parsed["privacy-policy"] = DEFAULT_PAGES["privacy-policy"];
      }
      if (!parsed["faqs"]?.content || parsed["faqs"].content.length < 150) {
        parsed["faqs"] = DEFAULT_PAGES["faqs"];
      }
      parsed["contact-us"] = DEFAULT_PAGES["contact-us"];
      return { ...DEFAULT_PAGES, ...parsed };
    } catch (e) {
      console.error("Failed to parse pages:", e);
    }
  }
  return DEFAULT_PAGES;
}
export function setPages(pages) {
  localStorage.setItem("athenaeum_pages", JSON.stringify(pages));
  syncToDB('pages', pages);
}

export async function fetchSettingsFromDB() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (data) {
      if (data.genres) localStorage.setItem("athenaeum_genres", JSON.stringify(data.genres));
      if (data.pub_types) localStorage.setItem("athenaeum_pubtypes", JSON.stringify(data.pub_types));
      if (data.custom_headings) localStorage.setItem("athenaeum_custom_headings", JSON.stringify(data.custom_headings));
      if (data.homepage_config) localStorage.setItem("athenaeum_homepage_config", JSON.stringify(data.homepage_config));
      if (data.pages) localStorage.setItem("athenaeum_pages", JSON.stringify(data.pages));
    }
  } catch (err) { console.error("Failed to fetch settings from DB:", err); }
}

export const GENRES = getGenres();
export const PUB_TYPES = getPubTypes();
