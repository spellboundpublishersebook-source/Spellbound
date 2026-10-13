import { supabase } from "../supabaseClient";
import React, { useState, useMemo } from "react";
import { Plus, Trash2, Check, X, Users, UploadCloud, Gift, LayoutGrid, Search, BookOpen, Settings, LayoutTemplate, Mail } from "lucide-react";
import { palette, fontDisplay, getGenres, setGenres as saveGenres, getPubTypes, setPubTypes as savePubTypes, getCustomHeadings, getHomepageConfig, setHomepageConfig, getPages, setPages } from "../theme";
import { addMonths, today, daysUntil, genCredentialId, genPassword } from "../data/mockData";
import Button from "../components/Button";
import { Field, Select, Modal, Badge, StatCard } from "../components/UI";
import UploaderPanel from "./UploaderPanel";

const TABS = [
  { id: "institutions", label: "Institutions", icon: Users },
  { id: "readers", label: "Individual Users", icon: Users },
  { id: "uploaders", label: "Uploaders", icon: UploadCloud },
  { id: "trials", label: "Trial requests", icon: Gift },
  { id: "books", label: "Manage Books", icon: BookOpen },
  { id: "authors", label: "Featured Authors", icon: Users },
  { id: "filters", label: "Global Filters", icon: Settings },
  { id: "homepage", label: "Homepage Layout", icon: LayoutTemplate },
  { id: "pages", label: "Static Pages", icon: BookOpen },
  { id: "emails", label: "Email Templates", icon: Mail },
  { id: "subscribers", label: "Subscribers", icon: Mail },
];

