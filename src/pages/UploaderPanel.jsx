import React, { useState, useEffect } from "react";
import { Plus, Trash2, UploadCloud, BookOpen, Edit2 } from "lucide-react";
import { palette, fontDisplay, getGenres, getPubTypes, getCustomHeadings } from "../theme";
import Button from "../components/Button";
import { Field, Select, TextArea, Modal } from "../components/UI";

const spineChoices = ["#8C3B3F", "#A97F45", "#2C4A3C", "#5A3B2E", "#41332A", "#6E2A34", "#1F3A30", "#9C7A44"];

export default function UploaderPanel({ books, onAddBook, onEditBook, onDeleteBook, embedded, dbStatus, onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [pubTypes, setPubTypes] = useState([]);
  const [customHeadings, setCustomHeadings] = useState([]);
  
  useEffect(() => {
    if (showForm) {
      setGenres(getGenres());
      setPubTypes(getPubTypes());
      setCustomHeadings(getCustomHeadings());
    }
  }, [showForm]);

  const defaultForm = {
    title: "", author: "", genre: "", pubType: "", publisher: "", price: "", color: spineChoices[0],
    firstPublish: "", copyright: "", printIsbn: "", onlineIsbn: "", description: "", totalPages: "",
    pagesText: "", pdfFile: null, coverImage: null, customFields: {}
  };
  const [form, setForm] = useState(defaultForm);

  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleEditClick(book) {
    setEditingId(book.id);
    setForm({
      title: book.title || "",
      author: book.author || "",
      genre: book.genre || "",
      pubType: book.pubType || "",
      publisher: book.publisher || "",
      price: book.price !== undefined && book.price !== null ? book.price : "",
      color: book.color || spineChoices[0],
      firstPublish: book.firstPublish || "",
      copyright: book.copyright || "",
      printIsbn: book.printIsbn || "",
      onlineIsbn: book.onlineIsbn || "",
      description: (book.description || "").split("\n\n__CUSTOM_FILTERS__:")[0],
      totalPages: book.totalPages || "",
      pagesText: book.pages ? book.pages.join("\n---\n") : "",
      pdfFile: null,
      coverImage: null,
      pdfUrl: book.pdfUrl,
      coverUrl: book.coverUrl,
      customFields: {}
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
      setForm(defaultForm);
      setEditingId(null);
    } else {
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
        setForm(defaultForm);
        setPendingUpload(null);
        setUploadProgress(0);
      }, 1500);
    }
  }

  const containerCls = embedded ? "" : "max-w-6xl mx-auto px-6 py-10";
  const wrapperStyle = embedded ? {} : { backgroundColor: palette.paper, minHeight: "calc(100vh - 64px)" };

  const dbIndicator = (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${dbStatus === 'connected' ? 'bg-green-100 text-green-700' : dbStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
      <span className="relative flex h-2 w-2">
        {dbStatus === 'connected' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
        {dbStatus === 'checking' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
      </span>
      {dbStatus === 'connected' ? 'DB Connected' : dbStatus === 'error' ? 'DB Error - Using Mock Data' : 'Checking DB...'}
    </div>
  );

  return (
    <div style={wrapperStyle}>
      <div className={containerCls}>
        {!embedded && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#111111]" style={fontDisplay}>Uploader panel</h1>
                {dbIndicator}
              </div>
              <p className="text-sm mt-1 text-black">Add new titles to the catalog with cover color, genre, and page content.</p>
            </div>
            <Button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}><Plus size={16} strokeWidth={2} /> Add book</Button>
          </div>
        )}
        {embedded && (
          <div className="flex justify-between items-center mb-5">
            {dbIndicator}
            <Button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}><Plus size={16} strokeWidth={2} /> Publish new book</Button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingUpload && (
            <div className="flex gap-4 rounded-md border p-4 relative overflow-hidden bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Progress Bar Background */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-[#FDD132] opacity-20 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
              <div 
                className="w-20 rounded-md flex-shrink-0 z-10 bg-contain bg-no-repeat bg-center shadow-sm" 
                style={{ backgroundColor: pendingUpload.color, minHeight: 110, backgroundImage: pendingUpload.coverImage ? `url(${URL.createObjectURL(pendingUpload.coverImage)})` : 'none' }} 
              />
              <div className="flex flex-col min-w-0 flex-1 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] mb-1">{pendingUpload.genre}</span>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{pendingUpload.title}</span>
                <span className="text-xs text-black mt-0.5">{pendingUpload.author} · {pendingUpload.publisher}</span>
                <span className="text-xs text-black mt-0.5">{pendingUpload.pages?.length || 0} pages · ₹{pendingUpload.price}</span>
                
                <div className="mt-auto pt-3 flex items-center gap-2 text-xs font-semibold text-black hover:text-black transition-colors">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Finished!"}
                </div>
              </div>
            </div>
          )}

          {books.map((b) => (
            <div key={b.id} className="flex gap-4 rounded-xl border border-gray-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div 
                className="w-20 rounded-md flex-shrink-0 bg-contain bg-no-repeat bg-center shadow-sm" 
                style={{ backgroundColor: b.color, minHeight: 110, backgroundImage: (b.coverUrl && b.coverUrl !== "null" && b.coverUrl !== "undefined" && b.coverUrl.trim() !== "") ? `url(${b.coverUrl})` : 'none' }} 
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017] mb-1">{b.genre}</span>
                <span className="font-bold text-sm leading-tight text-[#111111]" style={fontDisplay}>{b.title}</span>
                <span className="text-xs text-black mt-0.5">{b.author} · {b.publisher}</span>
                <span className="text-xs text-black mt-0.5">{b.pages?.length || 0} pages · ₹{b.price}</span>
                
                <div className="mt-auto pt-3 flex items-center gap-4">
                  <button
                    onClick={() => onNavigate && onNavigate("reading", b.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-black hover:text-black transition-colors"
                  >
                    <BookOpen size={13} strokeWidth={1.8} /> Preview
                  </button>
                  <button
                    onClick={() => handleEditClick(b)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#D4A017] hover:text-[#b8860b] transition-colors"
                  >
                    <Edit2 size={13} strokeWidth={1.8} /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteBook(b.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={13} strokeWidth={1.8} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit book" : "Add a new book"} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Field label="Author" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1.5 text-black">Subject / Genre</label>
                <input
                  list="genres-list"
                  className="w-full px-3.5 py-2.5 rounded border text-sm outline-none"
                  style={{ backgroundColor: palette.cream, borderColor: palette.line, color: palette.ink }}
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
                <label className="block text-sm font-semibold mb-1.5 text-black">Publication Type</label>
                <input
                  list="pubtype-list"
                  className="w-full px-3.5 py-2.5 rounded border text-sm outline-none"
                  style={{ backgroundColor: palette.cream, borderColor: palette.line, color: palette.ink }}
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
                  <label className="block text-sm font-semibold mb-1.5 text-black">{h.name}</label>
                  <input
                    list={`custom-list-${h.id}`}
                    className="w-full px-3.5 py-2.5 rounded border text-sm outline-none"
                    style={{ backgroundColor: palette.cream, borderColor: palette.line, color: palette.ink }}
                    value={form.customFields[h.name] || ""}
                    onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [h.name]: e.target.value } })}
                    placeholder={`Select or type ${h.name}...`}
                  />
                  <datalist id={`custom-list-${h.id}`}>
                    {h.options.map((o) => <option key={o} value={o} />)}
                  </datalist>
                </div>
              ))}

              <Field label="Publisher" required value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
              <Field label="First Publish (e.g. YYYY)" value={form.firstPublish} onChange={(e) => setForm({ ...form, firstPublish: e.target.value })} />
              <Field label="Copyright (e.g. © 2026)" value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} />
              <Field label="Online ISBN (eISBN)" value={form.onlineIsbn} onChange={(e) => setForm({ ...form, onlineIsbn: e.target.value })} />
              <Field label="Total Pages (Number)" type="number" min="1" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} />
              <Field label="List price (individual, ₹)" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1.5 text-black">Cover color</label>
                <div className="flex gap-2 flex-wrap">
                  {spineChoices.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full border-2"
                      style={{ backgroundColor: c, borderColor: form.color === c ? palette.ink : "transparent" }}
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

            <div className="grid sm:grid-cols-2 gap-x-4 mb-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-black">Book Cover Image {editingId && !form.coverUrl && <span className="text-xs font-normal text-black">(Optional)</span>}</label>
                  {editingId && form.coverUrl && (
                    <button type="button" onClick={() => setForm({...form, coverUrl: null, coverImage: null})} className="text-xs text-red-500 hover:underline">Remove Cover</button>
                  )}
                </div>
                {editingId && form.coverUrl ? (
                  <div className="text-sm px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded flex items-center justify-between">
                    <span>✓ Current Cover Saved</span>
                    <span className="text-xs text-black">(To change it, click Remove Cover first)</span>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="w-full text-sm" 
                    onChange={(e) => setForm({ ...form, coverImage: e.target.files[0] })}
                  />
                )}
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-black">E-book PDF File {editingId && !form.pdfUrl && <span className="text-xs font-normal text-black">(Optional)</span>}</label>
                  {editingId && form.pdfUrl && (
                    <button type="button" onClick={() => setForm({...form, pdfUrl: null, pdfFile: null})} className="text-xs text-red-500 hover:underline">Remove PDF</button>
                  )}
                </div>
                {editingId && form.pdfUrl ? (
                  <div className="text-sm px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded flex items-center justify-between">
                    <span>✓ Current PDF Saved</span>
                    <span className="text-xs text-black">(To change it, click Remove PDF first)</span>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="w-full text-sm" 
                    onChange={(e) => setForm({ ...form, pdfFile: e.target.files[0] })}
                  />
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
