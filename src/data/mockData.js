// ---------------------------------------------------------------------------
// MOCK DATA LAYER
// This stands in for a real backend + database. Everything here lives only
// in browser memory and resets on refresh. When this connects to a real
// database (e.g. Postgres via Supabase), these arrays become tables and
// every function below becomes an API call.
// ---------------------------------------------------------------------------

const spineColors = [
  "#8C3B3F", "#A97F45", "#2C4A3C", "#5A3B2E", "#41332A",
  "#6E2A34", "#1F3A30", "#9C7A44", "#3E5C4E", "#B4894F",
  "#3A2A22", "#2E4F42",
];

const samplePages = (title) => [
  `${title}\n\nChapter One\n\nThis is a placeholder page of body text standing in for the book's real content. In the finished platform, this text (or a scanned/typeset page image) is streamed from the server and rendered here — never downloaded as a file.`,
  `Chapter One, continued.\n\nThe reader can move forward and back through pages like this one. Each page carries a quiet watermark identifying who is reading it, so anything copied out of this view can be traced back to the account.`,
  `Chapter Two\n\nRight-click, text selection, and printing are disabled in this view. Common developer-tools shortcuts are also blocked as a deterrent — though, as discussed, no web platform can make screen capture technically impossible.`,
  `Chapter Two, continued.\n\nWhen an institution's license expires, or a trial's thirty days end, this page simply stops being reachable — access is checked on every page turn, not just at login.`,
];

export const initialBooks = [
  { id: "b1", title: "The Long Ledger", author: "Marguerite Faye", genre: "Fiction", publisher: "Aldine House", price: 12, color: spineColors[0], pages: samplePages("The Long Ledger") },
  { id: "b2", title: "Pricing Without Guesswork", author: "D. R. Okafor", genre: "Business", publisher: "Meridian Press", price: 24, color: spineColors[1], pages: samplePages("Pricing Without Guesswork") },
  { id: "b3", title: "A Short History of Tides", author: "Wren Callahan", genre: "Science", publisher: "Northlight Books", price: 18, color: spineColors[2], pages: samplePages("A Short History of Tides") },
  { id: "b4", title: "The Weight of Empires", author: "Halden Voss", genre: "History", publisher: "Aldine House", price: 21, color: spineColors[3], pages: samplePages("The Weight of Empires") },
  { id: "b5", title: "Citation & Style, Revised", author: "Athenaeum Editorial", genre: "Reference", publisher: "Athenaeum Press", price: 9, color: spineColors[4], pages: samplePages("Citation & Style, Revised") },
  { id: "b6", title: "Small Hours", author: "Ines Larkspur", genre: "Poetry", publisher: "Northlight Books", price: 10, color: spineColors[5], pages: samplePages("Small Hours") },
  { id: "b7", title: "Nine Winters in Kestrel Bay", author: "Marguerite Faye", genre: "Fiction", publisher: "Meridian Press", price: 13, color: spineColors[6], pages: samplePages("Nine Winters in Kestrel Bay") },
  { id: "b8", title: "The Founder's Ledger", author: "D. R. Okafor", genre: "Business", publisher: "Aldine House", price: 26, color: spineColors[7], pages: samplePages("The Founder's Ledger") },
  { id: "b9", title: "Field Notes on Rivers", author: "Wren Callahan", genre: "Science", publisher: "Northlight Books", price: 16, color: spineColors[8], pages: samplePages("Field Notes on Rivers") },
  { id: "b10", title: "Letters from the Interior", author: "Halden Voss", genre: "History", publisher: "Meridian Press", price: 19, color: spineColors[9], pages: samplePages("Letters from the Interior") },
  { id: "b11", title: "The Quiet Ledger of Debts", author: "Ines Larkspur", genre: "Fiction", publisher: "Athenaeum Press", price: 14, color: spineColors[10], pages: samplePages("The Quiet Ledger of Debts") },
  { id: "b12", title: "Systems, Briefly", author: "D. R. Okafor", genre: "Reference", publisher: "Meridian Press", price: 11, color: spineColors[11], pages: samplePages("Systems, Briefly") },
];

// Super admin — in a real system this is a securely hashed credential, not a
// plain string sitting in front-end code.
export const superAdmin = { id: "admin", password: "admin123", name: "Publisher Admin" };

export const initialUploaders = [
  { id: "uploader1", password: "upload123", name: "Editorial Team" },
];

// Institution licenses (bulk orders) — this is the record a Super Admin
// creates when a college buys a custom bundle for a fixed term.
export const initialLicenses = [
  {
    id: "GVC-1042",
    password: "Kx82Lq",
    name: "Green Valley College",
    type: "license",
    bookIds: ["b1", "b2", "b3", "b4", "b5"],
    seats: 500,
    price: 45000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    createdAt: "2025-12-20",
  },
];

export const initialTrialRequests = [
  {
    id: "t1",
    name: "Ritika Sen",
    email: "ritika.sen@example.com",
    institution: "Independent reader",
    status: "pending", // pending | approved | rejected
    requestedAt: new Date().toISOString().slice(0, 10),
    password: null,
    expiresAt: null,
  },
];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(dateStr) {
  return daysUntil(dateStr) < 0;
}

export function genCredentialId(prefix) {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

export function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