export default function AdminPanel({
  books, licenses, uploaders, trialRequests, readers = [], subscribers = [], emailTemplates, featuredAuthors,
  onCreateLicense, onRevokeLicense, onToggleLicenseStatus, onEditInstitutionAccess,
  onAddUploader, onRemoveUploader,
  onApproveTrial, onRejectTrial, onEditTrialAccess, onResendTrialEmail, onResendInstitutionEmail, onUpdateEmailTemplate,
  onAddFeaturedAuthor, onRemoveFeaturedAuthor,
  onAddBook, onEditBook, onDeleteBook, dbStatus, onNavigate
}) {
  const [tab, setTab] = useState("institutions");

  const pendingTrials = trialRequests.filter((t) => t.status === "pending").length;

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-1 text-[#111111]" style={fontDisplay}>Super Admin</h1>
        <p className="text-sm mb-8 text-black font-medium">Full control over institutions, uploaders, and trial approvals.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Books in catalog" value={books.length} icon={LayoutGrid} />
          <StatCard label="Active institutions" value={licenses.filter((l) => daysUntil(l.endDate) >= 0).length} icon={Users} />
          <StatCard label="Pending trial requests" value={pendingTrials} icon={Gift} />
        </div>

        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto pb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.id ? 'text-[#111111] border-[#FDD132]' : 'text-black border-transparent hover:text-black hover:border-gray-300'}`}
            >
              <t.icon size={15} strokeWidth={1.8} />
              {t.label}
              {t.id === "trials" && pendingTrials > 0 && <Badge tone="warn">{pendingTrials}</Badge>}
            </button>
          ))}
        </div>

        {tab === "books" && (
          <UploaderPanel 
            books={books} 
            onAddBook={onAddBook} 
            onEditBook={onEditBook}
            onDeleteBook={onDeleteBook} 
            embedded={true}
            dbStatus={dbStatus}
            onNavigate={onNavigate}
          />
        )}
        {tab === "institutions" && (
          <InstitutionsTab books={books} licenses={licenses} onCreateLicense={onCreateLicense} onRevokeLicense={onRevokeLicense} onToggleLicenseStatus={onToggleLicenseStatus} onResendEmail={onResendInstitutionEmail} onEditAccess={onEditInstitutionAccess} />
        )}
        {tab === "readers" && (
          <ReadersTab books={books} readers={readers} />
        )}
        {tab === "uploaders" && (
          <UploadersTab uploaders={uploaders} onAddUploader={onAddUploader} onRemoveUploader={onRemoveUploader} />
        )}
        {tab === "trials" && (
          <TrialsTab books={books} trialRequests={trialRequests} onApproveTrial={onApproveTrial} onRejectTrial={onRejectTrial} onResendEmail={onResendTrialEmail} onEditAccess={onEditTrialAccess} />
        )}
        {tab === "authors" && (
          <FeaturedAuthorsTab books={books} authors={featuredAuthors} onAddAuthor={onAddFeaturedAuthor} onRemoveAuthor={onRemoveFeaturedAuthor} />
        )}
        {tab === "filters" && <FiltersTab />}
        {tab === "homepage" && <HomepageTab books={books} />}
        {tab === "pages" && <PagesTab />}
        {tab === "emails" && <EmailsTab emailTemplates={emailTemplates} onUpdateEmailTemplate={onUpdateEmailTemplate} />}
        {tab === "subscribers" && <SubscribersTab subscribers={subscribers} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function InstitutionsTab({ books, licenses, onCreateLicense, onRevokeLicense, onToggleLicenseStatus, onResendEmail, onEditAccess }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState(100);
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [duration, setDuration] = useState(12);
  const [customId, setCustomId] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [pubTypeFilter, setPubTypeFilter] = useState("All");
  const [authorFilter, setAuthorFilter] = useState("All");
  const [issuedCreds, setIssuedCreds] = useState(null);
  const [isTest, setIsTest] = useState(false);

  const filteredBooks = useMemo(() => books.filter((b) =>
    (genreFilter === "All" || b.genre === genreFilter) &&
    (pubTypeFilter === "All" || b.pubType === pubTypeFilter) &&
    (authorFilter === "All" || b.author === authorFilter) &&
    ((b.title || "").toLowerCase().includes((search || "").toLowerCase()) || (b.author || "").toLowerCase().includes((search || "").toLowerCase()))
  ), [books, search, genreFilter, pubTypeFilter, authorFilter]);

  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();
  const allPubTypes = Array.from(new Set(books.map(b => b.pubType).filter(Boolean))).sort();

  const [editLicenseId, setEditLicenseId] = useState(null);
  const [showEditAccessModal, setShowEditAccessModal] = useState(false);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  
  function openEditAccess(license) {
    setEditLicenseId(license.id);
    setSelected(license.bookIds || []);
    setShowEditAccessModal(true);
  }
  
  function handleSaveAccess() {
    onEditAccess(editLicenseId, selected);
    setShowEditAccessModal(false);
    setEditLicenseId(null);
    setSelected([]);
  }

  function handleCreate(e) {
    e.preventDefault();
    const id = customId.trim() || genCredentialId(name.slice(0, 3).toUpperCase() || "COL");
    const pass = customPassword.trim() || genPassword();
    
    let actualStart, actualEnd;
    if (isTest) {
      const now = new Date();
      actualStart = now.toISOString();
      actualEnd = new Date(now.getTime() + 5 * 60000).toISOString();
    } else {
      actualStart = startDate;
      actualEnd = addMonths(startDate, duration);
    }
    
    onCreateLicense({
      id, password: pass, name, email, type: "license",
      bookIds: selected, seats: Number(seats), price: Number(price) || 0,
      startDate: actualStart, endDate: actualEnd, createdAt: new Date().toISOString(),
    });
    setIssuedCreds({ id, password: pass, endDate: actualEnd });
    setName(""); setEmail(""); setSeats(100); setPrice(""); setSelected([]); setStartDate(today()); setDuration(12); setIsTest(false); setCustomId(""); setCustomPassword("");
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button onClick={() => setShowForm(true)}><Plus size={16} strokeWidth={2} /> Create institution license</Button>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Institution", "Login ID", "Password", "Books", "Price", "Term", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-bold text-black uppercase tracking-wider text-[11px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {licenses.map((l) => {
              const left = daysUntil(l.endDate);
              const expired = left < 0;
              const soon = left <= 15 && !expired;
              const isOffline = l.type === "offline";
              return (
                <tr key={l.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{l.name}</td>
                  <td className="px-4 py-3"><code>{l.id}</code></td>
                  <td className="px-4 py-3"><code>{l.password}</code></td>
                  <td className="px-4 py-3">{l.bookIds.length} titles</td>
                  <td className="px-4 py-3">₹{l.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    {isOffline ? <Badge tone="bad">Offline</Badge> : expired ? <Badge tone="bad">Expired</Badge> : soon ? <Badge tone="warn">{left}d left</Badge> : <Badge tone="good">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 flex gap-3 items-center h-full flex-wrap">
                    {l.email && (
                      <button onClick={() => onResendEmail && onResendEmail(l.id)} className="text-xs font-semibold flex items-center gap-1 text-[#D4A017] hover:text-[#b8860b]">
                        <Mail size={12} /> Resend Email
                      </button>
                    )}
                    <button onClick={() => openEditAccess(l)} className="text-xs font-semibold text-black uppercase tracking-wider">
                      Edit Access
                    </button>
                    {!expired && (
                      <button onClick={() => onToggleLicenseStatus(l.id, !isOffline)} className={`text-[11px] font-semibold uppercase tracking-wider ${isOffline ? "text-green-600" : "text-yellow-600"}`}>
                        {isOffline ? "Set Online" : "Set Offline"}
                      </button>
                    )}
                    {!expired && !isOffline && (
                      <button onClick={() => onRevokeLicense(l.id)} className="text-[11px] font-semibold uppercase tracking-wider text-red-600">Revoke</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {licenses.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-black">No institutions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Create institution license" onClose={() => { setShowForm(false); setIssuedCreds(null); }} wide>
          {issuedCreds ? (
            <div>
              <p className="text-sm mb-4 text-black">
                License created. Send these credentials to the institution — shown only once here, same as a real system would do.
              </p>
              <div className="rounded-md border p-4 mb-5 text-sm space-y-1 bg-[#FFF9E6] border-[#FDEB9E]">
                <div>Login ID: <code>{issuedCreds.id}</code></div>
                <div>Password: <code>{issuedCreds.password}</code></div>
                <div>Access until: <code>{issuedCreds.endDate}</code></div>
              </div>
              <Button onClick={() => { setShowForm(false); setIssuedCreds(null); }} className="w-full">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="Institution name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Field label="Custom Login ID (optional)" placeholder="Leave blank to auto-generate" value={customId} onChange={(e) => setCustomId(e.target.value)} />
                <Field label="Custom Password (optional)" placeholder="Leave blank to auto-generate" value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} />
                <Field label="Contact Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Field label="Number of seats" type="number" min="1" required value={seats} onChange={(e) => setSeats(e.target.value)} />
                <Field label="Custom price for this bundle (₹)" type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
                <Field label="Start date" type="date" required={!isTest} disabled={isTest} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Field label="Duration (months)" type="number" min="1" max="240" required={!isTest} disabled={isTest} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>

              <div className="mt-2 mb-3 flex items-center justify-between">
                <label className="text-sm flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} />
                  <span className="text-black">Create as 5-minute test license</span>
                </label>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-black">Select books for this bundle — {selected.length} of {books.length} selected
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="text-xs text-blue-600 hover:underline font-semibold">Select Filtered</button>
                  <button type="button" onClick={() => setSelected([])} className="text-xs text-red-600 hover:underline font-semibold">Clear All</button>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
                  <Search size={14} className="text-black flex-shrink-0" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles or authors…"
                    className="flex-1 py-2.5 text-sm outline-none bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-black bg-white">
                    <option value="All">All Genres</option>
                    {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-black bg-white">
                    <option value="All">All Pub Types</option>
                    {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-xs text-black bg-white">
                    <option value="All">All Authors</option>
                    {allAuthors.map((a) => <option key={a} value={a}>{a.length > 18 ? a.substring(0,18)+"…" : a}</option>)}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 max-h-56 overflow-y-auto mb-4">
                {filteredBooks.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 px-3 py-2.5 text-sm border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />
                    <span 
                      className="w-5 h-7 rounded-sm flex-shrink-0 bg-cover bg-center shadow-sm" 
                      style={{ 
                        backgroundColor: b.color,
                        backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                      }} 
                    />
                    <span className="flex-1">{b.title}</span>
                    <span className="text-black">{b.genre}</span>
                  </label>
                ))}
                {filteredBooks.length === 0 && <div className="px-3 py-6 text-sm text-center text-black">No matches found.</div>}
              </div>

              <Button type="submit" className="w-full" disabled={selected.length === 0}>
                Generate credentials &amp; create license
              </Button>
            </form>
          )}
        </Modal>
      )}
      {showEditAccessModal && (
        <Modal title="Edit Institution Access" onClose={() => setShowEditAccessModal(false)} wide>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Select Books ({selected.length} chosen)</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(books.map(b => b.id))} className="text-xs font-semibold text-blue-600 hover:underline">Select All</button>
              <button type="button" onClick={() => setSelected([])} className="text-xs font-semibold text-red-600 hover:underline">Clear All</button>
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <input type="text" placeholder="Search books..." className="flex-1 px-3 py-2 border rounded-md" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border rounded-md px-3 py-2" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {getGenres().map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
            {filteredBooks.map((b) => (
              <label key={b.id} className={`border rounded p-2 flex items-start gap-2 cursor-pointer transition-colors ${selected.includes(b.id) ? 'bg-blue-50 border-blue-400' : 'bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} className="mt-1 shrink-0" />
                <div 
                  className="w-8 h-12 rounded-sm shrink-0 bg-cover bg-center shadow-sm"
                  style={{
                    backgroundColor: b.color,
                    backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate">{b.title}</div>
                  <div className="text-[10px] text-black mt-1 truncate">{b.author}</div>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={handleSaveAccess} className="w-full" disabled={selected.length === 0}>
            Save Changes
          </Button>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ReadersTab({ readers }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-black">Individual Users / Active Trials</h3>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Login ID", "Password", "Type", "Expiration"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-bold text-black uppercase tracking-wider text-[11px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readers.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold">{r.name || "—"}</td>
                <td className="px-4 py-3 text-black">{r.email || "—"}</td>
                <td className="px-4 py-3"><code>{r.loginId}</code></td>
                <td className="px-4 py-3"><code>{r.password}</code></td>
                <td className="px-4 py-3"><Badge tone={r.accountType === 'free_trial' ? 'neutral' : 'good'}>{r.accountType === 'free_trial' ? 'Free Trial' : 'Paid'}</Badge></td>
                <td className="px-4 py-3">{new Date(r.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {readers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-black">No individual users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function UploadersTab({ uploaders, onAddUploader, onRemoveUploader }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    const id = genCredentialId("UP");
    const pass = genPassword();
    onAddUploader({ id, password: pass, name, email });
    setName("");
    setEmail("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button onClick={() => setShowForm(true)}><Plus size={16} strokeWidth={2} /> Add uploader</Button>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Login ID", "Password", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-bold text-black uppercase tracking-wider text-[11px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uploaders.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email || "—"}</td>
                <td className="px-4 py-3"><code>{u.id}</code></td>
                <td className="px-4 py-3"><code>{u.password}</code></td>
                <td className="px-4 py-3">
                  <button onClick={() => onRemoveUploader(u.id)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors">
                    <Trash2 size={13} strokeWidth={1.8} /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Add uploader account" onClose={() => setShowForm(false)}>
          <form onSubmit={handleAdd}>
            <Field label="Uploader name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Contact Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs mb-4 text-black">Login ID and password are generated automatically once created.</p>
            <Button type="submit" className="w-full">Create uploader account</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function TrialsTab({ books, trialRequests, onApproveTrial, onRejectTrial, onResendEmail, onEditAccess }) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTrialId, setActiveTrialId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [pubTypeFilter, setPubTypeFilter] = useState("All");
  const [authorFilter, setAuthorFilter] = useState("All");

  const filteredBooks = useMemo(() => books.filter((b) =>
    (genreFilter === "All" || b.genre === genreFilter) &&
    (pubTypeFilter === "All" || b.pubType === pubTypeFilter) &&
    (authorFilter === "All" || b.author === authorFilter) &&
    ((b.title || "").toLowerCase().includes((search || "").toLowerCase()) || (b.author || "").toLowerCase().includes((search || "").toLowerCase()))
  ), [books, search, genreFilter, pubTypeFilter, authorFilter]);

  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();
  const allPubTypes = Array.from(new Set(books.map(b => b.pubType).filter(Boolean))).sort();

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function handleOpenApprove(id) {
    setActiveTrialId(id);
    setSelected(books.map(b => b.id)); // Default to all books
    setShowApproveModal(true);
  }

  function handleConfirmApprove() {
    onApproveTrial(activeTrialId, selected);
    setShowApproveModal(false);
    setActiveTrialId(null);
    setSelected([]);
  }

  function handleOpenEdit(trial) {
    setActiveTrialId(trial.id);
    setSelected(trial.bookids || books.map(b => b.id));
    setShowEditModal(true);
  }

  function handleSaveEdit() {
    onEditAccess(activeTrialId, selected);
    setShowEditModal(false);
    setActiveTrialId(null);
    setSelected([]);
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {["Name", "Email", "Institution", "Requested", "Status", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-bold text-black uppercase tracking-wider text-[11px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trialRequests.map((t) => (
            <tr key={t.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">{t.name}</td>
              <td className="px-4 py-3">{t.email}</td>
              <td className="px-4 py-3">{t.institution || "—"}</td>
              <td className="px-4 py-3">{t.requestedAt}</td>
              <td className="px-4 py-3">
                {t.status === "pending" && <Badge tone="warn">Pending</Badge>}
                {t.status === "approved" && <Badge tone="good">Approved · ends {t.expiresAt}</Badge>}
                {t.status === "rejected" && <Badge tone="bad">Rejected</Badge>}
              </td>
              <td className="px-4 py-3">
                {t.status === "pending" && (
                  <div className="flex gap-3">
                    <button onClick={() => handleOpenApprove(t.id)} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 transition-colors">
                      <Check size={13} strokeWidth={2} /> Approve
                    </button>
                    <button onClick={() => onRejectTrial(t.id)} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
                      <X size={13} strokeWidth={2} /> Reject
                    </button>
                  </div>
                )}
                {t.status === "approved" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleOpenEdit(t)} className="text-xs font-semibold text-black uppercase tracking-wider text-xs">
                        Edit Access
                      </button>
                      <button
                        onClick={() => onResendEmail && onResendEmail(t.id, 'approved')}
                        className="flex items-center gap-1 text-xs font-semibold text-[#D4A017] hover:text-[#b8860b] transition-colors"
                      >
                        <Mail size={12} /> Resend Email
                      </button>
                    </div>
                    {t.password && <span className="text-[11px] font-semibold uppercase tracking-wider text-black">Login: <code>{t.email}</code> / <code>{t.password}</code></span>}
                  </div>
                )}
                {t.status === "rejected" && (
                  <button
                    onClick={() => onResendEmail && onResendEmail(t.id, 'rejected')}
                    className="flex items-center gap-1 text-xs font-semibold text-black"
                  >
                    <Mail size={12} /> Resend Rejection Email
                  </button>
                )}
              </td>
            </tr>
          ))}
          {trialRequests.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-black">No trial requests yet.</td></tr>
          )}
        </tbody>
      </table>

      {(showApproveModal || showEditModal) && (
        <Modal title={showApproveModal ? "Approve Trial & Select Books" : "Edit Trial Access"} onClose={() => { setShowApproveModal(false); setShowEditModal(false); }} wide>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Select Books ({selected.length} chosen)</h3>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="text-xs text-blue-600 hover:underline font-semibold">Select Filtered</button>
              <button type="button" onClick={() => setSelected([])} className="text-xs text-red-600 hover:underline font-semibold">Clear All</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Search titles or authors..." className="flex-1 min-w-[150px] px-3 py-2 border rounded-md text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border rounded-md px-3 py-2 text-sm max-w-[120px]" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {getGenres().map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm max-w-[120px]" value={pubTypeFilter} onChange={e => setPubTypeFilter(e.target.value)}>
              <option value="All">All Pub Types</option>
              {allPubTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="border rounded-md px-3 py-2 text-sm max-w-[120px]" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}>
              <option value="All">All Authors</option>
              {allAuthors.map(a => <option key={a} value={a}>{a.length > 15 ? a.substring(0,15)+"..." : a}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
            {filteredBooks.map((b) => (
              <label key={b.id} className={`border rounded p-2 flex items-start gap-2 cursor-pointer transition-colors ${selected.includes(b.id) ? 'bg-blue-50 border-blue-400' : 'bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} className="mt-1 shrink-0" />
                <div 
                  className="w-8 h-12 rounded-sm shrink-0 bg-cover bg-center shadow-sm"
                  style={{
                    backgroundColor: b.color,
                    backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate">{b.title}</div>
                  <div className="text-[10px] text-black mt-1 truncate">{b.author}</div>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={showApproveModal ? handleConfirmApprove : handleSaveEdit} className="w-full" disabled={selected.length === 0}>
            {showApproveModal ? "Approve Trial" : "Save Changes"}
          </Button>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function FiltersTab() {
  const [genres, setLocalGenres] = useState(getGenres());
  const [pubTypes, setLocalPubTypes] = useState(getPubTypes());
  const [customHeadings, setLocalCustomHeadings] = useState(getCustomHeadings());
  
  const [newGenre, setNewGenre] = useState("");
  const [newPubType, setNewPubType] = useState("");
  const [newHeadingName, setNewHeadingName] = useState("");
  const [newHeadingOption, setNewHeadingOption] = useState({});

  const handleAddGenre = (e) => {
    e.preventDefault();
    if (!newGenre.trim()) return;
    const updated = [...genres, newGenre.trim()].sort();
    setLocalGenres(updated);
    saveGenres(updated);
    setNewGenre("");
  };

  const handleRemoveGenre = (g) => {
    const updated = genres.filter(x => x !== g);
    setLocalGenres(updated);
    saveGenres(updated);
  };

  const handleAddPubType = (e) => {
    e.preventDefault();
    if (!newPubType.trim()) return;
    const updated = [...pubTypes, newPubType.trim()].sort();
    setLocalPubTypes(updated);
    savePubTypes(updated);
    setNewPubType("");
  };

  const handleRemovePubType = (t) => {
    const updated = pubTypes.filter(x => x !== t);
    setLocalPubTypes(updated);
    savePubTypes(updated);
  };

  const handleAddCustomHeading = (e) => {
    e.preventDefault();
    if (!newHeadingName.trim()) return;
    const updated = [...customHeadings, { id: Date.now().toString(), name: newHeadingName.trim(), options: [] }];
    setLocalCustomHeadings(updated);
    localStorage.setItem("athenaeum_custom_headings", JSON.stringify(updated));
    setNewHeadingName("");
  };

  const handleRemoveCustomHeading = (id) => {
    const updated = customHeadings.filter(h => h.id !== id);
    setLocalCustomHeadings(updated);
    localStorage.setItem("athenaeum_custom_headings", JSON.stringify(updated));
  };

  const handleAddCustomOption = (e, headingId) => {
    e.preventDefault();
    const opt = newHeadingOption[headingId];
    if (!opt?.trim()) return;
    
    const updated = customHeadings.map(h => {
      if (h.id === headingId) {
        return { ...h, options: [...h.options, opt.trim()].sort() };
      }
      return h;
    });
    setLocalCustomHeadings(updated);
    localStorage.setItem("athenaeum_custom_headings", JSON.stringify(updated));
    setNewHeadingOption(prev => ({ ...prev, [headingId]: "" }));
  };

  const handleRemoveCustomOption = (headingId, optionName) => {
    const updated = customHeadings.map(h => {
      if (h.id === headingId) {
        return { ...h, options: h.options.filter(o => o !== optionName) };
      }
      return h;
    });
    setLocalCustomHeadings(updated);
    localStorage.setItem("athenaeum_custom_headings", JSON.stringify(updated));
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-6 text-black">Manage Dropdown Filters</h2>
      <p className="text-sm text-black mb-8 max-w-3xl">
        Add or remove items from this list to control the default options available when Uploaders add new books. 
        You can also create entirely new metadata Headings (e.g. "Resources", "Languages") and define dropdown options for them.
      </p>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        {/* Subjects */}
        <div>
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Subjects / Genres</h3>
          <form onSubmit={handleAddGenre} className="flex gap-2 mb-4">
            <input 
              className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-[#FDD132]"
              placeholder="e.g. BIOPHYSICS"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)} required
            />
            <Button type="submit" variant="brass" size="sm">Add</Button>
          </form>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border rounded p-2 bg-gray-50">
            {genres.map(g => (
              <li key={g} className="flex justify-between items-center bg-white p-2 border rounded text-sm shadow-sm">
                <span className="font-semibold uppercase text-xs">{g}</span>
                <button onClick={() => handleRemoveGenre(g)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Publication Types */}
        <div>
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Publication Types</h3>
          <form onSubmit={handleAddPubType} className="flex gap-2 mb-4">
            <input 
              className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-[#FDD132]"
              placeholder="e.g. Magazine"
              value={newPubType}
              onChange={(e) => setNewPubType(e.target.value)} required
            />
            <Button type="submit" variant="brass" size="sm">Add</Button>
          </form>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border rounded p-2 bg-gray-50">
            {pubTypes.map(t => (
              <li key={t} className="flex justify-between items-center bg-white p-2 border rounded text-sm shadow-sm">
                <span className="font-semibold text-xs">{t}</span>
                <button onClick={() => handleRemovePubType(t)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t pt-8 mt-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-xl mb-1">Custom Filter Headings</h3>
            <p className="text-sm text-black">Create new metadata fields that uploaders can fill out (e.g. "Resources")</p>
          </div>
          <form onSubmit={handleAddCustomHeading} className="flex gap-2">
            <input 
              className="w-64 border rounded px-3 py-2 text-sm outline-none focus:border-[#FDD132]"
              placeholder="New Heading Name..."
              value={newHeadingName}
              onChange={(e) => setNewHeadingName(e.target.value)} required
            />
            <Button type="submit" variant="brass" size="sm">Create</Button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {customHeadings.map(h => (
            <div key={h.id} className="border border-[#FDD132] p-4 rounded-lg bg-yellow-50/30">
              <div className="flex justify-between items-center border-b border-[#FDD132] pb-2 mb-4">
                <h4 className="font-bold text-lg">{h.name}</h4>
                <button onClick={() => handleRemoveCustomHeading(h.id)} className="text-red-500 text-sm hover:underline">Remove Heading</button>
              </div>
              <form onSubmit={(e) => handleAddCustomOption(e, h.id)} className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-[#FDD132]"
                  placeholder={`Add option to ${h.name}...`}
                  value={newHeadingOption[h.id] || ""}
                  onChange={(e) => setNewHeadingOption(prev => ({ ...prev, [h.id]: e.target.value }))}
                />
                <Button type="submit" variant="brass" size="sm">Add Option</Button>
              </form>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {h.options.map(opt => (
                  <li key={opt} className="flex justify-between items-center bg-white p-2 border rounded text-sm shadow-sm">
                    <span className="font-semibold text-xs">{opt}</span>
                    <button onClick={() => handleRemoveCustomOption(h.id, opt)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {h.options.length === 0 && <li className="text-xs text-black italic">No options added yet.</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function HomepageTab({ books }) {
  const [config, setConfig] = useState(getHomepageConfig());
  
  const updateConfig = (updates) => {
    const next = { ...config, ...updates };
    setConfig(next);
    setHomepageConfig(next);
  };

  const handleToggleMode = (section, currentMode) => {
    updateConfig({ [`${section}Mode`]: currentMode === 'auto' ? 'manual' : 'auto' });
  };

  const handleToggleBook = (section, bookId) => {
    const listKey = `${section}BookIds`;
    const list = config[listKey];
    if (list.includes(bookId)) {
      updateConfig({ [listKey]: list.filter(id => id !== bookId) });
    } else {
      updateConfig({ [listKey]: [...list, bookId] });
    }
  };

  const handleAddAuthor = (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form.elements.author;
    const author = input.value.trim();
    if (author && !config.featuredAuthorsList.includes(author)) {
      updateConfig({ featuredAuthorsList: [...config.featuredAuthorsList, author] });
      input.value = "";
    }
  };

  const handleRemoveAuthor = (author) => {
    updateConfig({ featuredAuthorsList: config.featuredAuthorsList.filter(a => a !== author) });
  };

  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();

  return (
    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-6 text-black">Homepage Layout</h2>
      <p className="text-sm text-black mb-8 max-w-3xl">
        Control how books and authors are listed on the main Catalog page. 
        You can leave a section on "Auto" to dynamically fetch the most recent data, or switch it to "Manual" to hand-pick the exact items to feature.
      </p>

      <div className="space-y-12">
        {/* Trending Now */}
        <div>
          <div className="flex justify-between items-end border-b pb-2 mb-4">
            <h3 className="font-bold text-lg">Trending Now</h3>
            <button 
              onClick={() => handleToggleMode('trending', config.trendingMode)}
              className={`text-xs px-3 py-1 rounded font-bold ${config.trendingMode === 'auto' ? 'bg-gray-200 text-black' : 'bg-[#FDD132] text-black'}`}
            >
              Mode: {config.trendingMode.toUpperCase()}
            </button>
          </div>
          {config.trendingMode === 'auto' ? (
            <p className="text-sm text-black italic">Automatically showing the 3 most recently added books.</p>
          ) : (
            <div>
              <p className="text-sm text-black mb-3">Select exactly 3 books to feature in the Trending section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border">
                {books.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => handleToggleBook('trending', b.id)}
                    className={`cursor-pointer p-2 border rounded text-xs flex flex-col justify-between ${config.trendingBookIds.includes(b.id) ? 'border-[#FDD132] bg-yellow-50 shadow-sm' : 'bg-white hover:border-gray-300'}`}
                  >
                    <span className="font-bold line-clamp-2">{b.title}</span>
                    <span className="text-black mt-1">{b.author}</span>
                    {config.trendingBookIds.includes(b.id) && <Check size={14} className="text-green-600 mt-2 self-end" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Releases */}
        <div>
          <div className="flex justify-between items-end border-b pb-2 mb-4">
            <h3 className="font-bold text-lg">New Releases</h3>
            <button 
              onClick={() => handleToggleMode('newReleases', config.newReleasesMode)}
              className={`text-xs px-3 py-1 rounded font-bold ${config.newReleasesMode === 'auto' ? 'bg-gray-200 text-black' : 'bg-[#FDD132] text-black'}`}
            >
              Mode: {config.newReleasesMode.toUpperCase()}
            </button>
          </div>
          {config.newReleasesMode === 'auto' ? (
            <p className="text-sm text-black italic">Automatically showing the next 4 most recently added books.</p>
          ) : (
            <div>
              <p className="text-sm text-black mb-3">Select exactly 4 books to feature in the New Releases section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border">
                {books.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => handleToggleBook('newReleases', b.id)}
                    className={`cursor-pointer p-2 border rounded text-xs flex flex-col justify-between ${config.newReleasesBookIds.includes(b.id) ? 'border-[#FDD132] bg-yellow-50 shadow-sm' : 'bg-white hover:border-gray-300'}`}
                  >
                    <span className="font-bold line-clamp-2">{b.title}</span>
                    <span className="text-black mt-1">{b.author}</span>
                    {config.newReleasesBookIds.includes(b.id) && <Check size={14} className="text-green-600 mt-2 self-end" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Created For You */}
        <div>
          <div className="flex justify-between items-end border-b pb-2 mb-4">
            <h3 className="font-bold text-lg">Created For You</h3>
            <button 
              onClick={() => handleToggleMode('createdForYou', config.createdForYouMode)}
              className={`text-xs px-3 py-1 rounded font-bold ${config.createdForYouMode === 'auto' ? 'bg-gray-200 text-black' : 'bg-[#FDD132] text-black'}`}
            >
              Mode: {config.createdForYouMode.toUpperCase()}
            </button>
          </div>
          {config.createdForYouMode === 'auto' ? (
            <p className="text-sm text-black italic">Automatically showing 2 books for the user based on catalog history.</p>
          ) : (
            <div>
              <p className="text-sm text-black mb-3">Select exactly 2 books to feature in the Created For You section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border">
                {books.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => handleToggleBook('createdForYou', b.id)}
                    className={`cursor-pointer p-2 border rounded text-xs flex flex-col justify-between ${config.createdForYouBookIds.includes(b.id) ? 'border-[#FDD132] bg-yellow-50 shadow-sm' : 'bg-white hover:border-gray-300'}`}
                  >
                    <span className="font-bold line-clamp-2">{b.title}</span>
                    <span className="text-black mt-1">{b.author}</span>
                    {config.createdForYouBookIds.includes(b.id) && <Check size={14} className="text-green-600 mt-2 self-end" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured Authors */}
        <div>
          <div className="flex justify-between items-end border-b pb-2 mb-4">
            <h3 className="font-bold text-lg">Featured Authors</h3>
            <button 
              onClick={() => handleToggleMode('featuredAuthors', config.featuredAuthorsMode)}
              className={`text-xs px-3 py-1 rounded font-bold ${config.featuredAuthorsMode === 'auto' ? 'bg-gray-200 text-black' : 'bg-[#FDD132] text-black'}`}
            >
              Mode: {config.featuredAuthorsMode.toUpperCase()}
            </button>
          </div>
          {config.featuredAuthorsMode === 'auto' ? (
            <p className="text-sm text-black italic">Automatically showing 6 authors based on most books uploaded.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <form onSubmit={handleAddAuthor} className="flex gap-2 mb-4">
                  <input 
                    name="author"
                    list="existing-authors-home"
                    className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-[#FDD132]"
                    placeholder="Select or type author name..."
                  />
                  <datalist id="existing-authors-home">
                    {allAuthors.map(a => <option key={a} value={a} />)}
                  </datalist>
                  <Button type="submit" variant="brass" size="sm">Add Author</Button>
                </form>
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border rounded p-2 bg-gray-50">
                  {config.featuredAuthorsList.map(a => (
                    <li key={a} className="flex justify-between items-center bg-white p-2 border rounded text-sm shadow-sm">
                      <span className="font-semibold text-xs">{a}</span>
                      <button onClick={() => handleRemoveAuthor(a)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {config.featuredAuthorsList.length === 0 && <li className="text-xs text-black italic">No authors added.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function PagesTab() {
  const [pages, setPagesState] = useState(getPages());
  const [activeSlug, setActiveSlug] = useState("about-us");

  const activePage = pages[activeSlug];

  const handleUpdate = (field, value) => {
    const newPages = {
      ...pages,
      [activeSlug]: { ...activePage, [field]: value }
    };
    setPagesState(newPages);
    setPages(newPages);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-6 text-black">Manage Static Pages</h2>
      <p className="text-sm text-black mb-8 max-w-3xl">
        Edit the content of the footer pages (About Us, Contact Us, Terms, Privacy Policy, FAQs). Changes reflect instantly on the live site.
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4 border-r pr-4">
          <ul className="space-y-2">
            {Object.keys(pages).map(slug => (
              <li key={slug}>
                <button
                  onClick={() => setActiveSlug(slug)}
                  className={`w-full text-left px-4 py-2 rounded text-sm font-semibold ${activeSlug === slug ? 'bg-[#FDD132] text-black' : 'hover:bg-gray-100 text-black'}`}
                >
                  {pages[slug].title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="md:w-3/4">
          <div className="mb-4">
            <label className="block text-sm font-bold text-black mb-2">Page Title</label>
            <input 
              value={activePage.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              className="w-full border rounded px-3 py-2 outline-none focus:border-[#FDD132]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-black mb-2">Page Content (Supports Line Breaks)</label>
            <textarea 
              value={activePage.content}
              onChange={(e) => handleUpdate("content", e.target.value)}
              className="w-full border rounded px-3 py-2 outline-none focus:border-[#FDD132] h-64 font-sans"
            />
          </div>
          <div className="text-sm text-black italic mt-4">
            * Changes are saved automatically as you type.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailsTab({ emailTemplates, onUpdateEmailTemplate }) {
  const DEFAULT_TEMPLATES = [
    { id: 'trial_approved', name: 'Trial Approved', subject: 'Your 30-Day Trial is Approved! 🎉', body: 'Hello {{name}},\n\nYour trial request for SpellBound ( Publishers and Distributors ) has been approved!\n\nHere are your login details:\nLogin ID: {{id}}\nPassword: {{password}}\n\nThis trial gives you full access for 30 days and will expire on {{endDate}}.\n\nEnjoy reading!\n- The SpellBound ( Publishers and Distributors ) Team' },
    { id: 'trial_rejected', name: 'Trial Rejected', subject: 'Update on your Trial Request', body: 'Hello {{name}},\n\nThank you for your interest in SpellBound ( Publishers and Distributors ). Unfortunately, we are unable to approve your trial request at this time.\n\nIf you believe this was a mistake or you are representing an institution, please reply to this email to get in touch with our team.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team' },
    { id: 'institution_created', name: 'Institution Created', subject: 'Your Institution Access Details - SpellBound ( Publishers and Distributors )', body: 'Hello {{name}},\n\nYour institution has been successfully registered on SpellBound ( Publishers and Distributors ).\n\nHere are your official access details:\nInstitution ID (Login): {{id}}\nPassword: {{password}}\n\nPurchasing Date: {{startDate}}\nExpiration Date: {{endDate}}\n\nYour members can use these credentials to read the books in your purchased catalog.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team' },
    { id: 'expiration_reminder', name: 'Expiration Reminder', subject: 'Action Required: Your Access Expires in 7 Days', body: 'Hello {{name}},\n\nThis is a quick reminder that your access to SpellBound ( Publishers and Distributors ) will expire in 7 days on {{endDate}}.\n\nPlease contact us if you would like to renew your license.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team' }
  ];

  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATES[0].id);
  
  const currentDefault = DEFAULT_TEMPLATES.find(t => t.id === activeTemplate);
  const currentSaved = emailTemplates?.find(t => t.id === activeTemplate);
  
  const [subject, setSubject] = useState(currentSaved?.subject || currentDefault?.subject || "");
  const [body, setBody] = useState(currentSaved?.body || currentDefault?.body || "");

  // Reset local state when switching templates
  React.useEffect(() => {
    setSubject(currentSaved?.subject || currentDefault?.subject || "");
    setBody(currentSaved?.body || currentDefault?.body || "");
  }, [activeTemplate, emailTemplates]);

  const handleSave = () => {
    onUpdateEmailTemplate(activeTemplate, subject, body);
  };

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <div className="md:col-span-1 rounded-md border bg-white p-4 border-gray-200">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-black">Available Templates</h3>
        <div className="flex flex-col gap-2">
          {DEFAULT_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              className={`text-left px-3 py-2 rounded text-sm ${activeTemplate === t.id ? 'bg-[#111] text-white' : 'hover:bg-gray-100 text-black'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="mt-8 text-xs text-black bg-gray-50 p-3 rounded border">
          <strong>Available Variables:</strong>
          <ul className="mt-2 space-y-1">
            <li><code>{`{{name}}`}</code> - User/Institution Name</li>
            <li><code>{`{{id}}`}</code> - Login ID</li>
            <li><code>{`{{password}}`}</code> - Password</li>
            <li><code>{`{{startDate}}`}</code> - Purchase Date</li>
            <li><code>{`{{endDate}}`}</code> - Expiration Date</li>
          </ul>
        </div>
      </div>
      <div className="md:col-span-3">
        <div className="bg-white rounded-md border p-6 border-gray-200">
          <h2 className="text-xl font-bold mb-6" style={fontDisplay}>Edit {currentDefault?.name} Email</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1.5 text-black">Subject Line</label>
            <input 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded border text-sm outline-none bg-gray-50 focus:bg-white"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1.5 text-black">Email Body</label>
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded border text-sm outline-none bg-gray-50 focus:bg-white h-64"
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}><Check size={16} /> Save Template</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function FeaturedAuthorsTab({ books = [], authors = [], onAddAuthor, onRemoveAuthor }) {
  const allAuthors = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onAddAuthor({ name, bio, photo_url: photoUrl });
    setName("");
    setBio("");
    setPhotoUrl("");
    setShowForm(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
       
      const fileExt = file.name.split('.').pop();
      const fileName = `author_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('covers').upload(fileName, file);
      if (error) throw error;
      const url = supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
      setPhotoUrl(url);
    } catch (err) {
      alert("Failed to upload photo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-black">Featured Authors</h2>
        <Button onClick={() => setShowForm(true)}><Plus size={16} strokeWidth={2} /> Add Featured Author</Button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {authors.map((author) => {
          if (!author) return null;
          return (
            <div key={author.id} className="bg-white border rounded-lg p-6 flex flex-col items-center text-center shadow-sm border-gray-200">
              <div
                className="w-24 h-24 rounded-full bg-gray-200 mb-4 bg-cover bg-center border-4 border-white shadow-md flex items-center justify-center text-xl font-bold text-black"
                style={author.photo_url ? { backgroundImage: `url(${author.photo_url})` } : {}}
              >
                {!author.photo_url && String(author.name || "U").charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-lg mb-1">{String(author.name || "Unknown")}</h3>
              {author.bio && <p className="text-xs text-black line-clamp-3 mb-4">{String(author.bio)}</p>}
              <button
                onClick={() => onRemoveAuthor(author.id)}
                className="mt-auto text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          );
        })}
        {authors.length === 0 && (
          <div className="col-span-full py-12 text-center text-black">
            No featured authors yet. Click "Add Featured Author" to get started.
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Featured Author">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5 text-black">Author Name</label>
              <input
                list="existing-authors-admin"
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Select or type author name..."
              />
              <datalist id="existing-authors-admin">
                {allAuthors.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5 text-black">Author Photo</label>
              {photoUrl ? (
                <div className="flex items-center gap-4">
                  <img src={photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover shadow" />
                  <button type="button" onClick={() => setPhotoUrl("")} className="text-sm text-red-500 underline">Remove Photo</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-blue-500 mt-2 block">Uploading...</span>}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5 text-black">Short Bio (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Expert in workplace software..."
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading}>Add Author</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function SubscribersTab({ subscribers }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-black">Newsletter Subscribers</h3>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Email", "Subscribed At"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-bold text-black uppercase tracking-wider text-[11px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold">{s.email}</td>
                <td className="px-4 py-3 text-black">{new Date(s.subscribed_at).toLocaleString()}</td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-8 text-center text-black">No subscribers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
