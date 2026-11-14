import { supabase } from "../supabaseClient";
import React, { useState, useMemo, useRef } from "react";
import { Plus, Trash2, Check, X, Users, UploadCloud, Gift, Search, BookOpen, Settings, LayoutTemplate, Mail, AlertTriangle, Key, Activity, Eye, EyeOff, Edit3, ArrowUpRight, SlidersHorizontal, PanelLeft, Building2, Copy, CheckCircle2, ChevronDown, ChevronUp, GraduationCap, Download } from "lucide-react";
import { palette, fontDisplay, getGenres, setGenres as saveGenres, getPubTypes, setPubTypes as savePubTypes, getPublishers, setPublishers as savePublishers, getCustomHeadings, setCustomHeadings as saveCustomHeadings, getHomepageConfig, setHomepageConfig, getPages, setPages } from "../theme";
import { downloadCoverImage } from "../utils/downloadCover";
import { addMonths, today, daysUntil, genCredentialId, genPassword } from "../data/mockData";
import { renderEmailHtml, COMPANY_LOGO_URL } from "../email";
import Button from "../components/Button";
import { Field, Select, Modal, Badge } from "../components/UI";
import {
  BrandEmblem3D,
  AdminTabIcon3D,
  YellowCardPatternSVG,
  OrangePiePatternSVG,
  Book3DFallbackSVG,
} from "../components/AdminGlassIcons";
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
  activeReadingSessions = [],
  onCreateLicense, onRevokeLicense, onDeleteLicense, onToggleLicenseStatus, onEditInstitutionAccess, onRotateSemesterPassword,
  onUpdateInstitutionDepartments,
  onCreateReader, onRevokeReader, onDeleteReader, onToggleReaderStatus, onEditReaderAccess, onResendReaderEmail,
  onAddUploader, onRemoveUploader,
  onApproveTrial, onRejectTrial, onDeleteTrial, onDeleteRejectedTrials, onEditTrialAccess, onResendTrialEmail, onResendInstitutionEmail, onUpdateEmailTemplate,
  onAddFeaturedAuthor, onRemoveFeaturedAuthor,
  onAddBook, onEditBook, onDeleteBook, onRenameBookMetadata, dbStatus, onNavigate
}) {
  const [tab, setTab] = useState("institutions");
  const [railExpanded, setRailExpanded] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const tabButtonRefs = useRef({});

  const pendingTrials = trialRequests.filter((t) => t.status === "pending").length;
  const activeInstitutionsCount = useMemo(
    () => licenses.filter((l) => daysUntil(l.endDate) >= 0 && l.type !== "offline").length,
    [licenses]
  );
  const inactiveAccountsCount = useMemo(() => {
    const offLic = licenses.filter((l) => daysUntil(l.endDate) < 0 || l.type === "offline").length;
    const offRead = readers.filter((r) => daysUntil(r.endDate) < 0 || r.status === "offline" || r.status === "revoked").length;
    return offLic + offRead;
  }, [licenses, readers]);

  const pdfBooksCount = useMemo(() => books.filter((b) => Boolean(b.pdfUrl)).length, [books]);
  const genresCount = useMemo(() => new Set(books.map((b) => b.genre).filter(Boolean)).size, [books]);
  const authorsCount = useMemo(() => new Set(books.map((b) => b.author).filter(Boolean)).size, [books]);

  const spotlightBooks = useMemo(() => books.slice(0, 6), [books]);
  const currentSpotlight = spotlightBooks.length > 0 ? spotlightBooks[spotlightIdx % spotlightBooks.length] : null;

  // Active reading sessions telemetry and spike analysis
  const activeSessionCounts = useMemo(() => {
    const counts = {};
    (activeReadingSessions || []).forEach((s) => {
      if (s.license_id) {
        counts[s.license_id] = (counts[s.license_id] || 0) + 1;
      }
    });
    return counts;
  }, [activeReadingSessions]);

  // Unusual traffic spikes: any institution with >= 50 simultaneous active sessions (or high surge)
  const spikedInstitutions = useMemo(() => {
    return licenses.filter(l => (activeSessionCounts[l.id] || 0) >= 50);
  }, [licenses, activeSessionCounts]);

  const activeTabMeta = TABS.find((t) => t.id === tab) || TABS[0];

  const handleSelectTab = (nextId) => {
    setTab(nextId);
    const btn = tabButtonRefs.current[nextId];
    if (btn && typeof btn.scrollIntoView === "function") {
      btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  };

  return (
    <div className="admin-glass-backdrop min-h-screen py-3 sm:py-5 px-2.5 sm:px-5 pb-12">
      {/* Soft ambient glass atmosphere matching yellow / coral / graphite theme */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 -left-20 w-[440px] h-[440px] rounded-full bg-[#F5F23B]/20 blur-[120px]" />
        <div className="absolute top-12 -right-24 w-[420px] h-[420px] rounded-full bg-[#F97316]/16 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[520px] h-[380px] rounded-full bg-slate-400/25 blur-[130px]" />
      </div>
      <div className="relative z-10 max-w-[1440px] mx-auto admin-glass-shell rounded-[26px] p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 lg:gap-5">
        {/* LEFT GLASS ICON RAIL (DESKTOP) */}
        <aside
          aria-label="Admin navigation rail"
          className={`relative z-40 hidden lg:flex flex-col justify-between shrink-0 py-3 px-2 rounded-2xl bg-slate-100/65 border border-white/80 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-300 ${
            railExpanded ? "w-52" : "w-[68px]"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-full flex items-center ${railExpanded ? "justify-between px-2" : "justify-center"} pt-1 pb-2`}>
              <div className="flex items-center gap-2.5">
                <BrandEmblem3D size={32} />
                {railExpanded && (
                  <span className="font-bold text-sm tracking-tight text-[#111214]" style={fontDisplay}>
                    SpellBound
                  </span>
                )}
              </div>
            </div>

            <nav role="tablist" aria-label="Admin dashboard sections" className="w-full flex flex-col gap-1.5">
              {TABS.map((t) => {
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={t.label}
                    onClick={() => handleSelectTab(t.id)}
                    className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                      railExpanded ? "px-3 py-2.5 justify-start" : "py-2.5 justify-center"
                    } ${
                      isActive
                        ? "bg-white/95 text-[#111214] shadow-[0_8px_20px_-6px_rgba(15,23,42,0.18)] ring-1 ring-black/10 scale-[1.02]"
                        : "text-zinc-700 hover:bg-white/60 hover:text-[#111214]"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#111214]"
                      />
                    )}
                    <span className="transition-transform duration-200 group-hover:scale-110 shrink-0">
                      <AdminTabIcon3D id={t.id} active={isActive} size={22} />
                    </span>
                    {railExpanded && (
                      <span className="text-xs font-bold truncate">{t.label}</span>
                    )}
                    {t.id === "trials" && pendingTrials > 0 && (
                      <span className={`${railExpanded ? "ml-auto" : "absolute -top-1 -right-1"} min-w-[18px] h-[18px] px-1 rounded-full bg-[#F97316] text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm`}>
                        {pendingTrials}
                      </span>
                    )}
                    {!railExpanded && (
                      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-3 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111214] text-white text-xs font-semibold shadow-xl">
                        {t.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2 pt-4 border-t border-black/5">
            <button
              type="button"
              onClick={() => setRailExpanded((v) => !v)}
              aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar labels"}
              className={`w-full flex items-center ${railExpanded ? "justify-between px-3" : "justify-center"} py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-white/70 transition-colors cursor-pointer`}
            >
              <PanelLeft size={16} />
              {railExpanded && <span>Compact Rail</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-5">
          {/* TOP HEADER BAR */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden">
                <BrandEmblem3D size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#111214]" style={fontDisplay}>
                    {activeTabMeta.label}
                  </h1>
                  <span className="admin-glass-pill px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-zinc-800 inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dbStatus === "connected" ? "bg-emerald-500" : dbStatus === "error" ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  Manage institutional licenses, individual orders, catalog titles & global portal settings.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectTab("books")}
                className="admin-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-[#111214] inline-flex items-center gap-2 hover:bg-white/80 transition-all cursor-pointer"
              >
                <AdminTabIcon3D id="books" active size={16} />
                <span>Catalog: <strong>{books.length}</strong> titles · <strong>{genresCount}</strong> genres</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("institutions")}
                className="admin-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-[#111214] inline-flex items-center gap-2 hover:bg-white/80 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Readers: <strong>{activeReadingSessions.length}</strong></span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("filters")}
                title="Global Filters"
                className="admin-glass-pill w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/85 transition-all cursor-pointer"
              >
                <AdminTabIcon3D id="filters" active size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowOverview((v) => !v)}
                title={showOverview ? "Hide analytics cards" : "Show analytics cards"}
                className="admin-glass-pill px-3 py-2 rounded-full text-xs font-bold text-[#111214] inline-flex items-center gap-1.5 hover:bg-white/85 transition-all cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">{showOverview ? "Hide Bento" : "Show Bento"}</span>
              </button>
            </div>
          </header>

          {/* MOBILE / TABLET HORIZONTAL GLASS TAB SCROLLER */}
          <div
            role="tablist"
            aria-label="Admin sections"
            className="lg:hidden admin-tab-scroller flex items-center gap-2 overflow-x-auto pb-1"
          >
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabButtonRefs.current[t.id] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(t.id)}
                  className={`flex-none inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-white text-[#111214] border-black/15 shadow-md underline decoration-[#111214] decoration-2 underline-offset-4"
                      : "bg-white/45 text-zinc-700 border-white/70 hover:bg-white/75"
                  }`}
                >
                  <AdminTabIcon3D id={t.id} active={isActive} size={17} />
                  <span>{t.label}</span>
                  {t.id === "trials" && pendingTrials > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] leading-none">
                      {pendingTrials}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* UNUSUAL TRAFFIC SPIKE ALERT BANNER */}
          {spikedInstitutions.length > 0 && (
            <div className="p-4 rounded-2xl border border-amber-300/80 bg-amber-50/80 backdrop-blur-md flex items-start gap-3 shadow-sm">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={22} />
              <div>
                <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  Unusual Traffic Spike Detected (High Concurrent Campus Load)
                  <Badge tone="warn">{spikedInstitutions.length} Institution{spikedInstitutions.length > 1 ? "s" : ""}</Badge>
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  The following institution(s) are experiencing rapid student login surges:
                  {spikedInstitutions.map((inst) => ` ${inst.name} (${activeSessionCounts[inst.id]} concurrent readers)`).join(",")}.
                  Read requests are automatically offloaded to Cloudflare edge CDN and Supabase connection pooler with 0 seat caps.
                </p>
              </div>
            </div>
          )}

          {/* BENTO ANALYTICS HERO ROW (SIGNATURE REFERENCE CARDS) */}
          {showOverview && (
            <section aria-label="Platform Analytics Overview" className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* CARD 1: ACID YELLOW — SUBSCRIPTIONS & ACCESS */}
              <div
                className="md:col-span-4 admin-bento-card rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden shadow-md"
                style={{ background: "linear-gradient(145deg, #F5F23B 0%, #EAE322 100%)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-black/65">Access & Trials</span>
                    <h2 className="text-lg font-bold text-[#111214] leading-tight">Accounts Overview</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("trials")}
                    title="View Trial Requests"
                    className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 flex items-center justify-center text-[#111214] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end mt-4 mb-1 relative z-10">
                  <button type="button" onClick={() => handleSelectTab("trials")} className="text-left cursor-pointer group">
                    <div className="text-xl font-extrabold text-[#111214] leading-none group-hover:underline">{pendingTrials}</div>
                    <div className="text-[10px] font-semibold text-black/75 mt-1 leading-tight">Pending Trials</div>
                  </button>
                  <button type="button" onClick={() => handleSelectTab("institutions")} className="text-left cursor-pointer group">
                    <div className="text-xl font-extrabold text-[#111214] leading-none group-hover:underline">{inactiveAccountsCount}</div>
                    <div className="text-[10px] font-semibold text-black/75 mt-1 leading-tight">Expired / Off</div>
                  </button>
                  <button type="button" onClick={() => handleSelectTab("readers")} className="text-left cursor-pointer group">
                    <div className="text-xl font-extrabold text-[#111214] leading-none group-hover:underline">{readers.length}</div>
                    <div className="text-[10px] font-semibold text-black/75 mt-1 leading-tight">Individuals</div>
                  </button>
                  <button type="button" onClick={() => handleSelectTab("institutions")} className="text-left cursor-pointer group">
                    <div className="text-xl font-extrabold text-[#111214] leading-none group-hover:underline">{activeInstitutionsCount}</div>
                    <div className="text-[10px] font-semibold text-black/75 mt-1 leading-tight">Active Inst.</div>
                  </button>
                </div>

                <YellowCardPatternSVG />
              </div>

              {/* CARD 2: CORAL ORANGE — CATALOG & GENRE DISTRIBUTION */}
              <div
                className="md:col-span-4 admin-bento-card rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden shadow-md"
                style={{ background: "linear-gradient(145deg, #FF9451 0%, #FA7336 100%)" }}
              >
                <div className="flex items-start justify-between gap-2 relative z-10">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-black/65">Catalog Mix</span>
                    <h2 className="text-lg font-bold text-[#111214] leading-tight">Library Inventory</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("filters")}
                    title="Manage Global Filters"
                    className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 flex items-center justify-center text-[#111214] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 mt-2 relative z-10">
                  <ul className="space-y-2 text-xs font-semibold text-[#181412]">
                    <li className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#181412]" />
                      <span>PDF Titles ({pdfBooksCount})</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white/80 border border-black/30" />
                      <span>Subjects ({genresCount})</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-black/45" />
                      <span>Authors ({authorsCount})</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F5F23B]" />
                      <span>Featured ({featuredAuthors.length})</span>
                    </li>
                  </ul>

                  <div className="relative flex items-center justify-center shrink-0">
                    <OrangePiePatternSVG />
                    <button
                      type="button"
                      onClick={() => handleSelectTab("books")}
                      className="absolute top-6 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-[#F5F23B] text-[#111214] text-xs font-extrabold shadow-md hover:scale-105 transition-transform cursor-pointer"
                    >
                      {books.length} Books
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 3: OBSIDIAN DARK — CATALOG SPOTLIGHT STACKED CARD */}
              <div
                className="md:col-span-4 admin-bento-card rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden shadow-xl text-white"
                style={{ background: "linear-gradient(155deg, #17181c 0%, #0b0c0e 100%)" }}
              >
                <div className="flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">Spotlight</span>
                    {spotlightBooks.length > 1 && (
                      <div className="flex items-center gap-1">
                        {spotlightBooks.slice(0, 4).map((sb, idx) => (
                          <button
                            key={sb.id}
                            type="button"
                            aria-label={`Show spotlight book ${idx + 1}`}
                            onClick={() => setSpotlightIdx(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              (spotlightIdx % spotlightBooks.length) === idx ? "w-5 bg-white" : "w-2 bg-white/30 hover:bg-white/55"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("books")}
                    title="Manage all books"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                {currentSpotlight ? (
                  <div className="mt-3 relative">
                    {/* Stacked translucent background layer */}
                    <div className="mx-3 h-3 rounded-t-2xl bg-white/10 border-t border-x border-white/15 -mb-1" />
                    <div className="rounded-2xl p-3.5 bg-white/[0.08] border border-white/15 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {currentSpotlight.coverUrl && currentSpotlight.coverUrl !== "null" ? (
                          <img
                            src={currentSpotlight.coverUrl}
                            alt={currentSpotlight.title}
                            className="w-12 h-16 rounded-lg object-cover shadow-lg ring-1 ring-white/20 shrink-0"
                          />
                        ) : (
                          <div className="shrink-0">
                            <Book3DFallbackSVG color={currentSpotlight.color || "#F97316"} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F97316] text-white mb-1">
                            {currentSpotlight.genre || "Featured"}
                          </span>
                          <h3 className="text-sm font-bold text-white truncate">{currentSpotlight.title}</h3>
                          <p className="text-[11px] text-white/70 truncate">
                            {currentSpotlight.author} · {currentSpotlight.totalPages || 0}p
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {currentSpotlight.coverUrl && currentSpotlight.coverUrl !== "null" && (
                          <button
                            type="button"
                            onClick={() => downloadCoverImage(currentSpotlight.coverUrl, currentSpotlight.title)}
                            title="Download cover page from database"
                            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/35 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer border border-white/20"
                          >
                            <Download size={16} strokeWidth={2.3} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate && onNavigate("reading", currentSpotlight.id)}
                          title="Preview book in Secure Reader"
                          className="w-10 h-10 rounded-xl bg-[#F5F23B] hover:bg-[#ebe72b] text-[#111214] flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Eye size={16} strokeWidth={2.3} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-white/60">No books published yet.</div>
                )}
              </div>
            </section>
          )}

          {/* ACTIVE TAB PANEL */}
          <main className="min-w-0">
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
              <InstitutionsTab
                books={books}
                licenses={licenses}
                activeSessionCounts={activeSessionCounts}
                onCreateLicense={onCreateLicense}
                onRevokeLicense={onRevokeLicense}
                onDeleteLicense={onDeleteLicense}
                onToggleLicenseStatus={onToggleLicenseStatus}
                onResendEmail={onResendInstitutionEmail}
                onEditAccess={onEditInstitutionAccess}
                onRotateSemesterPassword={onRotateSemesterPassword}
                onUpdateInstitutionDepartments={onUpdateInstitutionDepartments}
              />
            )}
            {tab === "readers" && (
              <ReadersTab
                books={books}
                readers={readers}
                onCreateReader={onCreateReader}
                onRevokeReader={onRevokeReader}
                onDeleteReader={onDeleteReader}
                onToggleReaderStatus={onToggleReaderStatus}
                onResendEmail={onResendReaderEmail}
                onEditAccess={onEditReaderAccess}
              />
            )}
            {tab === "uploaders" && (
              <UploadersTab uploaders={uploaders} onAddUploader={onAddUploader} onRemoveUploader={onRemoveUploader} />
            )}
            {tab === "trials" && (
              <TrialsTab
                books={books}
                trialRequests={trialRequests}
                onApproveTrial={onApproveTrial}
                onRejectTrial={onRejectTrial}
                onDeleteTrial={onDeleteTrial}
                onDeleteRejectedTrials={onDeleteRejectedTrials}
                onResendEmail={onResendTrialEmail}
                onEditAccess={onEditTrialAccess}
              />
            )}
            {tab === "authors" && (
              <FeaturedAuthorsTab books={books} authors={featuredAuthors} onAddAuthor={onAddFeaturedAuthor} onRemoveAuthor={onRemoveFeaturedAuthor} />
            )}
            {tab === "filters" && <FiltersTab onRenameBookMetadata={onRenameBookMetadata} />}
            {tab === "homepage" && <HomepageTab books={books} />}
            {tab === "pages" && <PagesTab />}
            {tab === "emails" && <EmailsTab emailTemplates={emailTemplates} onUpdateEmailTemplate={onUpdateEmailTemplate} />}
            {tab === "subscribers" && <SubscribersTab subscribers={subscribers} />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function InstitutionsTab({
  books,
  licenses,
  activeSessionCounts = {},
  onCreateLicense,
  onRevokeLicense,
  onDeleteLicense,
  onToggleLicenseStatus,
  onResendEmail,
  onEditAccess,
  onRotateSemesterPassword,
  onUpdateInstitutionDepartments
}) {
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

  // Department Management state
  const [managingDeptLicense, setManagingDeptLicense] = useState(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptLoginId, setNewDeptLoginId] = useState("");
  const [newDeptPassword, setNewDeptPassword] = useState("");
  const [showDeptPw, setShowDeptPw] = useState({});
  const [showStudentPw, setShowStudentPw] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [viewingStudentsDeptId, setViewingStudentsDeptId] = useState(null);
  const [isSavingDept, setIsSavingDept] = useState(false);

  function openManageDepartments(license) {
    const fresh = licenses.find(l => l.id === license.id) || license;
    setManagingDeptLicense(fresh);
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptLoginId("");
    setNewDeptPassword("");
    setViewingStudentsDeptId(null);
  }

  async function handleAddDepartment(e) {
    e.preventDefault();
    if (!managingDeptLicense || !newDeptName.trim()) return;
    setIsSavingDept(true);

    const code = (newDeptCode.trim() || newDeptName.trim().slice(0, 3)).toUpperCase();
    const loginId = newDeptLoginId.trim() || `${managingDeptLicense.id}-${code}`;
    const password = newDeptPassword.trim() || genPassword();

    const newDept = {
      id: `dept_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newDeptName.trim(),
      code,
      loginId,
      password,
      readsCount: 0,
      students: [],
      createdAt: new Date().toISOString()
    };

    const currentDepts = Array.isArray(managingDeptLicense.departments) ? [...managingDeptLicense.departments] : [];
    if (currentDepts.some(d => (d.loginId || "").toLowerCase() === loginId.toLowerCase())) {
      alert("A department with Login ID '" + loginId + "' already exists for this institution.");
      setIsSavingDept(false);
      return;
    }

    const updated = [...currentDepts, newDept];
    const ok = await onUpdateInstitutionDepartments(managingDeptLicense.id, updated);
    setIsSavingDept(false);
    if (ok !== false) {
      setManagingDeptLicense(prev => ({ ...prev, departments: updated }));
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptLoginId("");
      setNewDeptPassword("");
    }
  }

  async function handleDeleteDepartment(deptId) {
    if (!managingDeptLicense) return;
    if (!window.confirm("Are you sure you want to remove this department? Its Department ID and all student profiles will be removed.")) {
      return;
    }
    const currentDepts = Array.isArray(managingDeptLicense.departments) ? [...managingDeptLicense.departments] : [];
    const updated = currentDepts.filter(d => d.id !== deptId);
    const ok = await onUpdateInstitutionDepartments(managingDeptLicense.id, updated);
    if (ok !== false) {
      setManagingDeptLicense(prev => ({ ...prev, departments: updated }));
      if (viewingStudentsDeptId === deptId) setViewingStudentsDeptId(null);
    }
  }

  async function handleDeleteStudent(deptId, studentId) {
    if (!managingDeptLicense) return;
    if (!window.confirm("Are you sure you want to remove this student profile?")) return;

    const currentDepts = Array.isArray(managingDeptLicense.departments) ? [...managingDeptLicense.departments] : [];
    const deptIdx = currentDepts.findIndex(d => d.id === deptId);
    if (deptIdx === -1) return;

    const currentStudents = Array.isArray(currentDepts[deptIdx].students) ? currentDepts[deptIdx].students : [];
    const updatedStudents = currentStudents.filter(s => (s.id !== studentId && s.studentId !== studentId));

    currentDepts[deptIdx] = {
      ...currentDepts[deptIdx],
      students: updatedStudents
    };

    const ok = await onUpdateInstitutionDepartments(managingDeptLicense.id, currentDepts);
    if (ok !== false) {
      setManagingDeptLicense(prev => ({ ...prev, departments: currentDepts }));
    }
  }

  function handleCopyText(text, key) {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (_) {}
  }

  // Semester Password Rotation state
  const [rotatingLicense, setRotatingLicense] = useState(null);
  const [newSemesterPw, setNewSemesterPw] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedSuccess, setRotatedSuccess] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState(null);
  const [isDeletingLicense, setIsDeletingLicense] = useState(false);

  async function handleConfirmDeleteLicense() {
    if (!deletingLicense || !onDeleteLicense) return;
    setIsDeletingLicense(true);
    const ok = await onDeleteLicense(deletingLicense.id);
    setIsDeletingLicense(false);
    if (ok !== false) {
      setDeletingLicense(null);
    }
  }

  function openRotatePassword(license) {
    setRotatingLicense(license);
    setNewSemesterPw(genPassword());
    setRotatedSuccess(false);
  }

  async function handleConfirmRotatePassword(e) {
    e.preventDefault();
    if (!rotatingLicense || !newSemesterPw) return;
    setIsRotating(true);
    const ok = await onRotateSemesterPassword(rotatingLicense.id, newSemesterPw);
    setIsRotating(false);
    if (ok) {
      setRotatedSuccess(true);
    }
  }

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
    const existing = license.bookIds || license.bookids || [];
    setSelected(Array.isArray(existing) ? [...existing] : []);
    setSearch("");
    setGenreFilter("All");
    setPubTypeFilter("All");
    setAuthorFilter("All");
    setShowEditAccessModal(true);
  }
  
  async function handleSaveAccess() {
    await onEditAccess(editLicenseId, selected);
    setShowEditAccessModal(false);
    setEditLicenseId(null);
    setSelected([]);
  }

  async function handleCreate(e) {
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
    
    const ok = await onCreateLicense({
      id, password: pass, name, email, type: "license",
      bookIds: selected, seats: Number(seats), price: Number(price) || 0,
      startDate: actualStart, endDate: actualEnd, createdAt: new Date().toISOString(),
      departments: []
    });
    if (ok !== false) {
      setIssuedCreds({ id, password: pass, endDate: actualEnd });
      setName(""); setEmail(""); setSeats(100); setPrice(""); setSelected([]); setStartDate(today()); setDuration(12); setIsTest(false); setCustomId(""); setCustomPassword("");
    }
  }

  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLicenses = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return licenses.filter((l) => {
      const left = daysUntil(l.endDate);
      const expired = left < 0;
      const isOffline = l.type === "offline";
      const statusKey = isOffline ? "offline" : expired ? "expired" : "active";
      if (statusFilter !== "all" && statusFilter !== statusKey) return false;
      if (!q) return true;
      return (
        (l.name || "").toLowerCase().includes(q) ||
        (l.id || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
      );
    });
  }, [licenses, tableSearch, statusFilter]);

  return (
    <div className="space-y-4">
      {/* GLASS SEARCH / FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="admin-glass-pill flex items-center gap-2 px-3.5 py-2 rounded-full flex-1 max-w-sm">
            <Search size={14} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search institutions, login ID or email..."
              className="w-full bg-transparent text-xs font-medium text-[#111214] placeholder:text-zinc-500 outline-none"
            />
            {tableSearch && (
              <button type="button" onClick={() => setTableSearch("")} className="text-zinc-500 hover:text-black cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
          <select
            aria-label="Filter institutions by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-[#111214] outline-none cursor-pointer"
          >
            <option value="all">Status: All ({licenses.length})</option>
            <option value="active">Active</option>
            <option value="offline">Offline</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} /> Create institution license
        </button>
      </div>

      <div className="admin-glass-panel rounded-[22px] overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Institutions directory" className="admin-table-region">
          <table className="w-full text-sm border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-slate-200/55 backdrop-blur-md">
                {["Institution", "Login ID", "Password", "Active Readers", "Books", "Term", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="text-left px-3.5 py-3 font-bold text-zinc-600 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((l) => {
                const left = daysUntil(l.endDate);
                const expired = left < 0;
                const soon = left <= 15 && !expired;
                const isOffline = l.type === "offline";
                const activeCount = activeSessionCounts[l.id] || 0;
                const isSpiked = activeCount >= 50;
                const initial = String(l.name || "I").charAt(0).toUpperCase();
                return (
                  <tr key={l.id} className="border-t border-black/[0.06] bg-white/45 even:bg-slate-200/30 hover:bg-white/80 transition-colors">
                    <td className="px-3.5 py-3 align-middle font-semibold text-[#111214] max-w-[220px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F5F23B] to-[#F97316] text-[#111214] font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-xs sm:text-[13px]" title={l.name}>{l.name}</div>
                          {l.email && <div className="text-[11px] text-zinc-500 truncate font-normal" title={l.email}>{l.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{l.id}</code></td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{l.password}</code></td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-bold text-zinc-800 text-xs">{activeCount}</span>
                        {isSpiked ? (
                          <Badge tone="warn" className="animate-pulse inline-flex items-center gap-1 text-[10px]">
                            <Activity size={10} /> Spike
                          </Badge>
                        ) : activeCount > 0 ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Active readers" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 align-middle text-xs font-semibold text-zinc-700 whitespace-nowrap">{l.bookIds.length} titles</td>
                    <td className="px-3.5 py-3 align-middle text-xs text-zinc-700 whitespace-nowrap">{l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}</td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                      {isOffline ? <Badge tone="bad">Offline</Badge> : expired ? <Badge tone="bad">Expired</Badge> : soon ? <Badge tone="warn">{left}d left</Badge> : <Badge tone="good">Active</Badge>}
                    </td>
                    <td className="px-3.5 py-3 align-middle min-w-[265px]">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {l.email && (
                          <button onClick={() => onResendEmail && onResendEmail(l.id)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-amber-100/85 hover:bg-amber-200/90 text-amber-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                            <Mail size={11} /> Resend
                          </button>
                        )}
                        <button
                          onClick={() => openRotatePassword(l)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-indigo-100/85 hover:bg-indigo-200/90 text-indigo-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                        >
                          <Key size={11} /> Rotate PW
                        </button>
                        <button
                          type="button"
                          onClick={() => openManageDepartments(l)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-blue-100/85 hover:bg-blue-200/90 text-blue-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          title="Manage departments, generate dept IDs and track usage"
                        >
                          <Building2 size={11} /> Depts ({Array.isArray(l.departments) ? l.departments.length : 0})
                        </button>
                        <button onClick={() => openEditAccess(l)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-white/85 hover:bg-white border border-black/10 text-[#111214] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs">
                          Edit Access
                        </button>
                        {!expired && (
                          <button onClick={() => onToggleLicenseStatus(l.id, !isOffline)} className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${isOffline ? "bg-emerald-100/85 text-emerald-800 hover:bg-emerald-200/85" : "bg-amber-100/85 text-amber-800 hover:bg-amber-200/85"}`}>
                            {isOffline ? "Set Online" : "Set Offline"}
                          </button>
                        )}
                        {!expired && !isOffline && (
                          <button onClick={() => onRevokeLicense(l.id)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-orange-100/85 hover:bg-orange-200/90 text-orange-800 text-[11px] font-semibold transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingLicense(l)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          title="Permanently delete institution"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLicenses.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600 text-xs font-medium">No matching institutions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Create institution license" onClose={() => { setShowForm(false); setIssuedCreds(null); }} wide>
          {issuedCreds ? (
            <div>
              <p className="text-sm mb-4 text-slate-700">
                License created. Send these credentials to the institution — shown only once here.
              </p>
              <div className="rounded-2xl border border-amber-300/70 p-4 mb-5 text-sm space-y-2 bg-[#F5F23B]/20 backdrop-blur-md">
                <div>Login ID: <code className="px-2 py-0.5 rounded bg-white/80 font-mono text-xs">{issuedCreds.id}</code></div>
                <div>Password: <code className="px-2 py-0.5 rounded bg-white/80 font-mono text-xs">{issuedCreds.password}</code></div>
                <div>Access until: <code className="px-2 py-0.5 rounded bg-white/80 font-mono text-xs">{issuedCreds.endDate}</code></div>
              </div>
              <Button onClick={() => { setShowForm(false); setIssuedCreds(null); }} className="w-full">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="Institution name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Field label="Custom Login ID (optional)" placeholder="Leave blank to auto-generate" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={customId} onChange={(e) => setCustomId(e.target.value)} />
                <Field label="Custom Password (optional)" placeholder="Leave blank to auto-generate" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} />
                <Field label="Contact Email" type="email" required autoCorrect="off" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
                <Field label="Number of seats" type="number" min="1" required value={seats} onChange={(e) => setSeats(e.target.value)} />
                <Field label="Start date" type="date" required={!isTest} disabled={isTest} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Field label="Duration (months)" type="number" min="1" max="240" required={!isTest} disabled={isTest} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>

              <label className="mt-1 mb-4 flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5F23B]/25 border border-[#F5F23B]/70 cursor-pointer transition-colors hover:bg-[#F5F23B]/35">
                <input type="checkbox" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} className="brand-check-fallback cursor-pointer" />
                <span className="text-xs font-bold text-[#111214]">⚡ Create as 5-minute test license</span>
              </label>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#111214]">
                  Select books for this bundle — {selected.length} of {books.length} selected
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select Filtered</button>
                  <button type="button" onClick={() => setSelected([])} className="px-3 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer">Clear All</button>
                </div>
              </div>
              <search className="block space-y-2 mb-3">
                <div className="relative flex items-center">
                  <Search size={15} className="text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="search"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles or authors…"
                    aria-label="Search titles or authors"
                    autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    className="glass-field-control pl-9"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select aria-label="Filter by genre" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Genres</option>
                    {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select aria-label="Filter by publication type" value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Pub Types</option>
                    {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select aria-label="Filter by author" value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Authors</option>
                    {allAuthors.map((a) => <option key={a} value={a}>{a.length > 18 ? a.substring(0,18)+"…" : a}</option>)}
                  </select>
                </div>
              </search>

              <div className="rounded-2xl border border-white/90 bg-white/65 backdrop-blur-md max-h-56 overflow-y-auto mb-5 shadow-inner divide-y divide-slate-200/60">
                {filteredBooks.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-white/90 transition-colors">
                    <input type="checkbox" className="brand-check-fallback shrink-0" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />
                    <span 
                      className="w-6 h-8 rounded overflow-hidden flex-shrink-0 bg-cover bg-center shadow-sm" 
                      style={{ 
                        backgroundColor: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? "transparent" : b.color,
                        backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                      }} 
                    />
                    <span className="flex-1 font-medium text-[#111214] truncate">{b.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">{b.genre}</span>
                  </label>
                ))}
                {filteredBooks.length === 0 && <div className="px-3 py-6 text-sm text-center text-slate-600">No matches found.</div>}
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-[#111214]">Select Books ({selected.length} chosen of {books.length} total)</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(books.map(b => b.id))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select All</button>
              {search || genreFilter !== "All" || pubTypeFilter !== "All" || authorFilter !== "All" ? (
                <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select Filtered</button>
              ) : null}
              <button type="button" onClick={() => setSelected([])} className="px-3 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer">Clear All</button>
            </div>
          </div>
          <search className="flex flex-wrap gap-2 mb-4">
            <input type="search" placeholder="Search books or authors..." aria-label="Search books or authors" autoCorrect="off" autoCapitalize="none" spellCheck={false} className="glass-field-control flex-1 min-w-[170px]" value={search} onChange={e => setSearch(e.target.value)} />
            <select aria-label="Filter by genre" className="glass-field-control w-auto min-w-[130px] text-xs" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {getGenres().map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select aria-label="Filter by publication type" className="glass-field-control w-auto min-w-[130px] text-xs" value={pubTypeFilter} onChange={e => setPubTypeFilter(e.target.value)}>
              <option value="All">All Pub Types</option>
              {allPubTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select aria-label="Filter by author" className="glass-field-control w-auto min-w-[130px] text-xs" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}>
              <option value="All">All Authors</option>
              {allAuthors.map(a => <option key={a} value={a}>{a.length > 15 ? a.substring(0,15)+"..." : a}</option>)}
            </select>
          </search>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto p-1">
            {filteredBooks.map((b) => {
              const isChecked = selected.includes(b.id);
              return (
                <div 
                  key={b.id} 
                  onClick={() => toggle(b.id)} 
                  className={`rounded-2xl border p-2.5 flex items-start gap-2.5 cursor-pointer transition-all ${isChecked ? 'bg-[#F5F23B]/30 border-[#111214]/40 shadow-sm' : 'bg-white/70 border-white/90 hover:bg-white/95'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}} 
                    className="mt-1 shrink-0 pointer-events-none brand-check-fallback" 
                  />
                  <div
                    className="w-8 h-11 rounded-md overflow-hidden shrink-0 shadow-sm bg-cover bg-center"
                    style={{
                      backgroundColor: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? "transparent" : b.color,
                      backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight truncate text-[#111214]">{b.title}</div>
                    <div className="text-[10px] text-slate-600 mt-1 truncate">{b.author}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={handleSaveAccess} className="w-full">
            Save Changes
          </Button>
        </Modal>
      )}

      {rotatingLicense && (
        <Modal
          title={`Rotate Semester Password: ${rotatingLicense.name}`}
          onClose={() => { setRotatingLicense(null); setRotatedSuccess(false); }}
        >
          {rotatedSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-900 text-sm">
                <div className="font-bold flex items-center gap-2 mb-1">
                  <Check size={16} className="text-green-600" /> Password Rotated Successfully!
                </div>
                <p className="text-xs text-green-800">
                  The previous semester password has been revoked. Students must use the new semester password to access the library.
                </p>
              </div>

              <div className="rounded-md border p-4 text-sm space-y-2 bg-[#FFF9E6] border-[#FDEB9E]">
                <div>Institution: <strong>{rotatingLicense.name}</strong></div>
                <div>Login ID: <code>{rotatingLicense.id}</code></div>
                <div>New Semester Password: <code className="font-bold text-base text-black bg-white px-2 py-0.5 rounded border border-amber-300">{newSemesterPw}</code></div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(newSemesterPw);
                    alert("Password copied to clipboard!");
                  }}
                  className="flex-1"
                >
                  Copy Password
                </Button>
                {rotatingLicense.email && (
                  <Button
                    variant="brass"
                    onClick={() => {
                      if (onResendEmail) onResendEmail(rotatingLicense.id);
                      alert("Updated credentials sent to " + rotatingLicense.email);
                    }}
                    className="flex-1"
                  >
                    <Mail size={14} /> Email Institution
                  </Button>
                )}
                <Button onClick={() => { setRotatingLicense(null); setRotatedSuccess(false); }} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmRotatePassword} className="space-y-4">
              <p className="text-sm text-gray-700">
                Rotating the semester password will immediately invalidate the previous password. Past semester students who have graduated will no longer have access.
              </p>

              <div className="p-3 bg-gray-50 rounded border text-xs space-y-1">
                <div>Institution: <strong>{rotatingLicense.name}</strong></div>
                <div>Current Password: <code>{rotatingLicense.password}</code></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Semester Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newSemesterPw}
                    onChange={(e) => setNewSemesterPw(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm font-mono focus:border-amber-400 outline-none"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewSemesterPw(genPassword())}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRotatingLicense(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isRotating}>
                  {isRotating ? "Rotating..." : "Confirm & Rotate"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {deletingLicense && (
        <Modal
          title="Delete Institution License"
          onClose={() => !isDeletingLicense && setDeletingLicense(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
              <p className="font-semibold mb-1">Are you sure you want to permanently delete this institution?</p>
              <p className="text-xs text-red-800">
                <strong>{deletingLicense.name}</strong> (Login ID: <code>{deletingLicense.id}</code>) will be permanently removed from the database and will no longer be able to log in.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeletingLicense(null)} disabled={isDeletingLicense}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteLicense}
                disabled={isDeletingLicense}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Trash2 size={14} /> {isDeletingLicense ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {managingDeptLicense && (
        <Modal
          title={`Departments — ${managingDeptLicense.name}`}
          onClose={() => setManagingDeptLicense(null)}
          wide
        >
          <div className="space-y-5">
            {/* Institution Info Card */}
            <div className="p-4 rounded-2xl bg-slate-100/80 border border-black/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-0.5">Institution License</div>
                <div className="text-base font-bold text-[#111214]">{managingDeptLicense.name}</div>
                <div className="text-xs text-zinc-600 mt-1 flex items-center gap-2">
                  <span>College ID: <code className="font-mono bg-white px-2 py-0.5 rounded border border-black/10 font-bold">{managingDeptLicense.id}</code></span>
                  <span>•</span>
                  <span>Total Depts: <strong>{(managingDeptLicense.departments || []).length}</strong></span>
                </div>
              </div>
              <div className="text-xs text-zinc-600 max-w-sm">
                💡 Each department gets its own Login ID and password so students can log in under their department, create personal student IDs, and usage is tracked department-by-department.
              </div>
            </div>

            {/* Add Department Form */}
            <form onSubmit={handleAddDepartment} className="p-4 rounded-2xl bg-[#F5F23B]/15 border border-[#F5F23B]/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#111214] flex items-center gap-1.5">
                <Plus size={14} /> Add New Department
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Dept Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={newDeptName}
                    onChange={(e) => {
                      setNewDeptName(e.target.value);
                      if (!newDeptCode) {
                        const words = e.target.value.split(/\s+/).filter(Boolean);
                        const autoCode = words.length > 1 ? words.map(w => w[0]).join('').slice(0, 4) : e.target.value.slice(0, 3);
                        setNewDeptCode(autoCode.toUpperCase());
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Dept Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Custom Login ID</label>
                  <input
                    type="text"
                    placeholder={newDeptCode ? `${managingDeptLicense.id}-${newDeptCode}` : "Leave blank to auto-generate"}
                    value={newDeptLoginId}
                    onChange={(e) => setNewDeptLoginId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Password</label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={newDeptPassword}
                    onChange={(e) => setNewDeptPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs font-medium text-[#111214] outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={isSavingDept || !newDeptName.trim()} variant="brass" size="sm">
                  <Plus size={13} /> {isSavingDept ? "Adding..." : "Add Department"}
                </Button>
              </div>
            </form>

            {/* Department List */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 flex items-center justify-between">
                <span>Active Departments ({(managingDeptLicense.departments || []).length})</span>
                <span className="text-[11px] font-normal text-zinc-500">Track reads and student profiles per department</span>
              </div>

              {(!managingDeptLicense.departments || managingDeptLicense.departments.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-white/50 border border-black/5 text-xs text-zinc-500">
                  No departments created yet. Use the form above to create departments like Computer Science, Mechanical Eng, Botany, etc.
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {managingDeptLicense.departments.map((dept) => {
                    const isPwVisible = showDeptPw[dept.id];
                    const isCopiedId = copiedKey === `id_${dept.id}`;
                    const isCopiedPw = copiedKey === `pw_${dept.id}`;
                    const isViewingStudents = viewingStudentsDeptId === dept.id;
                    const studentList = Array.isArray(dept.students) ? dept.students : [];

                    return (
                      <div key={dept.id} className="p-4 rounded-2xl bg-white/70 border border-black/10 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {dept.code || dept.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#111214] flex items-center gap-2">
                                <span>{dept.name}</span>
                                {dept.code && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                                    {dept.code}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 flex items-center gap-3 mt-0.5">
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                  📊 Reads: <strong>{dept.readsCount || 0}</strong>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Users size={12} /> {studentList.length} student profile{studentList.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {studentList.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingStudentsDeptId(isViewingStudents ? null : dept.id)}
                                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-zinc-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {isViewingStudents ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {isViewingStudents ? "Hide Students" : "View Students"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="px-2.5 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete department"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Credentials Row */}
                        <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-black/5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-600">Login ID:</span>
                            <code className="px-2 py-0.5 rounded bg-white font-mono font-bold text-zinc-900 border border-black/10">
                              {dept.loginId}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyText(dept.loginId, `id_${dept.id}`)}
                              className="p-1 rounded hover:bg-white text-zinc-500 hover:text-black cursor-pointer"
                              title="Copy Login ID"
                            >
                              {isCopiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-600">Password:</span>
                            <code className="px-2 py-0.5 rounded bg-white font-mono font-bold text-zinc-900 border border-black/10">
                              {isPwVisible ? dept.password : "••••••••"}
                            </code>
                            <button
                              type="button"
                              onClick={() => setShowDeptPw(prev => ({ ...prev, [dept.id]: !prev[dept.id] }))}
                              className="p-1 rounded hover:bg-white text-zinc-500 hover:text-black cursor-pointer"
                              title={isPwVisible ? "Hide password" : "Show password"}
                            >
                              {isPwVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(dept.password, `pw_${dept.id}`)}
                              className="p-1 rounded hover:bg-white text-zinc-500 hover:text-black cursor-pointer"
                              title="Copy password"
                            >
                              {isCopiedPw ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Student Profiles View */}
                        {isViewingStudents && (
                          <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/5">
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                                <GraduationCap size={14} className="text-blue-700" />
                                <span>Registered Students ({studentList.length})</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-medium">
                                Student ID & password access for this department
                              </span>
                            </div>

                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {studentList.map((stu) => {
                                const stuKey = stu.id || stu.studentId;
                                const isStuPwVisible = showStudentPw[stuKey];
                                const isCopiedStuId = copiedKey === `stuid_${stuKey}`;
                                const isCopiedStuPw = copiedKey === `stupw_${stuKey}`;

                                return (
                                  <div
                                    key={stuKey}
                                    className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-black/10 transition-colors shadow-xs space-y-2 relative group/stu"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-bold text-xs text-[#111214] truncate">
                                        {stu.name || "Student"}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStudent(dept.id, stuKey)}
                                        className="opacity-0 group-hover/stu:opacity-100 p-1 rounded hover:bg-rose-100 text-rose-600 transition-opacity cursor-pointer shrink-0"
                                        title="Delete student profile"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>

                                    {/* Student ID */}
                                    <div className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded-md border border-black/5">
                                      <span className="text-zinc-500 font-semibold">Student ID:</span>
                                      <div className="flex items-center gap-1">
                                        <code className="font-mono font-bold text-zinc-900">{stu.studentId}</code>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(stu.studentId, `stuid_${stuKey}`)}
                                          className="p-0.5 rounded hover:bg-slate-100 text-zinc-500 hover:text-black cursor-pointer"
                                          title="Copy Student ID"
                                        >
                                          {isCopiedStuId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Student Password */}
                                    <div className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded-md border border-black/5">
                                      <span className="text-zinc-500 font-semibold">Password:</span>
                                      <div className="flex items-center gap-1">
                                        <code className="font-mono font-bold text-zinc-900">
                                          {isStuPwVisible ? (stu.password || "—") : "••••••••"}
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() => setShowStudentPw(prev => ({ ...prev, [stuKey]: !prev[stuKey] }))}
                                          className="p-0.5 rounded hover:bg-slate-100 text-zinc-500 hover:text-black cursor-pointer"
                                          title={isStuPwVisible ? "Hide password" : "Show password"}
                                        >
                                          {isStuPwVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(stu.password || "", `stupw_${stuKey}`)}
                                          className="p-0.5 rounded hover:bg-slate-100 text-zinc-500 hover:text-black cursor-pointer"
                                          title="Copy Password"
                                        >
                                          {isCopiedStuPw ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="text-[10px] text-zinc-600 pt-0.5 border-t border-black/5 flex items-center justify-between">
                                      <span>Joined {stu.createdAt ? new Date(stu.createdAt).toLocaleDateString() : "Recently"}</span>
                                      {stu.customizations?.readingProgress && Object.keys(stu.customizations.readingProgress).length > 0 && (
                                        <span className="text-emerald-700 font-semibold">
                                          {Object.keys(stu.customizations.readingProgress).length} active read{Object.keys(stu.customizations.readingProgress).length > 1 ? "s" : ""}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-black/10">
              <Button type="button" onClick={() => setManagingDeptLicense(null)} className="px-6">
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ReadersTab({
  books,
  readers = [],
  onCreateReader,
  onRevokeReader,
  onDeleteReader,
  onToggleReaderStatus,
  onResendEmail,
  onEditAccess
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const [editReaderId, setEditReaderId] = useState(null);
  const [showEditAccessModal, setShowEditAccessModal] = useState(false);
  const [deletingReader, setDeletingReader] = useState(null);
  const [isDeletingReader, setIsDeletingReader] = useState(false);

  async function handleConfirmDeleteReader() {
    if (!deletingReader || !onDeleteReader) return;
    setIsDeletingReader(true);
    const ok = await onDeleteReader(deletingReader.id);
    setIsDeletingReader(false);
    if (ok !== false) {
      setDeletingReader(null);
    }
  }

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

  function openEditAccess(reader) {
    setEditReaderId(reader.id);
    const existing = reader.bookIds || reader.bookids || [];
    setSelected(Array.isArray(existing) ? [...existing] : (existing === "all" ? books.map(b => b.id) : []));
    setSearch("");
    setGenreFilter("All");
    setPubTypeFilter("All");
    setAuthorFilter("All");
    setShowEditAccessModal(true);
  }

  async function handleSaveAccess() {
    if (onEditAccess && editReaderId) {
      await onEditAccess(editReaderId, selected);
    }
    setShowEditAccessModal(false);
    setEditReaderId(null);
    setSelected([]);
  }

  function handleCreate(e) {
    e.preventDefault();
    const id = customId.trim() || genCredentialId(name.slice(0, 3).toUpperCase() || "USR");
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

    if (onCreateReader) {
      onCreateReader({
        id, loginId: id, password: pass, name, email,
        bookIds: selected, price: Number(price) || 0,
        startDate: actualStart, endDate: actualEnd, accountType: "individual"
      });
    }
    setIssuedCreds({ id, password: pass, endDate: actualEnd });
    setName(""); setEmail(""); setPrice(""); setSelected([]); setStartDate(today()); setDuration(12); setIsTest(false); setCustomId(""); setCustomPassword("");
  }

  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredReaders = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return readers.filter((r) => {
      const left = daysUntil(r.endDate);
      const expired = left < 0 || r.status === "revoked" || r.status === "expired";
      const isOffline = r.status === "offline";
      const statusKey = isOffline ? "offline" : expired ? "expired" : "active";
      if (statusFilter !== "all" && statusFilter !== statusKey) return false;
      if (!q) return true;
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.loginId || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
      );
    });
  }, [readers, tableSearch, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="admin-glass-pill flex items-center gap-2 px-3.5 py-2 rounded-full flex-1 max-w-sm">
            <Search size={14} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search user name, login ID or email..."
              className="w-full bg-transparent text-xs font-medium text-[#111214] placeholder:text-zinc-500 outline-none"
            />
            {tableSearch && (
              <button type="button" onClick={() => setTableSearch("")} className="text-zinc-500 hover:text-black cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
          <select
            aria-label="Filter individual users by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-[#111214] outline-none cursor-pointer"
          >
            <option value="all">Status: All ({readers.length})</option>
            <option value="active">Active</option>
            <option value="offline">Offline</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} /> Create individual user / order
        </button>
      </div>

      <div className="admin-glass-panel rounded-[22px] overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Individual users and orders" className="admin-table-region">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-slate-200/55 backdrop-blur-md">
                {["User", "Login ID", "Password", "Books", "Term", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="text-left px-3.5 py-3 font-bold text-zinc-600 uppercase tracking-wider text-[10px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReaders.map((r) => {
                const left = daysUntil(r.endDate);
                const expired = left < 0 || r.status === "revoked" || r.status === "expired";
                const soon = left <= 15 && !expired;
                const isOffline = r.status === "offline";
                const bookCount = Array.isArray(r.bookIds) ? r.bookIds.length : (r.bookIds === "all" ? books.length : 0);
                const initial = String(r.name || r.loginId || "U").charAt(0).toUpperCase();
                return (
                  <tr key={r.id} className="border-t border-black/[0.06] bg-white/45 even:bg-slate-200/30 hover:bg-white/80 transition-colors">
                    <td className="px-3.5 py-3 align-middle max-w-[220px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#60A5FA] to-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[#111214] text-xs sm:text-[13px] truncate" title={r.name || ""}>{r.name || "—"}</div>
                          {r.email && <div className="text-[11px] text-zinc-500 truncate" title={r.email}>{r.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{r.loginId}</code></td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{r.password}</code></td>
                    <td className="px-3.5 py-3 align-middle text-xs font-semibold text-zinc-700 whitespace-nowrap">{bookCount} titles</td>
                    <td className="px-3.5 py-3 align-middle text-xs text-zinc-700 whitespace-nowrap">
                      {r.startDate ? r.startDate.slice(0, 10) : "—"} → {r.endDate ? r.endDate.slice(0, 10) : "—"}
                    </td>
                    <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                      {isOffline ? (
                        <Badge tone="bad">Offline</Badge>
                      ) : expired ? (
                        <Badge tone="bad">Expired</Badge>
                      ) : soon ? (
                        <Badge tone="warn">{left}d left</Badge>
                      ) : (
                        <Badge tone="good">Active</Badge>
                      )}
                    </td>
                    <td className="px-3.5 py-3 align-middle min-w-[235px]">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {r.email && (
                          <button
                            onClick={() => onResendEmail && onResendEmail(r.id)}
                            className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-amber-100/85 hover:bg-amber-200/90 text-amber-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          >
                            <Mail size={11} /> Resend
                          </button>
                        )}
                        <button
                          onClick={() => openEditAccess(r)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-white/85 hover:bg-white border border-black/10 text-[#111214] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          Edit Access
                        </button>
                        {!expired && (
                          <button
                            onClick={() => onToggleReaderStatus && onToggleReaderStatus(r.id, !isOffline)}
                            className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${
                              isOffline ? "bg-emerald-100/85 text-emerald-800 hover:bg-emerald-200/85" : "bg-amber-100/85 text-amber-800 hover:bg-amber-200/85"
                            }`}
                          >
                            {isOffline ? "Set Online" : "Set Offline"}
                          </button>
                        )}
                        {!expired && !isOffline && (
                          <button
                            onClick={() => onRevokeReader && onRevokeReader(r.id)}
                            className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-orange-100/85 hover:bg-orange-200/90 text-orange-800 text-[11px] font-semibold transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingReader(r)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          title="Permanently delete user"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReaders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-600 text-xs font-medium">No matching individual users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Create individual user / order" onClose={() => { setShowForm(false); setIssuedCreds(null); }} wide>
          {issuedCreds ? (
            <div>
              <p className="text-sm mb-4 text-slate-700">
                Credentials issued successfully. Share these with the user or check email:
              </p>
              <div className="rounded-2xl bg-[#F5F23B]/20 p-4 border border-amber-300/70 mb-5 space-y-2 text-sm font-mono text-[#111214]">
                <div><strong>Login ID:</strong> {issuedCreds.id}</div>
                <div><strong>Password:</strong> {issuedCreds.password}</div>
                <div><strong>Expires:</strong> {issuedCreds.endDate.slice(0, 10)}</div>
              </div>
              <Button onClick={() => { setShowForm(false); setIssuedCreds(null); }} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. John Doe" />
                <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCorrect="off" autoCapitalize="none" spellCheck={false} placeholder="john@example.com" />
              </div>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                <Select label="Duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  <option value={1}>1 month</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months (1 yr)</option>
                  <option value={24}>24 months (2 yr)</option>
                  <option value={36}>36 months (3 yr)</option>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="Custom Login ID (optional)" value={customId} onChange={(e) => setCustomId(e.target.value)} autoCorrect="off" autoCapitalize="none" spellCheck={false} placeholder="Auto-generated if empty" />
                <Field label="Custom Password (optional)" value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} autoCorrect="off" autoCapitalize="none" spellCheck={false} placeholder="Auto-generated if empty" />
              </div>

              <label htmlFor="testReaderOrder" className="flex items-center gap-2.5 p-3 bg-[#F5F23B]/25 border border-[#F5F23B]/70 rounded-2xl cursor-pointer hover:bg-[#F5F23B]/35 transition-colors">
                <input type="checkbox" id="testReaderOrder" checked={isTest} onChange={e => setIsTest(e.target.checked)} className="brand-check-fallback cursor-pointer" />
                <span className="text-xs font-bold text-[#111214]">
                  ⚡ 5-Minute Test Order (for instant expiration testing)
                </span>
              </label>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#111214]">
                  Select books for this user — {selected.length} of {books.length} selected
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select Filtered</button>
                  <button type="button" onClick={() => setSelected([])} className="px-3 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer">Clear All</button>
                </div>
              </div>
              <search className="block space-y-2 mb-3">
                <div className="relative flex items-center">
                  <Search size={15} className="text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="search"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search titles or authors…"
                    aria-label="Search titles or authors"
                    autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    className="glass-field-control pl-9"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select aria-label="Filter by genre" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Genres</option>
                    {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select aria-label="Filter by publication type" value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Pub Types</option>
                    {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select aria-label="Filter by author" value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="glass-field-control text-xs">
                    <option value="All">All Authors</option>
                    {allAuthors.map((a) => <option key={a} value={a}>{a.length > 18 ? a.substring(0,18)+"…" : a}</option>)}
                  </select>
                </div>
              </search>

              <div className="rounded-2xl border border-white/90 bg-white/65 backdrop-blur-md max-h-56 overflow-y-auto mb-5 shadow-inner divide-y divide-slate-200/60">
                {filteredBooks.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer hover:bg-white/90 transition-colors">
                    <input type="checkbox" className="brand-check-fallback shrink-0" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />
                    <span 
                      className="w-6 h-8 rounded overflow-hidden flex-shrink-0 bg-cover bg-center shadow-sm" 
                      style={{ 
                        backgroundColor: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? "transparent" : b.color,
                        backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                      }} 
                    />
                    <span className="flex-1 text-[#111214] font-medium truncate">{b.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">{b.genre}</span>
                  </label>
                ))}
                {filteredBooks.length === 0 && <div className="px-3 py-6 text-sm text-center text-slate-600">No matches found.</div>}
              </div>

              <Button type="submit" className="w-full" disabled={selected.length === 0}>
                Generate credentials &amp; create individual order
              </Button>
            </form>
          )}
        </Modal>
      )}

      {showEditAccessModal && (
        <Modal title="Edit Individual User Access" onClose={() => setShowEditAccessModal(false)} wide>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-[#111214]">Select Books ({selected.length} chosen of {books.length} total)</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(books.map(b => b.id))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select All</button>
              {search || genreFilter !== "All" || pubTypeFilter !== "All" || authorFilter !== "All" ? (
                <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select Filtered</button>
              ) : null}
              <button type="button" onClick={() => setSelected([])} className="px-3 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer">Clear All</button>
            </div>
          </div>

          <search className="block space-y-2 mb-4">
            <div className="relative flex items-center">
              <Search size={15} className="text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="search"
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles or authors…"
                aria-label="Search titles or authors"
                autoCorrect="off" autoCapitalize="none" spellCheck={false}
                className="glass-field-control pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select aria-label="Filter by genre" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="glass-field-control text-xs">
                <option value="All">All Genres</option>
                {getGenres().map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select aria-label="Filter by publication type" value={pubTypeFilter} onChange={(e) => setPubTypeFilter(e.target.value)} className="glass-field-control text-xs">
                <option value="All">All Pub Types</option>
                {allPubTypes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select aria-label="Filter by author" value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="glass-field-control text-xs">
                <option value="All">All Authors</option>
                {allAuthors.map((a) => <option key={a} value={a}>{a.length > 18 ? a.substring(0,18)+"…" : a}</option>)}
              </select>
            </div>
          </search>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
            {filteredBooks.map((b) => {
              const isChecked = selected.includes(b.id);
              return (
                <div 
                  key={b.id} 
                  onClick={() => toggle(b.id)} 
                  className={`rounded-2xl border p-2.5 flex items-start gap-2.5 cursor-pointer transition-all ${isChecked ? 'bg-[#F5F23B]/30 border-[#111214]/40 shadow-sm' : 'bg-white/70 border-white/90 hover:bg-white/95'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}} 
                    className="mt-1 shrink-0 pointer-events-none brand-check-fallback" 
                  />
                  <div
                    className="w-8 h-11 rounded-md overflow-hidden shrink-0 shadow-sm bg-cover bg-center"
                    style={{
                      backgroundColor: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? "transparent" : b.color,
                      backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight truncate text-[#111214]">{b.title}</div>
                    <div className="text-[10px] text-slate-600 mt-1 truncate">{b.author}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleSaveAccess} className="w-full">
            Save Changes
          </Button>
        </Modal>
      )}

      {deletingReader && (
        <Modal
          title="Delete Individual User"
          onClose={() => !isDeletingReader && setDeletingReader(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
              <p className="font-semibold mb-1">Are you sure you want to permanently delete this user?</p>
              <p className="text-xs text-red-800">
                <strong>{deletingReader.name || deletingReader.loginId}</strong> (Login ID: <code>{deletingReader.loginId}</code>) will be permanently removed from the database and will no longer be able to log in.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeletingReader(null)} disabled={isDeletingReader}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteReader}
                disabled={isDeletingReader}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Trash2 size={14} /> {isDeletingReader ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
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
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111214]">Uploader Accounts ({uploaders.length})</h2>
          <p className="text-xs text-zinc-600">Manage staff credentials authorized to upload and update catalog books.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} /> Add uploader
        </button>
      </div>
      <div className="admin-glass-panel rounded-[22px] overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Uploaders list" className="admin-table-region">
          <table className="w-full text-sm border-collapse min-w-[660px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-slate-200/55 backdrop-blur-md">
                {["Name", "Email", "Login ID", "Password", "Actions"].map((h) => (
                  <th key={h} scope="col" className="text-left px-3.5 py-3 font-bold text-zinc-600 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uploaders.map((u) => (
                <tr key={u.id} className="border-t border-black/[0.06] bg-white/45 even:bg-slate-200/30 hover:bg-white/80 transition-colors">
                  <td className="px-3.5 py-3 align-middle font-semibold text-[#111214] whitespace-nowrap">{u.name}</td>
                  <td className="px-3.5 py-3 align-middle text-zinc-700 truncate max-w-[220px]" title={u.email || ""}>{u.email || "—"}</td>
                  <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{u.id}</code></td>
                  <td className="px-3.5 py-3 align-middle whitespace-nowrap"><code className="px-2 py-0.5 rounded-lg bg-white/75 border border-white text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{u.password}</code></td>
                  <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                    <button onClick={() => onRemoveUploader(u.id)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                      <Trash2 size={11} strokeWidth={1.8} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {uploaders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-xs font-medium">No uploader accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
function TrialsTab({ books, trialRequests, onApproveTrial, onRejectTrial, onDeleteTrial, onDeleteRejectedTrials, onResendEmail, onEditAccess }) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTrialId, setActiveTrialId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [pubTypeFilter, setPubTypeFilter] = useState("All");
  const [authorFilter, setAuthorFilter] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingTrial, setDeletingTrial] = useState(null);
  const [isDeletingTrial, setIsDeletingTrial] = useState(false);
  const [confirmClearRejected, setConfirmClearRejected] = useState(false);
  const [isClearingRejected, setIsClearingRejected] = useState(false);

  const rejectedCount = useMemo(
    () => trialRequests.filter((t) => t.status === "rejected").length,
    [trialRequests]
  );

  const filteredTrials = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return trialRequests.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.institution || "").toLowerCase().includes(q)
      );
    });
  }, [trialRequests, tableSearch, statusFilter]);

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
    const existing = trial.bookids !== undefined && trial.bookids !== null
      ? trial.bookids
      : (trial.bookIds !== undefined && trial.bookIds !== null ? trial.bookIds : books.map(b => b.id));
    setSelected(Array.isArray(existing) ? [...existing] : []);
    setSearch("");
    setGenreFilter("All");
    setPubTypeFilter("All");
    setAuthorFilter("All");
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    await onEditAccess(activeTrialId, selected);
    setShowEditModal(false);
    setActiveTrialId(null);
    setSelected([]);
  }

  async function handleConfirmDeleteTrial() {
    if (!deletingTrial || !onDeleteTrial) return;
    setIsDeletingTrial(true);
    try {
      await onDeleteTrial(deletingTrial.id);
      setDeletingTrial(null);
    } finally {
      setIsDeletingTrial(false);
    }
  }

  async function handleConfirmClearRejected() {
    if (!onDeleteRejectedTrials) return;
    setIsClearingRejected(true);
    try {
      await onDeleteRejectedTrials();
      setConfirmClearRejected(false);
    } finally {
      setIsClearingRejected(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="admin-glass-pill flex items-center gap-2 px-3.5 py-2 rounded-full flex-1 max-w-sm">
            <Search size={14} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search trial name, email or institution..."
              className="w-full bg-transparent text-xs font-medium text-[#111214] placeholder:text-zinc-500 outline-none"
            />
            {tableSearch && (
              <button type="button" onClick={() => setTableSearch("")} className="text-zinc-500 hover:text-black cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
          <select
            aria-label="Filter trial requests by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-[#111214] outline-none cursor-pointer"
          >
            <option value="all">Status: All ({trialRequests.length})</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected ({rejectedCount})</option>
          </select>
        </div>

        {rejectedCount > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearRejected(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-red-700 bg-red-100/85 hover:bg-red-200/90 border border-red-200/80 shadow-sm transition-all cursor-pointer"
          >
            <Trash2 size={14} /> Delete All Rejected ({rejectedCount})
          </button>
        )}
      </div>

      <div className="admin-glass-panel rounded-[22px] overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Trial requests" className="admin-table-region">
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-slate-200/55 backdrop-blur-md">
                {["Name", "Email", "Institution", "Requested", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="text-left px-3.5 py-3 font-bold text-zinc-600 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrials.map((t) => (
                <tr key={t.id} className="border-t border-black/[0.06] bg-white/45 even:bg-slate-200/30 hover:bg-white/80 transition-colors">
                  <td className="px-3.5 py-3 align-middle font-semibold text-[#111214] whitespace-nowrap">{t.name}</td>
                  <td className="px-3.5 py-3 align-middle text-zinc-700 truncate max-w-[200px]" title={t.email}>{t.email}</td>
                  <td className="px-3.5 py-3 align-middle text-zinc-700 truncate max-w-[180px]" title={t.institution || ""}>{t.institution || "—"}</td>
                  <td className="px-3.5 py-3 align-middle text-xs text-zinc-700 whitespace-nowrap">{t.requestedAt}</td>
                  <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                    {t.status === "pending" && <Badge tone="warn">Pending</Badge>}
                    {t.status === "approved" && <Badge tone="good">Approved · ends {t.expiresAt}</Badge>}
                    {t.status === "rejected" && <Badge tone="bad">Rejected</Badge>}
                  </td>
                  <td className="px-3.5 py-3 align-middle min-w-[250px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.status === "pending" && (
                          <>
                            <button onClick={() => handleOpenApprove(t.id)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-emerald-100/85 hover:bg-emerald-200/90 text-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                              <Check size={12} strokeWidth={2.2} /> Approve
                            </button>
                            <button onClick={() => onRejectTrial(t.id)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-orange-100/85 hover:bg-orange-200/90 text-orange-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                              <X size={12} strokeWidth={2.2} /> Reject
                            </button>
                          </>
                        )}
                        {t.status === "approved" && (
                          <>
                            <button onClick={() => handleOpenEdit(t)} className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-black/10 text-[#111214] text-[11px] font-semibold cursor-pointer shadow-xs">
                              Edit Access
                            </button>
                            <button
                              onClick={() => onResendEmail && onResendEmail(t.id, 'approved')}
                              className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-amber-100/85 hover:bg-amber-200/90 text-amber-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Mail size={11} /> Resend Email
                            </button>
                          </>
                        )}
                        {t.status === "rejected" && (
                          <button
                            onClick={() => onResendEmail && onResendEmail(t.id, 'rejected')}
                            className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-black/10 text-[#111214] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Mail size={11} /> Resend Rejection
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingTrial(t)}
                          className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete trial request permanently"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                      {t.status === "approved" && t.password && (
                        <span className="text-[11px] font-semibold text-zinc-700 whitespace-nowrap">Login: <code>{t.email}</code> / <code>{t.password}</code></span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrials.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-600 text-xs font-medium">No matching trial requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingTrial && (
        <Modal
          title="Delete Trial Request"
          onClose={() => !isDeletingTrial && setDeletingTrial(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-black">
                <p className="font-bold mb-1">
                  Permanently delete trial request for &ldquo;{deletingTrial.name}&rdquo;?
                </p>
                <p className="text-xs text-black/80">
                  Email: <strong>{deletingTrial.email}</strong> ({deletingTrial.status}).
                  {deletingTrial.status === "approved"
                    ? " This will also remove their free-trial login access immediately."
                    : " This action cannot be undone."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingTrial(null)}
                disabled={isDeletingTrial}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteTrial}
                disabled={isDeletingTrial}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Trash2 size={14} /> {isDeletingTrial ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmClearRejected && (
        <Modal
          title="Delete All Rejected Trials"
          onClose={() => !isClearingRejected && setConfirmClearRejected(false)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-black">
                <p className="font-bold mb-1">
                  Permanently delete all {rejectedCount} rejected trial request{rejectedCount > 1 ? "s" : ""}?
                </p>
                <p className="text-xs text-black/80">
                  Pending and approved trial requests will remain untouched. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmClearRejected(false)}
                disabled={isClearingRejected}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmClearRejected}
                disabled={isClearingRejected}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Trash2 size={14} /> {isClearingRejected ? "Deleting..." : `Delete ${rejectedCount} Rejected`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {(showApproveModal || showEditModal) && (
        <Modal title={showApproveModal ? "Approve Trial & Select Books" : "Edit Trial Access"} onClose={() => { setShowApproveModal(false); setShowEditModal(false); }} wide>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-[#111214]">Select Books ({selected.length} chosen)</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(Array.from(new Set([...selected, ...filteredBooks.map(b => b.id)])))} className="px-3 py-1 rounded-full bg-white/80 hover:bg-[#111214] hover:text-[#F5F23B] text-xs font-semibold text-[#111214] border border-white transition-colors cursor-pointer">Select Filtered</button>
              <button type="button" onClick={() => setSelected([])} className="px-3 py-1 rounded-full bg-rose-100/80 hover:bg-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer">Clear All</button>
            </div>
          </div>
          <search className="flex flex-wrap gap-2 mb-4">
            <input type="search" placeholder="Search titles or authors..." aria-label="Search titles or authors" autoCorrect="off" autoCapitalize="none" spellCheck={false} className="glass-field-control flex-1 min-w-[170px]" value={search} onChange={e => setSearch(e.target.value)} />
            <select aria-label="Filter by genre" className="glass-field-control w-auto min-w-[120px] text-xs" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="All">All Genres</option>
              {getGenres().map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select aria-label="Filter by publication type" className="glass-field-control w-auto min-w-[120px] text-xs" value={pubTypeFilter} onChange={e => setPubTypeFilter(e.target.value)}>
              <option value="All">All Pub Types</option>
              {allPubTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select aria-label="Filter by author" className="glass-field-control w-auto min-w-[120px] text-xs" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)}>
              <option value="All">All Authors</option>
              {allAuthors.map(a => <option key={a} value={a}>{a.length > 15 ? a.substring(0,15)+"..." : a}</option>)}
            </select>
          </search>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
            {filteredBooks.map((b) => {
              const isChecked = selected.includes(b.id);
              return (
                <div 
                  key={b.id} 
                  onClick={() => toggle(b.id)} 
                  className={`rounded-2xl border p-2.5 flex items-start gap-2.5 cursor-pointer transition-all ${isChecked ? 'bg-[#F5F23B]/30 border-[#111214]/40 shadow-sm' : 'bg-white/70 border-white/90 hover:bg-white/95'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}} 
                    className="mt-1 shrink-0 pointer-events-none brand-check-fallback" 
                  />
                  <div
                    className="w-8 h-11 rounded-md overflow-hidden shrink-0 shadow-sm bg-cover bg-center"
                    style={{
                      backgroundColor: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? "transparent" : b.color,
                      backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight truncate text-[#111214]">{b.title}</div>
                    <div className="text-[10px] text-slate-600 mt-1 truncate">{b.author}</div>
                  </div>
                </div>
              );
            })}
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
function EditableFilterList({
  title,
  description,
  items,
  placeholder,
  newValue,
  onChangeNewValue,
  onAdd,
  onRename,
  onRemove,
  minItems = 0,
}) {
  const [editingOld, setEditingOld] = useState(null);
  const [editingText, setEditingText] = useState("");

  const startEdit = (item) => {
    setEditingOld(item);
    setEditingText(item);
  };

  const cancelEdit = () => {
    setEditingOld(null);
    setEditingText("");
  };

  const commitEdit = () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    if (trimmed !== editingOld) {
      onRename(editingOld, trimmed);
    }
    cancelEdit();
  };

  return (
    <div className="rounded-2xl bg-white/45 border border-white/70 p-4 backdrop-blur-md">
      <h3 className="font-bold text-base mb-2 border-b border-black/10 pb-2 text-[#111214]">{title}</h3>
      {description && <p className="text-xs text-zinc-600 mb-3">{description}</p>}
      <form onSubmit={onAdd} className="flex gap-2 mb-4">
        <input
          className="flex-1 rounded-full bg-white/80 border border-white px-3.5 py-2 text-xs font-medium outline-none focus:border-[#F5F23B]"
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => onChangeNewValue(e.target.value)}
          required
        />
        <Button type="submit" variant="brass" size="sm">Add</Button>
      </form>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item) => {
          const isEditing = editingOld === item;
          return (
            <li key={item} className="flex justify-between items-center gap-2 bg-white/85 px-3 py-2 border border-white rounded-xl text-sm shadow-sm">
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    className="flex-1 border border-[#FDD132] rounded px-2 py-1 text-xs font-semibold outline-none"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitEdit();
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={commitEdit}
                      title="Save"
                      className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      title="Cancel"
                      className="p-1.5 rounded-lg text-zinc-600 bg-zinc-100/80 hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-semibold text-xs text-[#111214] truncate">{item}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      title="Edit spelling / format"
                      className="p-1.5 rounded-lg text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                    {items.length > minItems && (
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-red-600 bg-red-50/80 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="text-xs text-black italic p-1">No items added yet.</li>}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
function FiltersTab({ onRenameBookMetadata }) {
  const [genres, setLocalGenres] = useState(getGenres());
  const [pubTypes, setLocalPubTypes] = useState(getPubTypes());
  const [publishers, setLocalPublishers] = useState(getPublishers());
  const [customHeadings, setLocalCustomHeadings] = useState(getCustomHeadings());

  const [newGenre, setNewGenre] = useState("");
  const [newPubType, setNewPubType] = useState("");
  const [newPublisher, setNewPublisher] = useState("");
  const [newHeadingName, setNewHeadingName] = useState("");
  const [newHeadingOption, setNewHeadingOption] = useState({});
  const [editingCustomOpt, setEditingCustomOpt] = useState(null);

  const handleAddGenre = (e) => {
    e.preventDefault();
    const trimmed = newGenre.trim();
    if (!trimmed) return;
    if (genres.includes(trimmed)) {
      setNewGenre("");
      return;
    }
    const updated = [...genres, trimmed].sort();
    setLocalGenres(updated);
    saveGenres(updated);
    setNewGenre("");
  };

  const handleRenameGenre = (oldVal, newVal) => {
    const updated = Array.from(new Set(genres.map(x => (x === oldVal ? newVal : x)))).sort();
    setLocalGenres(updated);
    saveGenres(updated);
    onRenameBookMetadata?.("genre", oldVal, newVal);
  };

  const handleRemoveGenre = (g) => {
    const updated = genres.filter(x => x !== g);
    setLocalGenres(updated);
    saveGenres(updated);
  };

  const handleAddPubType = (e) => {
    e.preventDefault();
    const trimmed = newPubType.trim();
    if (!trimmed) return;
    if (pubTypes.includes(trimmed)) {
      setNewPubType("");
      return;
    }
    const updated = [...pubTypes, trimmed].sort();
    setLocalPubTypes(updated);
    savePubTypes(updated);
    setNewPubType("");
  };

  const handleRenamePubType = (oldVal, newVal) => {
    const updated = Array.from(new Set(pubTypes.map(x => (x === oldVal ? newVal : x)))).sort();
    setLocalPubTypes(updated);
    savePubTypes(updated);
    onRenameBookMetadata?.("pubType", oldVal, newVal);
  };

  const handleRemovePubType = (t) => {
    const updated = pubTypes.filter(x => x !== t);
    setLocalPubTypes(updated);
    savePubTypes(updated);
  };

  const handleAddPublisher = (e) => {
    e.preventDefault();
    const trimmed = newPublisher.trim();
    if (!trimmed) return;
    if (publishers.includes(trimmed)) {
      setNewPublisher("");
      return;
    }
    const updated = [...publishers, trimmed];
    setLocalPublishers(updated);
    savePublishers(updated);
    setNewPublisher("");
  };

  const handleRenamePublisher = (oldVal, newVal) => {
    const updated = Array.from(new Set(publishers.map(x => (x === oldVal ? newVal : x))));
    setLocalPublishers(updated);
    savePublishers(updated);
    onRenameBookMetadata?.("publisher", oldVal, newVal);
  };

  const handleRemovePublisher = (p) => {
    if (publishers.length <= 1) return;
    const updated = publishers.filter(x => x !== p);
    setLocalPublishers(updated);
    savePublishers(updated);
  };

  const handleAddCustomHeading = (e) => {
    e.preventDefault();
    if (!newHeadingName.trim()) return;
    const updated = [...customHeadings, { id: Date.now().toString(), name: newHeadingName.trim(), options: [] }];
    setLocalCustomHeadings(updated);
    saveCustomHeadings(updated);
    setNewHeadingName("");
  };

  const handleRemoveCustomHeading = (id) => {
    const updated = customHeadings.filter(h => h.id !== id);
    setLocalCustomHeadings(updated);
    saveCustomHeadings(updated);
  };

  const handleAddCustomOption = (e, headingId) => {
    e.preventDefault();
    const opt = newHeadingOption[headingId];
    if (!opt?.trim()) return;

    const updated = customHeadings.map(h => {
      if (h.id === headingId) {
        const trimmed = opt.trim();
        if (h.options.includes(trimmed)) return h;
        return { ...h, options: [...h.options, trimmed].sort() };
      }
      return h;
    });
    setLocalCustomHeadings(updated);
    saveCustomHeadings(updated);
    setNewHeadingOption(prev => ({ ...prev, [headingId]: "" }));
  };

  const handleRenameCustomOption = (headingId, oldOpt, newOpt) => {
    const trimmed = newOpt.trim();
    if (!trimmed) return;
    const updated = customHeadings.map(h => {
      if (h.id === headingId) {
        return { ...h, options: Array.from(new Set(h.options.map(o => (o === oldOpt ? trimmed : o)))).sort() };
      }
      return h;
    });
    setLocalCustomHeadings(updated);
    saveCustomHeadings(updated);
    setEditingCustomOpt(null);
  };

  const handleRemoveCustomOption = (headingId, optionName) => {
    const updated = customHeadings.map(h => {
      if (h.id === headingId) {
        return { ...h, options: h.options.filter(o => o !== optionName) };
      }
      return h;
    });
    setLocalCustomHeadings(updated);
    saveCustomHeadings(updated);
  };

  return (
    <div className="admin-glass-panel p-6 rounded-[22px]">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#111214]">Manage Dropdown Filters</h2>
        <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
          Add, edit spelling/format, or remove items from these lists to control the options available when adding or editing books.
          Editing an existing item will also update matching books across your catalog.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <EditableFilterList
          title="Subjects / Genres"
          items={genres}
          placeholder="e.g. BIOPHYSICS"
          newValue={newGenre}
          onChangeNewValue={setNewGenre}
          onAdd={handleAddGenre}
          onRename={handleRenameGenre}
          onRemove={handleRemoveGenre}
        />

        <EditableFilterList
          title="Publication Types"
          items={pubTypes}
          placeholder="e.g. eBooks"
          newValue={newPubType}
          onChangeNewValue={setNewPubType}
          onAdd={handleAddPubType}
          onRename={handleRenamePubType}
          onRemove={handleRemovePubType}
        />

        <EditableFilterList
          title="Publishers"
          description="Default is Spellbound. Add additional publishers here for future use."
          items={publishers}
          placeholder="e.g. Spellbound Academic"
          newValue={newPublisher}
          onChangeNewValue={setNewPublisher}
          onAdd={handleAddPublisher}
          onRename={handleRenamePublisher}
          onRemove={handleRemovePublisher}
          minItems={1}
        />
      </div>

      <div className="border-t border-black/10 pt-7 mt-2">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-[#111214]">Custom Filter Headings</h3>
            <p className="text-xs text-zinc-600 mt-0.5">Create new metadata fields that uploaders can fill out (e.g. &quot;Resources&quot;)</p>
          </div>
          <form onSubmit={handleAddCustomHeading} className="flex items-center gap-2">
            <input
              className="w-60 rounded-full bg-white/80 border border-white px-4 py-2 text-xs font-medium outline-none focus:border-[#F5F23B] shadow-sm"
              placeholder="New Heading Name..."
              value={newHeadingName}
              onChange={(e) => setNewHeadingName(e.target.value)}
              required
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-sm transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.3} /> Create
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {customHeadings.map(h => (
            <div key={h.id} className="rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md shadow-sm">
              <div className="flex justify-between items-center border-b border-black/10 pb-3 mb-4">
                <h4 className="font-bold text-base text-[#111214]">{h.name}</h4>
                <button
                  onClick={() => handleRemoveCustomHeading(h.id)}
                  className="px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={11} /> Remove Heading
                </button>
              </div>
              <form onSubmit={(e) => handleAddCustomOption(e, h.id)} className="flex gap-2 mb-4">
                <input
                  className="flex-1 rounded-full bg-white/80 border border-white px-3.5 py-2 text-xs font-medium outline-none focus:border-[#F5F23B]"
                  placeholder={`Add option to ${h.name}...`}
                  value={newHeadingOption[h.id] || ""}
                  onChange={(e) => setNewHeadingOption(prev => ({ ...prev, [h.id]: e.target.value }))}
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-sm transition-all cursor-pointer shrink-0"
                >
                  Add Option
                </button>
              </form>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {h.options.map(opt => {
                  const isEditing = editingCustomOpt?.headingId === h.id && editingCustomOpt?.oldValue === opt;
                  return (
                    <li key={opt} className="flex justify-between items-center gap-2 bg-white/85 px-3 py-2 border border-white rounded-xl text-sm shadow-sm">
                      {isEditing ? (
                        <>
                          <input
                            autoFocus
                            className="flex-1 bg-white border border-[#F5F23B] rounded-lg px-2.5 py-1 text-xs font-semibold outline-none"
                            value={editingCustomOpt.value}
                            onChange={(e) => setEditingCustomOpt(prev => ({ ...prev, value: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleRenameCustomOption(h.id, opt, editingCustomOpt.value);
                              } else if (e.key === "Escape") {
                                setEditingCustomOpt(null);
                              }
                            }}
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRenameCustomOption(h.id, opt, editingCustomOpt.value)}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCustomOpt(null)}
                              className="p-1.5 rounded-lg text-zinc-600 bg-zinc-100/80 hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-xs text-[#111214] truncate">{opt}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingCustomOpt({ headingId: h.id, oldValue: opt, value: opt })}
                              className="p-1.5 rounded-lg text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Edit spelling / format"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomOption(h.id, opt)}
                              className="p-1.5 rounded-lg text-red-600 bg-red-50/80 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
                {h.options.length === 0 && <li className="text-xs text-zinc-600 italic p-1">No options added yet.</li>}
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
    <div className="admin-glass-panel p-6 rounded-[22px]">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#111214]">Homepage Layout</h2>
        <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
          Control how books and authors are listed on the main Catalog page.
          Leave a section on &quot;Auto&quot; to dynamically fetch the most recent data, or switch it to &quot;Manual&quot; to hand-pick the exact items to feature.
        </p>
      </div>

      <div className="space-y-6">
        {/* Trending Now */}
        <div className="rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-[#111214]">Trending Now</h3>
              {config.trendingMode === 'manual' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[11px] font-bold">
                  {config.trendingBookIds.length}/3 selected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleToggleMode('trending', config.trendingMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                config.trendingMode === 'auto'
                  ? 'bg-white/80 hover:bg-white text-[#111214] border border-white'
                  : 'bg-[#F5F23B] hover:bg-[#ebe72b] text-[#111214]'
              }`}
            >
              Mode: {config.trendingMode.toUpperCase()}
            </button>
          </div>
          {config.trendingMode === 'auto' ? (
            <p className="text-xs text-zinc-600 italic">Automatically showing the 3 most recently added books.</p>
          ) : (
            <div>
              <p className="text-xs font-medium text-zinc-700 mb-3">Select exactly 3 books to feature in the Trending section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-white/55 border border-white/80 custom-scrollbar">
                {books.map(b => {
                  const picked = config.trendingBookIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => handleToggleBook('trending', b.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        picked
                          ? 'border-[#F5F23B] bg-[#FFFCE8] shadow-sm ring-1 ring-[#F5F23B]'
                          : 'bg-white/85 border-white hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#111214] line-clamp-2">{b.title}</span>
                        <span className="text-zinc-600 mt-1 block truncate">{b.author}</span>
                      </div>
                      {picked && <Check size={14} className="text-emerald-600 mt-2 self-end" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* New Releases */}
        <div className="rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-[#111214]">New Releases</h3>
              {config.newReleasesMode === 'manual' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[11px] font-bold">
                  {config.newReleasesBookIds.length}/4 selected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleToggleMode('newReleases', config.newReleasesMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                config.newReleasesMode === 'auto'
                  ? 'bg-white/80 hover:bg-white text-[#111214] border border-white'
                  : 'bg-[#F5F23B] hover:bg-[#ebe72b] text-[#111214]'
              }`}
            >
              Mode: {config.newReleasesMode.toUpperCase()}
            </button>
          </div>
          {config.newReleasesMode === 'auto' ? (
            <p className="text-xs text-zinc-600 italic">Automatically showing the next 4 most recently added books.</p>
          ) : (
            <div>
              <p className="text-xs font-medium text-zinc-700 mb-3">Select exactly 4 books to feature in the New Releases section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-white/55 border border-white/80 custom-scrollbar">
                {books.map(b => {
                  const picked = config.newReleasesBookIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => handleToggleBook('newReleases', b.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        picked
                          ? 'border-[#F5F23B] bg-[#FFFCE8] shadow-sm ring-1 ring-[#F5F23B]'
                          : 'bg-white/85 border-white hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#111214] line-clamp-2">{b.title}</span>
                        <span className="text-zinc-600 mt-1 block truncate">{b.author}</span>
                      </div>
                      {picked && <Check size={14} className="text-emerald-600 mt-2 self-end" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Created For You */}
        <div className="rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-[#111214]">Created For You</h3>
              {config.createdForYouMode === 'manual' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[11px] font-bold">
                  {config.createdForYouBookIds.length}/2 selected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleToggleMode('createdForYou', config.createdForYouMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                config.createdForYouMode === 'auto'
                  ? 'bg-white/80 hover:bg-white text-[#111214] border border-white'
                  : 'bg-[#F5F23B] hover:bg-[#ebe72b] text-[#111214]'
              }`}
            >
              Mode: {config.createdForYouMode.toUpperCase()}
            </button>
          </div>
          {config.createdForYouMode === 'auto' ? (
            <p className="text-xs text-zinc-600 italic">Automatically showing 2 books for the user based on catalog history.</p>
          ) : (
            <div>
              <p className="text-xs font-medium text-zinc-700 mb-3">Select exactly 2 books to feature in the Created For You section:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-white/55 border border-white/80 custom-scrollbar">
                {books.map(b => {
                  const picked = config.createdForYouBookIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => handleToggleBook('createdForYou', b.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        picked
                          ? 'border-[#F5F23B] bg-[#FFFCE8] shadow-sm ring-1 ring-[#F5F23B]'
                          : 'bg-white/85 border-white hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#111214] line-clamp-2">{b.title}</span>
                        <span className="text-zinc-600 mt-1 block truncate">{b.author}</span>
                      </div>
                      {picked && <Check size={14} className="text-emerald-600 mt-2 self-end" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Featured Authors */}
        <div className="rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-[#111214]">Featured Authors</h3>
              {config.featuredAuthorsMode === 'manual' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[11px] font-bold">
                  {config.featuredAuthorsList.length} added
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleToggleMode('featuredAuthors', config.featuredAuthorsMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                config.featuredAuthorsMode === 'auto'
                  ? 'bg-white/80 hover:bg-white text-[#111214] border border-white'
                  : 'bg-[#F5F23B] hover:bg-[#ebe72b] text-[#111214]'
              }`}
            >
              Mode: {config.featuredAuthorsMode.toUpperCase()}
            </button>
          </div>
          {config.featuredAuthorsMode === 'auto' ? (
            <p className="text-xs text-zinc-600 italic">Automatically showing 6 authors based on most books uploaded.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <form onSubmit={handleAddAuthor} className="flex gap-2 mb-4">
                  <input
                    name="author"
                    list="existing-authors-home"
                    className="flex-1 rounded-full bg-white/80 border border-white px-3.5 py-2 text-xs font-medium outline-none focus:border-[#F5F23B]"
                    placeholder="Select or type author name..."
                  />
                  <datalist id="existing-authors-home">
                    {allAuthors.map(a => <option key={a} value={a} />)}
                  </datalist>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    Add Author
                  </button>
                </form>
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar rounded-2xl bg-white/55 border border-white/80 p-3">
                  {config.featuredAuthorsList.map(a => (
                    <li key={a} className="flex justify-between items-center bg-white/85 px-3 py-2 border border-white rounded-xl text-sm shadow-sm">
                      <span className="font-semibold text-xs text-[#111214]">{a}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(a)}
                        className="p-1.5 rounded-lg text-red-600 bg-red-50/80 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                  {config.featuredAuthorsList.length === 0 && <li className="text-xs text-zinc-600 italic p-1">No authors added.</li>}
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
    <div className="admin-glass-panel p-6 rounded-[22px]">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-[#111214]">Manage Static Pages</h2>
        <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
          Edit the content of the footer pages (About Us, Contact Us, Terms, Privacy Policy, FAQs). Changes reflect instantly on the live site.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-1/4 rounded-2xl bg-white/45 border border-white/70 p-3 backdrop-blur-md">
          <ul className="space-y-1.5">
            {Object.keys(pages).map(slug => (
              <li key={slug}>
                <button
                  onClick={() => setActiveSlug(slug)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeSlug === slug
                      ? 'bg-[#111214] text-white font-bold shadow-sm'
                      : 'hover:bg-white/75 text-[#111214]'
                  }`}
                >
                  {pages[slug].title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full md:w-3/4 rounded-2xl bg-white/45 border border-white/70 p-5 backdrop-blur-md">
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Page Title</label>
            <input
              value={activePage.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              className="w-full rounded-xl bg-white/80 focus:bg-white border border-white focus:border-[#F5F23B] px-4 py-2.5 text-sm font-semibold text-[#111214] outline-none shadow-sm transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Page Content (Supports Line Breaks)</label>
            <textarea
              value={activePage.content}
              onChange={(e) => handleUpdate("content", e.target.value)}
              className="w-full rounded-2xl bg-white/80 focus:bg-white border border-white focus:border-[#F5F23B] px-4 py-3 text-sm text-[#111214] outline-none shadow-sm h-64 font-sans leading-relaxed transition-colors"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-[11px] font-semibold text-emerald-800">
            <Check size={12} /> Changes are saved automatically as you type
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
  const [showPreview, setShowPreview] = useState(false);
  
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

  const sampleVars = {
    name: "Dr. Eleanor Vance",
    id: "SPELL-88219",
    password: "ReadSecure#2026",
    startDate: "2026-01-15",
    endDate: "2026-12-31"
  };

  const preview = useMemo(() => {
    return renderEmailHtml(subject, body, sampleVars);
  }, [subject, body]);

  return (
    <div className="space-y-6">
      {/* EmailJS Setup Notice */}
      <div className="p-5 rounded-2xl bg-amber-50/75 backdrop-blur-md border border-amber-200/80 text-amber-950 text-xs leading-relaxed flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="space-y-1.5 max-w-2xl">
          <div className="font-bold flex items-center gap-1.5 text-sm text-amber-950">
            <Mail size={16} /> EmailJS Template Configuration Note
          </div>
          <p>
            In your EmailJS dashboard (<strong>emailjs.com</strong> &rarr; Email Templates &rarr; <code>template_cncozac</code>), make sure your message variable uses <strong>triple curly braces</strong>:
          </p>
          <div className="my-1.5 p-2 bg-white/85 rounded-xl border border-amber-300/70 font-mono text-xs inline-flex items-center gap-2">
            <span className="text-red-500 line-through">{"{{message}}"}</span>
            <span className="text-zinc-400">&rarr;</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">{"{{{message}}}"}</span>
          </div>
          <p className="text-zinc-700">
            Double braces force EmailJS to escape HTML, showing raw code tags like <code>&lt;div&gt;</code> in the email. Triple braces <code>{"{{{message}}}"}</code> allow EmailJS to properly render the card design and company logo.
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/85 p-3.5 rounded-2xl border border-white text-center shadow-sm">
          <img src={COMPANY_LOGO_URL} alt="Company Logo" className="h-10 w-auto mx-auto mb-1.5 object-contain" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">Company Logo Active</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1 admin-glass-panel rounded-[22px] p-4">
          <h3 className="font-bold mb-3.5 text-[11px] uppercase tracking-wider text-zinc-600">Available Templates</h3>
          <div className="flex flex-col gap-1.5">
            {DEFAULT_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id)}
                className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTemplate === t.id
                    ? 'bg-[#111214] text-white font-bold shadow-sm'
                    : 'hover:bg-white/75 text-[#111214]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="mt-6 text-xs text-[#111214] bg-white/60 p-3.5 rounded-2xl border border-white/80">
            <strong className="text-[11px] uppercase tracking-wider text-zinc-700">Available Variables</strong>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li><code className="bg-white/80 px-1.5 py-0.5 rounded">{`{{name}}`}</code> — User/Institution</li>
              <li><code className="bg-white/80 px-1.5 py-0.5 rounded">{`{{id}}`}</code> — Login ID</li>
              <li><code className="bg-white/80 px-1.5 py-0.5 rounded">{`{{password}}`}</code> — Password</li>
              <li><code className="bg-white/80 px-1.5 py-0.5 rounded">{`{{startDate}}`}</code> — Start Date</li>
              <li><code className="bg-white/80 px-1.5 py-0.5 rounded">{`{{endDate}}`}</code> — Expiration Date</li>
            </ul>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="admin-glass-panel rounded-[22px] p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-black/10">
              <div>
                <h2 className="text-xl font-bold text-[#111214]" style={fontDisplay}>Edit {currentDefault?.name} Email</h2>
                <p className="text-xs text-zinc-600 mt-0.5">Customize email messaging dispatched via EmailJS.</p>
              </div>

              {/* Toggle Edit vs Live Preview */}
              <div className="flex items-center gap-1 bg-white/65 p-1 rounded-full border border-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    !showPreview ? "bg-[#111214] text-white shadow-sm font-bold" : "text-zinc-600 hover:text-[#111214]"
                  }`}
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    showPreview ? "bg-[#111214] text-white shadow-sm font-bold" : "text-zinc-600 hover:text-[#111214]"
                  }`}
                >
                  <Eye size={13} /> Preview with Logo
                </button>
              </div>
            </div>

            {!showPreview ? (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Subject Line</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white focus:border-[#F5F23B] text-sm font-medium outline-none bg-white/80 focus:bg-white shadow-sm transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Email Body</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white focus:border-[#F5F23B] text-xs outline-none bg-white/80 focus:bg-white h-64 font-mono leading-relaxed shadow-sm transition-colors"
                  />
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-3.5 py-2 rounded-full bg-white/80 hover:bg-white border border-white text-xs font-semibold text-[#111214] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Eye size={13} /> Preview formatted email
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.4} /> Save Template
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/65 px-4 py-2.5 rounded-xl border border-white text-xs text-zinc-700">
                  <span><strong>Subject:</strong> {preview.subject}</span>
                  <span className="text-zinc-500">Sample variables rendered</span>
                </div>

                {/* Email Preview Frame */}
                <div className="rounded-2xl border border-white/80 overflow-hidden bg-white/45 shadow-inner p-2 sm:p-4 flex justify-center">
                  <iframe
                    title="Email Preview"
                    srcDoc={preview.html}
                    className="w-full max-w-[620px] h-[520px] border-0 rounded-xl bg-white shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="px-3.5 py-2 rounded-full bg-white/80 hover:bg-white border border-white text-xs font-semibold text-[#111214] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Edit3 size={13} /> Back to editor
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.4} /> Save Template
                  </button>
                </div>
              </div>
            )}
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
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111214]">Featured Authors ({authors.length})</h2>
          <p className="text-xs text-zinc-600">Curate author profiles displayed across the catalog showcase.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F5F23B] hover:bg-[#ebe72b] shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.4} /> Add Featured Author
        </button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {authors.map((author) => {
          if (!author) return null;
          return (
            <div key={author.id} className="admin-glass-panel rounded-[22px] p-6 flex flex-col items-center text-center hover:-translate-y-0.5 transition-all">
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F5F23B] to-[#F59E0B] mb-4 bg-cover bg-center border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-[#111214]"
                style={author.photo_url ? { backgroundImage: `url(${author.photo_url})` } : {}}
              >
                {!author.photo_url && String(author.name || "U").charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-base text-[#111214] mb-1">{String(author.name || "Unknown")}</h3>
              {author.bio && <p className="text-xs text-zinc-600 line-clamp-3 mb-4 leading-relaxed">{String(author.bio)}</p>}
              <button
                onClick={() => onRemoveAuthor(author.id)}
                className="mt-auto px-3 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          );
        })}
        {authors.length === 0 && (
          <div className="col-span-full admin-glass-panel rounded-[22px] py-12 px-6 text-center text-zinc-600 text-xs font-medium">
            No featured authors yet. Click &quot;Add Featured Author&quot; to get started.
          </div>
        )}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Add Featured Author">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="featured-author-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">Author Name</label>
              <input
                id="featured-author-name"
                list="existing-authors-admin"
                type="text"
                required
                className="glass-field-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Select or type author name..."
              />
              <datalist id="existing-authors-admin">
                {allAuthors.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="featured-author-photo" className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">Author Photo</label>
              {photoUrl ? (
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/65 border border-white/90">
                  <img src={photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover shadow" />
                  <button type="button" onClick={() => setPhotoUrl("")} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">Remove Photo</button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/65 hover:border-[#111214] p-3.5 transition-colors">
                  <input
                    id="featured-author-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    onCancel={(e) => e.stopPropagation()}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer"
                    disabled={uploading}
                  />
                  {uploading && <span className="text-xs font-medium text-slate-600 mt-2 block">Uploading...</span>}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="featured-author-bio" className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">Short Bio (Optional)</label>
              <textarea
                id="featured-author-bio"
                className="glass-field-control resize-y"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Expert in workplace software..."
              />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
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
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111214]">Newsletter Subscribers ({subscribers.length})</h2>
          <p className="text-xs text-zinc-600">Readers and educators subscribed to platform updates.</p>
        </div>
      </div>
      <div className="admin-glass-panel rounded-[22px] overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Newsletter subscribers" className="admin-table-region">
          <table className="w-full text-sm border-collapse min-w-[460px]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-slate-200/55 backdrop-blur-md">
                {["Email", "Subscribed At"].map((h) => (
                  <th key={h} scope="col" className="text-left px-3.5 py-3 font-bold text-zinc-600 uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-black/[0.06] bg-white/45 even:bg-slate-200/30 hover:bg-white/80 transition-colors">
                  <td className="px-3.5 py-3 align-middle font-semibold text-[#111214]">{s.email}</td>
                  <td className="px-3.5 py-3 align-middle text-zinc-700 text-xs whitespace-nowrap">{new Date(s.subscribed_at).toLocaleString()}</td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-4 py-8 text-center text-zinc-600 text-xs font-medium">No subscribers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
