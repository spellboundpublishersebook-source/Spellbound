import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, UploadCloud, BookOpen, Edit2, ChevronLeft, ChevronRight, Layers, FileText, Sparkles, FolderUp, CheckCircle2, ChevronDown, ChevronUp, FileUp, HelpCircle } from "lucide-react";
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
    uploadFormat: "pdf", // "pdf" | "epub"
    title: "", author: "", genre: "", pubType: "", publisher: getPublishers()[0] || "Spellbound", price: "", color: spineChoices[0],
    firstPublish: "", copyright: "", printIsbn: "", onlineIsbn: "", description: "", totalPages: "",
    pagesText: "",
    // Standard PDF fields
    pdfFile: null,
    coverImage: null,
    pdfUrl: null,
    coverUrl: null,
    // EPUB Multi-section fields
    firstPageFile: null,
    firstPageUrl: null,
    contentsPageFile: null,
    contentsPageUrl: null,
    chapterCount: 3,
    chapters: [
      { id: "c1", number: 1, title: "Chapter 1", file: null, url: null, fileName: "" },
      { id: "c2", number: 2, title: "Chapter 2", file: null, url: null, fileName: "" },
      { id: "c3", number: 3, title: "Chapter 3", file: null, url: null, fileName: "" },
    ],
    customFields: {}
  });
  const [form, setForm] = useState(getFreshDefaultForm);

  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleChapterCountChange(count) {
    const n = Math.max(1, Math.min(100, parseInt(count, 10) || 1));
    setForm(prev => {
      const current = prev.chapters || [];
      let updated = [];
      if (n > current.length) {
        updated = [...current];
        for (let i = current.length + 1; i <= n; i++) {
          updated.push({
            id: `chap-${i}-${Date.now()}`,
            number: i,
            title: `Chapter ${i}`,
            file: null,
            url: null,
            fileName: ""
          });
        }
      } else {
        updated = current.slice(0, n);
      }
      return { ...prev, chapterCount: n, chapters: updated };
    });
  }

  function handleAddChapter() {
    setForm(prev => {
      const nextNum = (prev.chapters?.length || 0) + 1;
      const newChap = {
        id: `chap-${nextNum}-${Date.now()}`,
        number: nextNum,
        title: `Chapter ${nextNum}`,
        file: null,
        url: null,
        fileName: ""
      };
      const updated = [...(prev.chapters || []), newChap];
      return { ...prev, chapterCount: updated.length, chapters: updated };
    });
  }

  function handleRemoveChapter(index) {
    setForm(prev => {
      const updated = prev.chapters.filter((_, i) => i !== index).map((c, i) => ({
        ...c,
        number: i + 1,
        title: c.title || `Chapter ${i + 1}`
      }));
      return { ...prev, chapterCount: updated.length, chapters: updated };
    });
  }

  function handleChapterTitleChange(index, title) {
    setForm(prev => {
      const updated = [...prev.chapters];
      updated[index] = { ...updated[index], title };
      return { ...prev, chapters: updated };
    });
  }

  function handleChapterFileChange(index, file) {
    setForm(prev => {
      const updated = [...prev.chapters];
      updated[index] = {
        ...updated[index],
        file,
        fileName: file ? file.name : ""
      };
      return { ...prev, chapters: updated };
    });
  }

  function handleEditClick(book) {
    setEditingId(book.id);
    let parsedCustomFields = {};
    const rawDesc = book.description || "";
    let epubData = book.epubData || null;

    if (rawDesc.includes("\n\n__CUSTOM_FILTERS__:")) {
      try {
        parsedCustomFields = JSON.parse(rawDesc.split("\n\n__CUSTOM_FILTERS__:")[1].split("\n\n__EPUB_DATA__:")[0]);
      } catch (e) {}
    }
    if (!epubData && rawDesc.includes("\n\n__EPUB_DATA__:")) {
      try {
        epubData = JSON.parse(rawDesc.split("\n\n__EPUB_DATA__:")[1]);
      } catch (e) {}
    }
    if (!epubData && book.pages && typeof book.pages === "object" && !Array.isArray(book.pages) && (book.pages.type === "epub" || book.pages.format === "epub")) {
      epubData = book.pages;
    }

    const cleanDesc = rawDesc.split("\n\n__CUSTOM_FILTERS__:")[0].split("\n\n__EPUB_DATA__:")[0];
    const isEpub = Boolean(epubData || (book.pages && typeof book.pages === "object" && !Array.isArray(book.pages)));

    const initialChapters = epubData?.chapters?.length
      ? epubData.chapters.map((c, i) => ({
          id: c.id || `chap-${i + 1}`,
          number: c.number || (i + 1),
          title: c.title || `Chapter ${i + 1}`,
          file: null,
          url: c.url || null,
          fileName: c.fileName || ""
        }))
      : [
          { id: "c1", number: 1, title: "Chapter 1", file: null, url: null, fileName: "" },
          { id: "c2", number: 2, title: "Chapter 2", file: null, url: null, fileName: "" },
          { id: "c3", number: 3, title: "Chapter 3", file: null, url: null, fileName: "" }
        ];

    setForm({
      uploadFormat: isEpub ? "epub" : "pdf",
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
      description: cleanDesc,
      totalPages: book.totalPages || "",
      pagesText: Array.isArray(book.pages) ? book.pages.join("\n---\n") : "",
      pdfFile: null,
      coverImage: null,
      pdfUrl: book.pdfUrl,
      coverUrl: book.coverUrl,
      firstPageFile: null,
      firstPageUrl: epubData?.firstPage?.url || null,
      contentsPageFile: null,
      contentsPageUrl: epubData?.contentsPage?.url || null,
      chapterCount: initialChapters.length,
      chapters: initialChapters,
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
      uploadFormat: form.uploadFormat,
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
      totalPages: form.totalPages ? Number(form.totalPages) : (form.uploadFormat === "epub" ? form.chapters.length : null),
      pages: pages.length ? pages : ["This book has no content pages yet."],
      pdfFile: form.pdfFile,
      coverImage: form.coverImage,
      pdfUrl: form.pdfUrl,
      coverUrl: form.coverUrl,
      // EPUB Multi-section payloads
      firstPageFile: form.firstPageFile,
      firstPageUrl: form.firstPageUrl,
      contentsPageFile: form.contentsPageFile,
      contentsPageUrl: form.contentsPageUrl,
      chapters: form.chapters
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
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">{pendingUpload.genre}</span>
                  {pendingUpload.uploadFormat === "epub" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                      <Sparkles size={10} className="text-amber-600" /> e-Book (EPUB)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 border border-slate-400/30">
                      <FileText size={10} className="text-slate-500" /> PDF
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{pendingUpload.title}</span>
                <span className="text-xs text-black mt-0.5">{pendingUpload.author} · {pendingUpload.publisher}</span>
                <span className="text-xs text-black mt-0.5 font-medium">
                  {pendingUpload.uploadFormat === "epub"
                    ? `${pendingUpload.chapters?.length || 0} chapters`
                    : `${pendingUpload.totalPages || pendingUpload.pages?.length || 0} pages`}
                </span>
                
                <div className="mt-auto pt-3 flex items-center gap-2 text-xs font-semibold text-black hover:text-black transition-colors">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Finished!"}
                </div>
              </div>
            </div>
          )}

          {paginatedBooks.map((b) => {
            const hasCover = Boolean(b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "");
            const isEpubBook = Boolean(b.epubData || (b.pages && typeof b.pages === 'object' && !Array.isArray(b.pages)));
            const chapterTotal = b.epubData?.chapters?.length || (b.pages?.chapters?.length) || 0;
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
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">{b.genre}</span>
                  {isEpubBook ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                      <Sparkles size={10} className="text-amber-600" /> e-Book (EPUB)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 border border-slate-400/30">
                      <FileText size={10} className="text-slate-500" /> PDF
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{b.title}</span>
                <span className="text-xs text-black mt-0.5">{b.author} · {b.publisher}</span>
                <span className="text-xs text-black mt-0.5 font-medium">
                  {isEpubBook ? `${chapterTotal} chapters` : `${b.totalPages || b.pages?.length || 0} pages`}
                </span>
                
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
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${b.title}"? This cannot be undone.`)) {
                        onDeleteBook(b.id);
                      }
                    }}
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

            {/* E-BOOK FORMAT SELECTION */}
            <div className="mb-6 p-4 rounded-2xl admin-glass-panel border border-white/80 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-500" />
                  <span>Choose Upload Format &amp; Style</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Single PDF or Multi-Part Chapters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, uploadFormat: "pdf" }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    form.uploadFormat === "pdf"
                      ? "bg-[#111214] text-[#F5F23B] border-[#111214] shadow-md ring-2 ring-[#F5F23B]/30"
                      : "admin-glass-pill hover:bg-white text-slate-800 border-white/80"
                  }`}
                >
                  <FileText size={20} className={form.uploadFormat === "pdf" ? "text-[#F5F23B] shrink-0 mt-0.5" : "text-slate-600 shrink-0 mt-0.5"} />
                  <div>
                    <div className="font-bold text-sm">Standard Single PDF</div>
                    <div className={`text-xs mt-0.5 leading-snug ${form.uploadFormat === "pdf" ? "text-slate-200" : "text-slate-500"}`}>
                      Upload front cover artwork and a single master PDF document.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, uploadFormat: "epub" }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    form.uploadFormat === "epub"
                      ? "bg-[#111214] text-[#F5F23B] border-[#111214] shadow-md ring-2 ring-[#F5F23B]/30"
                      : "admin-glass-pill hover:bg-white text-slate-800 border-white/80"
                  }`}
                >
                  <Sparkles size={20} className={form.uploadFormat === "epub" ? "text-[#F5F23B] shrink-0 mt-0.5" : "text-amber-600 shrink-0 mt-0.5"} />
                  <div>
                    <div className="font-bold text-sm">e-Book / EPUB (Multi-Section)</div>
                    <div className={`text-xs mt-0.5 leading-snug ${form.uploadFormat === "epub" ? "text-slate-200" : "text-slate-500"}`}>
                      Cover page, first page, contents page, and dynamic chapter containers.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* FORMAT 1: STANDARD PDF UPLOAD */}
            {form.uploadFormat === "pdf" && (
              <>
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
                        <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-700" /> Current Cover Saved</span>
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
                        <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-700" /> Current PDF Saved</span>
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
                  rows={4}
                  placeholder={"Page one text here...\n---\nPage two text here..."}
                  value={form.pagesText}
                  onChange={(e) => setForm({ ...form, pagesText: e.target.value })}
                />
              </>
            )}

            {/* FORMAT 2: EPUB / MULTI-SECTION CHAPTER UPLOADS */}
            {form.uploadFormat === "epub" && (
              <div className="space-y-4 mb-5 p-4 rounded-2xl admin-glass-shell border border-amber-500/25 bg-amber-500/5">
                <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                  <FolderUp size={18} className="text-amber-600" />
                  <div>
                    <h3 className="font-bold text-sm text-[#111214]">e-Book Section &amp; Chapter Uploads</h3>
                    <p className="text-[11px] text-slate-600">Upload your cover, front matter, contents, and chapter files to build the complete e-book.</p>
                  </div>
                </div>

                {/* 1. COVER PAGE */}
                <div className="p-3.5 rounded-xl admin-glass-panel border border-white/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="epub-cover-file" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      1. Cover Page File {editingId && !form.coverUrl && <span className="text-[11px] font-normal normal-case text-slate-500">(Optional)</span>}
                    </label>
                    {editingId && form.coverUrl && (
                      <button type="button" onClick={() => setForm({ ...form, coverUrl: null, coverImage: null })} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">
                        Remove Cover
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Upload the front cover artwork or cover page document.</p>
                  {editingId && form.coverUrl ? (
                    <div className="text-xs px-3.5 py-3 bg-emerald-100/75 text-emerald-900 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-700" /> Current Cover Page Saved</span>
                      <span className="text-[11px] text-emerald-800/80">Remove first to replace</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 hover:border-[#111214] p-3 transition-colors">
                      <input
                        id="epub-cover-file"
                        type="file"
                        accept="image/*,application/pdf"
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer"
                        onChange={(e) => setForm({ ...form, coverImage: e.target.files[0] })}
                      />
                    </div>
                  )}
                </div>

                {/* 2. FIRST PAGE / FRONT MATTER */}
                <div className="p-3.5 rounded-xl admin-glass-panel border border-white/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="epub-first-page-file" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      2. First Page (Title / Front Matter)
                    </label>
                    {editingId && form.firstPageUrl && (
                      <button type="button" onClick={() => setForm({ ...form, firstPageUrl: null, firstPageFile: null })} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">
                        Remove File
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Upload the opening title page, imprint, preface, or front matter file.</p>
                  {editingId && form.firstPageUrl ? (
                    <div className="text-xs px-3.5 py-3 bg-emerald-100/75 text-emerald-900 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-700" /> Current First Page Saved</span>
                      <span className="text-[11px] text-emerald-800/80">Remove first to replace</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 hover:border-[#111214] p-3 transition-colors">
                      <input
                        id="epub-first-page-file"
                        type="file"
                        accept=".pdf,.epub,.docx,.html,image/*"
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer"
                        onChange={(e) => setForm({ ...form, firstPageFile: e.target.files[0] })}
                      />
                    </div>
                  )}
                </div>

                {/* 3. CONTENTS PAGES */}
                <div className="p-3.5 rounded-xl admin-glass-panel border border-white/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="epub-contents-file" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      3. Contents Pages (Table of Contents / Index)
                    </label>
                    {editingId && form.contentsPageUrl && (
                      <button type="button" onClick={() => setForm({ ...form, contentsPageUrl: null, contentsPageFile: null })} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">
                        Remove File
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Upload the table of contents or index overview pages.</p>
                  {editingId && form.contentsPageUrl ? (
                    <div className="text-xs px-3.5 py-3 bg-emerald-100/75 text-emerald-900 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-700" /> Current Contents Page Saved</span>
                      <span className="text-[11px] text-emerald-800/80">Remove first to replace</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 hover:border-[#111214] p-3 transition-colors">
                      <input
                        id="epub-contents-file"
                        type="file"
                        accept=".pdf,.epub,.docx,.html,image/*"
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer"
                        onChange={(e) => setForm({ ...form, contentsPageFile: e.target.files[0] })}
                      />
                    </div>
                  )}
                </div>

                {/* 4. CHAPTERS CONFIGURATION & DYNAMIC CONTAINERS */}
                <div className="p-4 rounded-xl admin-glass-panel border border-white/80 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Layers size={15} className="text-amber-600" />
                        <span>4. Book Chapters Structure</span>
                      </label>
                      <p className="text-xs text-slate-600 mt-0.5">Specify chapter count below to automatically generate upload containers for each chapter.</p>
                    </div>

                    {/* PROMPT BOX: HOW MANY CHAPTERS DOES THE BOOK HAVE */}
                    <div className="flex items-center gap-2 bg-white/85 p-2 rounded-xl border border-black/10 shadow-xs">
                      <span className="text-xs font-bold text-slate-800 whitespace-nowrap">How many chapters?</span>
                      <button
                        type="button"
                        onClick={() => handleChapterCountChange((form.chapters?.length || 1) - 1)}
                        disabled={(form.chapters?.length || 1) <= 1}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={form.chapters?.length || form.chapterCount || 1}
                        onChange={(e) => handleChapterCountChange(e.target.value)}
                        className="w-12 text-center text-xs font-bold py-1 px-1 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleChapterCountChange((form.chapters?.length || 1) + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* DYNAMIC CHAPTER CONTAINERS */}
                  <div className="mt-4 space-y-3">
                    {form.chapters?.map((chap, idx) => (
                      <div key={chap.id || `chap-${idx}`} className="p-3.5 rounded-xl bg-white/60 border border-white/90 shadow-2xs hover:bg-white/80 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-[#111214] text-[#F5F23B]">
                            Chapter {chap.number || idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {chap.url && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                                ✓ Saved
                              </span>
                            )}
                            {form.chapters.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveChapter(idx)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                          <div>
                            <label htmlFor={`chap-title-${idx}`} className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Chapter Title (optional)
                            </label>
                            <input
                              id={`chap-title-${idx}`}
                              type="text"
                              placeholder={`Chapter ${chap.number || idx + 1} Title (e.g. Introduction)`}
                              value={chap.title || ""}
                              onChange={(e) => handleChapterTitleChange(idx, e.target.value)}
                              className="glass-field-control text-xs !min-h-[38px] !py-1.5"
                            />
                          </div>
                          <div>
                            <label htmlFor={`chap-file-${idx}`} className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Chapter File (.pdf, .epub, document)
                            </label>
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 hover:border-[#111214] p-1.5 transition-colors">
                              <input
                                id={`chap-file-${idx}`}
                                type="file"
                                accept=".pdf,.epub,.docx,.html,image/*"
                                className="w-full text-xs text-slate-700 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:bg-[#111214] file:text-[#F5F23B] hover:file:opacity-90 cursor-pointer"
                                onChange={(e) => handleChapterFileChange(idx, e.target.files[0])}
                              />
                            </div>
                          </div>
                        </div>
                        {chap.fileName && (
                          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Selected file: <strong>{chap.fileName}</strong></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/10 flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-medium">
                      Total: <strong>{form.chapters?.length || 0}</strong> chapter containers configured
                    </span>
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#111214] text-[#F5F23B] hover:bg-black transition-all cursor-pointer shadow-xs"
                    >
                      <Plus size={13} strokeWidth={2.4} /> Add Another Chapter
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs mb-4 text-slate-600">
              Files uploaded here are stored securely in the database and catalog storage to form the complete publication.
            </p>
            <Button type="submit" className="w-full"><UploadCloud size={16} strokeWidth={1.8} /> {editingId ? "Save changes & update catalog" : "Publish book to catalog"}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
