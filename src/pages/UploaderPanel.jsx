import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, UploadCloud, BookOpen, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { palette, fontDisplay, getGenres, getPubTypes, getCustomHeadings, getPublishers } from "../theme";
import Button from "../components/Button";
import { Field, Select, TextArea, Modal } from "../components/UI";

const spineChoices = ["#8C3B3F", "#A97F45", "#2C4A3C", "#5A3B2E", "#41332A", "#6E2A34", "#1F3A30", "#9C7A44"];
const BOOKS_PER_PAGE = 12;

export default function UploaderPanel({ books, onAddBook, onEditBook, onDeleteBook, embedded, dbStatus, onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listTopRef = useRef(null);
  const [genres, setGenres] = useState([]);
  const [pubTypes, setPubTypes] = useState([]);
  const [customHeadings, setCustomHeadings] = useState([]);
  const [publishers, setPublishers] = useState(getPublishers());

  const totalBooks = books?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalBooks / BOOKS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBooks = useMemo(() => {
    const safeList = books || [];
    const startIndex = (safePage - 1) * BOOKS_PER_PAGE;
    return safeList.slice(startIndex, startIndex + BOOKS_PER_PAGE);
  }, [books, safePage]);

  const goToPage = (page) => {
    const next = Math.max(1, Math.min(page, totalPages));
    if (next === safePage) return;
    setCurrentPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
  useEffect(() => {
    if (showForm) {
      setGenres(getGenres());
      setPubTypes(getPubTypes());
      setCustomHeadings(getCustomHeadings());
      const latestPublishers = getPublishers();
      setPublishers(latestPublishers);
      if (!editingId && !form.publisher) {
        setForm(prev => ({ ...prev, publisher: latestPublishers[0] || "Spellbound" }));
      }
    }
  }, [showForm, editingId]);

  const getFreshDefaultForm = () => ({
    title: "", author: "", genre: "", pubType: "", publisher: getPublishers()[0] || "Spellbound", price: "", color: spineChoices[0],
    firstPublish: "", copyright: "", printIsbn: "", onlineIsbn: "", description: "", totalPages: "",
    pagesText: "", pdfFile: null, coverImage: null, customFields: {}
  });
  const [form, setForm] = useState(getFreshDefaultForm);

  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleEditClick(book) {
    setEditingId(book.id);
    let parsedCustomFields = {};
    if (book.description && book.description.includes("\n\n__CUSTOM_FILTERS__:")) {
      try {
        parsedCustomFields = JSON.parse(book.description.split("\n\n__CUSTOM_FILTERS__:")[1]);
      } catch (e) {}
    }
    setForm({
      title: book.title || "",
      author: book.author || "",
      genre: book.genre || "",
      pubType: book.pubType || "",
      publisher: book.publisher || getPublishers()[0] || "Spellbound",
      price: book.price !== undefined && book.price !== null ? book.price : "",
      color: book.color || spineChoices[0],
      firstPublish: book.firstPublish || "",
      copyright: "",
      printIsbn: book.printIsbn || "",
      onlineIsbn: book.onlineIsbn || "",
      description: (book.description || "").split("\n\n__CUSTOM_FILTERS__:")[0],
      totalPages: book.totalPages || "",
      pagesText: book.pages ? book.pages.join("\n---\n") : "",
      pdfFile: null,
      coverImage: null,
      pdfUrl: book.pdfUrl,
      coverUrl: book.coverUrl,
      customFields: parsedCustomFields
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setShowForm(false);
    
    const pages = form.pagesText.split("\n---\n").map((p) => p.trim()).filter(Boolean);
    const newBook = {
      id: editingId || `b${Date.now()}`,
      title: form.title,
      author: form.author,
      genre: form.genre,
      pubType: form.pubType,
      publisher: form.publisher,
      price: isNaN(Number(form.price)) ? 0 : Number(form.price),
      color: form.color,
      firstPublish: form.firstPublish,
      copyright: form.copyright,
      printIsbn: form.printIsbn,
      onlineIsbn: form.onlineIsbn,
      description: form.description + (Object.keys(form.customFields).length > 0 ? "\n\n__CUSTOM_FILTERS__:" + JSON.stringify(form.customFields) : ""),
      totalPages: form.totalPages ? Number(form.totalPages) : null,
      pages: pages.length ? pages : ["This book has no content pages yet."],
      pdfFile: form.pdfFile,
      coverImage: form.coverImage,
      pdfUrl: form.pdfUrl,
      coverUrl: form.coverUrl,
    };

    if (editingId) {
      await onEditBook(editingId, newBook);
      setForm(getFreshDefaultForm());
      setEditingId(null);
    } else {
      setCurrentPage(1);
      setPendingUpload(newBook);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.floor(Math.random() * 8) + 2;
        });
      }, 250);

      await onAddBook(newBook);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setForm(getFreshDefaultForm());
        setPendingUpload(null);
        setUploadProgress(0);
      }, 1500);
    }
  }

  const containerCls = embedded ? "" : "max-w-6xl mx-auto admin-glass-shell rounded-[28px] p-6 sm:p-8";

  const dbIndicator = (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-md ${dbStatus === 'connected' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80' : dbStatus === 'error' ? 'bg-rose-100/80 text-rose-800 border-rose-200/80' : 'bg-amber-100/80 text-amber-800 border-amber-200/80'}`}>
      <span className="relative flex h-2 w-2">
        {dbStatus === 'connected' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
        {dbStatus === 'checking' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
      </span>
      {dbStatus === 'connected' ? 'DB Connected' : dbStatus === 'error' ? 'DB Error - Using Mock Data' : 'Checking DB...'}
    </div>
  );

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [totalPages, safePage]);

  const startItem = totalBooks === 0 ? 0 : (safePage - 1) * BOOKS_PER_PAGE + 1;
  const endItem = Math.min(safePage * BOOKS_PER_PAGE, totalBooks);

  return (
    <div ref={listTopRef} className={embedded ? "scroll-mt-24" : "scroll-mt-20 admin-glass-backdrop min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6"}>
      <div className={containerCls}>
        {!embedded && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-black/10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111214]" style={fontDisplay}>Uploader panel</h1>
                {dbIndicator}
              </div>
              <p className="text-sm mt-1 text-slate-700">Add new titles to the catalog with cover artwork, metadata, and PDF content.</p>
            </div>
            <Button onClick={() => { setEditingId(null); setForm(getFreshDefaultForm()); setShowForm(true); }}><Plus size={16} strokeWidth={2.2} /> Publish new book</Button>
          </div>
        )}
        {embedded && (
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {dbIndicator}
              {totalBooks > 0 && (
                <span className="admin-glass-pill px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700">
                  Showing <strong className="text-[#111214]">{startItem}–{endItem}</strong> of <strong className="text-[#111214]">{totalBooks}</strong> · Page {safePage}/{totalPages}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(getFreshDefaultForm()); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#111214] bg-[#F2F032] hover:bg-[#e7e424] shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.4} /> Publish new book
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingUpload && safePage === 1 && (
            <div className={`flex gap-4 rounded-2xl border p-4 relative overflow-hidden transition-shadow ${embedded ? 'bg-white/65 backdrop-blur-xl border-white/80 shadow-sm' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
              {/* Progress Bar Background */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-[#FDD132] opacity-20 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
              <div
                className="w-20 h-[108px] self-start rounded-xl flex-shrink-0 z-10 overflow-hidden shadow-sm"
                style={{ backgroundColor: pendingUpload.coverImage ? "transparent" : pendingUpload.color }}
              >
                {pendingUpload.coverImage && (
                  <img
                    src={URL.createObjectURL(pendingUpload.coverImage)}
                    alt={pendingUpload.title || "Book cover"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] mb-1">{pendingUpload.genre}</span>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{pendingUpload.title}</span>
                <span className="text-xs text-black mt-0.5">{pendingUpload.author} · {pendingUpload.publisher}</span>
                <span className="text-xs text-black mt-0.5">{pendingUpload.totalPages || pendingUpload.pages?.length || 0} pages</span>
                
                <div className="mt-auto pt-3 flex items-center gap-2 text-xs font-semibold text-black hover:text-black transition-colors">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Finished!"}
                </div>
              </div>
            </div>
          )}

          {paginatedBooks.map((b) => {
            const hasCover = Boolean(b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "");
            return (
            <div key={b.id} className={`flex gap-4 p-5 transition-all ${embedded ? 'rounded-2xl bg-white/60 backdrop-blur-xl border border-white/85 shadow-sm hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-md' : 'rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md'}`}>
              <div
                className="w-20 h-[108px] self-start rounded-xl flex-shrink-0 overflow-hidden shadow-sm"
                style={{ backgroundColor: hasCover ? "transparent" : b.color }}
              >
                {hasCover && (
                  <img
                    src={b.coverUrl}
                    alt={b.title || "Book cover"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] mb-1">{b.genre}</span>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{b.title}</span>
                <span className="text-xs text-black mt-0.5">{b.author} · {b.publisher}</span>
                <span className="text-xs text-black mt-0.5">{b.totalPages || b.pages?.length || 0} pages</span>
                
                <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onNavigate && onNavigate("reading", b.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${embedded ? 'px-2.5 py-1 rounded-full bg-white/85 hover:bg-white border border-black/10 text-[#111214]' : 'text-black hover:text-black'}`}
                  >
                    <BookOpen size={12} strokeWidth={1.9} /> Preview
                  </button>
                  <button
                    onClick={() => handleEditClick(b)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${embedded ? 'px-2.5 py-1 rounded-full bg-amber-100/85 hover:bg-amber-200/85 text-amber-900' : 'text-[#D4A017] hover:text-[#b8860b]'}`}
                  >
                    <Edit2 size={12} strokeWidth={1.9} /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteBook(b.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${embedded ? 'px-2.5 py-1 rounded-full bg-red-100/85 hover:bg-red-200/90 text-red-700' : 'text-red-500 hover:text-red-700'}`}
                  >
                    <Trash2 size={12} strokeWidth={1.9} /> Remove
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <nav
            aria-label="Manage books pagination"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/10"
          >
            <span className="text-xs font-semibold text-slate-700">
              Showing <strong className="text-[#111214]">{startItem}–{endItem}</strong> of <strong className="text-[#111214]">{totalBooks}</strong> books
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold admin-glass-pill text-[#111214] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={14} strokeWidth={2.2} /> Prev
              </button>
              {pageNumbers.map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs font-bold text-slate-500 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goToPage(item)}
                    aria-current={item === safePage ? "page" : undefined}
                    className={`min-w-[32px] h-8 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      item === safePage
                        ? "bg-[#111214] text-[#F5F23B] shadow-md"
                        : "admin-glass-pill text-[#111214] hover:bg-white/90"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold admin-glass-pill text-[#111214] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next <ChevronRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </nav>
        )}
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit book" : "Add a new book"} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Field label="Author" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              
              <div className="mb-4">
                <label htmlFor="book-genre-input" className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">Subject / Genre</label>
                <input
                  id="book-genre-input"
                  list="genres-list"
                  className="glass-field-control"
                  required
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  placeholder="Select or type a new genre..."
                />
                <datalist id="genres-list">
                  {genres.map((g) => <option key={g} value={g} />)}
                </datalist>
              </div>

              <div className="mb-4">
                <label htmlFor="book-pubtype-input" className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">Publication Type</label>
                <input
                  id="book-pubtype-input"
                  list="pubtype-list"
                  className="glass-field-control"
                  required
                  value={form.pubType}
                  onChange={(e) => setForm({ ...form, pubType: e.target.value })}
                  placeholder="Select or type a new type..."
                />
                <datalist id="pubtype-list">
                  {pubTypes.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>

              {customHeadings.map(h => (
                <div key={h.id} className="mb-4">
                  <label htmlFor={`custom-field-${h.id}`} className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">{h.name}</label>
                  <input
                    id={`custom-field-${h.id}`}
                    list={`custom-list-${h.id}`}
                    className="glass-field-control"
                    value={form.customFields[h.name] || ""}
                    onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [h.name]: e.target.value } })}
                    placeholder={`Select or type ${h.name}...`}
                  />
                  <datalist id={`custom-list-${h.id}`}>
                    {h.options.map((o) => <option key={o} value={o} />)}
                  </datalist>
                </div>
              ))}

              <Select label="Publisher" required value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })}>
                {publishers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {form.publisher && !publishers.includes(form.publisher) && (
                  <option value={form.publisher}>{form.publisher}</option>
                )}
              </Select>
              <Field label="First Publish (e.g. YYYY)" value={form.firstPublish} onChange={(e) => setForm({ ...form, firstPublish: e.target.value })} />
              <Field label="Online ISBN (eISBN)" value={form.onlineIsbn} onChange={(e) => setForm({ ...form, onlineIsbn: e.target.value })} />
              <Field label="Total Pages (Number)" type="number" min="1" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} />
              <div className="mb-4 sm:col-span-2">
                <span className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">Cover accent color</span>
                <div className="flex gap-2.5 flex-wrap p-3 rounded-2xl bg-white/60 border border-white/80">
                  {spineChoices.map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-label={`Select cover accent ${c}`}
                      aria-pressed={form.color === c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full transition-all cursor-pointer ${form.color === c ? "ring-2 ring-offset-2 ring-[#111214] scale-110 shadow-md" : "opacity-85 hover:opacity-100 hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <TextArea
              label="Book Description"
              rows={3}
              placeholder="Enter a brief description of the book..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="book-cover-file" className="block text-xs font-bold uppercase tracking-wider text-slate-700">Book Cover Image {editingId && !form.coverUrl && <span className="text-[11px] font-normal normal-case text-slate-500">(Optional)</span>}</label>
                  {editingId && form.coverUrl && (
                    <button type="button" onClick={() => setForm({...form, coverUrl: null, coverImage: null})} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">Remove Cover</button>
                  )}
                </div>
                {editingId && form.coverUrl ? (
                  <div className="text-xs px-3.5 py-3 bg-emerald-100/75 text-emerald-900 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
                    <span className="font-semibold">Current Cover Saved</span>
                    <span className="text-[11px] text-emerald-800/80">Remove first to replace</span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/65 hover:border-[#111214] p-3.5 transition-colors">
                    <input 
                      id="book-cover-file"
                      type="file" 
                      accept="image/*" 
                      className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer" 
                      onChange={(e) => setForm({ ...form, coverImage: e.target.files[0] })}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="book-pdf-file" className="block text-xs font-bold uppercase tracking-wider text-slate-700">E-book PDF File {editingId && !form.pdfUrl && <span className="text-[11px] font-normal normal-case text-slate-500">(Optional)</span>}</label>
                  {editingId && form.pdfUrl && (
                    <button type="button" onClick={() => setForm({...form, pdfUrl: null, pdfFile: null})} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">Remove PDF</button>
                  )}
                </div>
                {editingId && form.pdfUrl ? (
                  <div className="text-xs px-3.5 py-3 bg-emerald-100/75 text-emerald-900 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
                    <span className="font-semibold">Current PDF Saved</span>
                    <span className="text-[11px] text-emerald-800/80">Remove first to replace</span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/65 hover:border-[#111214] p-3.5 transition-colors">
                    <input 
                      id="book-pdf-file"
                      type="file" 
                      accept="application/pdf" 
                      className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer" 
                      onChange={(e) => setForm({ ...form, pdfFile: e.target.files[0] })}
                    />
                  </div>
                )}
              </div>
            </div>

            <TextArea
              label="Page content (separate pages with a line containing only ---)"
              rows={6}
              placeholder={"Page one text here...\n---\nPage two text here..."}
              value={form.pagesText}
              onChange={(e) => setForm({ ...form, pagesText: e.target.value })}
            />
            <p className="text-xs mb-4 text-black">
              In a production build, this would accept an actual manuscript upload (PDF/EPUB) which gets converted
              into secure pages automatically — this box is a stand-in for that pipeline.
            </p>
            <Button type="submit" className="w-full"><UploadCloud size={16} strokeWidth={1.8} /> Publish book to catalog</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
