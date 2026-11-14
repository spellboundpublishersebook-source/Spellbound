import React, { useState, useEffect } from "react";
import { ChevronLeft, BookOpen, Calendar, Tag, Info, Quote, Copy, Download, Sparkles, FileText } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import BookLoader from "../components/BookLoader";
import AnimatedSweepButton from "../components/AnimatedSweepButton";
import { Modal } from "../components/UI";
import BookCover from "../components/BookCover";
import { downloadCoverImage } from "../utils/downloadCover";

export default function BookDetailsPage({ book, onNavigate, session }) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [book?.id]);
  const [showCite, setShowCite] = useState(false);
  const [targetPage, setTargetPage] = useState(null);

  const isEpub = Boolean(book?.epubData || (book?.pages && typeof book.pages === 'object' && !Array.isArray(book.pages)));
  const displayDescription = (book?.description || "")
    .split("__CUSTOM_FILTERS__:")[0]
    .split("__EPUB_DATA__:")[0]
    .trim();

  const studentKey = session?.studentId;
  useEffect(() => {
    if (session?.type !== "student" || !studentKey) {
      setTargetPage(null);
      return;
    }
    try {
      const dbProg = session?.currentStudent?.customizations?.readingProgress?.[book?.id]?.page;
      if (dbProg && Number(dbProg) > 1) {
        setTargetPage(Number(dbProg));
        return;
      }
      const raw = localStorage.getItem(`reader_progress_${studentKey}_${book?.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Number(parsed.page) > 1) {
          setTargetPage(Number(parsed.page));
          return;
        }
      }
      setTargetPage(null);
    } catch (_) {
      setTargetPage(null);
    }
  }, [book?.id, session, studentKey]);
  
  if (!book) return null;

  const handleOpenReader = (pageToOpen = null) => {
    onNavigate("reading", book.id, pageToOpen || targetPage);
  };

  return (
    <div className="admin-glass-backdrop min-h-screen text-[#111214] pb-14" style={fontBody}>

      {/* Header / Breadcrumb */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/80 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-700">
          <button 
            type="button"
            onClick={() => onNavigate(session?.role === "reader" ? "reader-dashboard" : "catalog")} 
            className="hover:text-[#111214] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
          >
            <ChevronLeft size={16} /> {session?.role === "reader" ? "Back to Library" : "Back to Catalog"}
          </button>
          <span>/</span>
          <span>{book.genre}</span>
          <span>/</span>
          <span className="text-[#111214] font-bold truncate">{book.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="admin-glass-shell rounded-[28px] p-6 sm:p-10 flex flex-col md:flex-row gap-10">
          
          {/* Left Column - Cover */}
          <div className="md:w-1/3 flex flex-col items-center">
            <BookCover book={book} className="w-full max-w-sm aspect-[2/3] rounded-2xl mb-6 shadow-lg" />
            
            <div className="w-full admin-glass-panel p-5 rounded-2xl">
              {session ? (
                (session.role === "admin" || session.role === "uploader" || session.bookIds === "all" || session.bookIds?.includes(book.id)) ? (
                  session?.type === "student" && targetPage && targetPage > 1 ? (
                    <>
                      <AnimatedSweepButton 
                        onClick={() => handleOpenReader(targetPage)} 
                        variant="yellow"
                        className="w-full font-bold py-3 rounded-full mb-2 text-sm shadow-sm"
                      >
                        <BookOpen size={18} /> Continue Reading (Page {targetPage})
                      </AnimatedSweepButton>
                      <button
                        type="button"
                        onClick={() => handleOpenReader(1)}
                        className="w-full text-center text-xs font-semibold text-slate-600 hover:text-[#111214] hover:underline py-1 transition-colors cursor-pointer"
                      >
                        Restart from beginning (Page 1)
                      </button>
                    </>
                  ) : (
                    <AnimatedSweepButton 
                      onClick={() => handleOpenReader(1)} 
                      variant="yellow"
                      className="w-full font-bold py-3 rounded-full mb-1 text-sm shadow-sm"
                    >
                      <BookOpen size={18} /> {isEpub ? "Read e-Book" : (book.pdfUrl ? "View PDF" : "Read Book")}
                    </AnimatedSweepButton>
                  )
                ) : (
                  <div className="w-full bg-white/70 text-[#111214] font-bold py-3 rounded-full text-center border border-white text-sm">
                    Not available for your institution
                  </div>
                )
              ) : (
                <>
                  <AnimatedSweepButton 
                    onClick={() => onNavigate("login-reader")} 
                    variant="yellow"
                    className="w-full font-bold py-3 rounded-full mb-3 text-sm shadow-sm"
                  >
                    Access via Institution
                  </AnimatedSweepButton>
                  <AnimatedSweepButton 
                    onClick={() => onNavigate("trial")} 
                    variant="black"
                    className="w-full font-bold py-3 rounded-full text-sm shadow-sm"
                  >
                    Request Free Trial
                  </AnimatedSweepButton>
                </>
              )}

              {/* Admin-only Cover Page Download Button */}
              {session?.role === "admin" && (book.coverUrl || book.cover) && (
                <button
                  type="button"
                  onClick={() => downloadCoverImage(book.coverUrl || book.cover, book.title)}
                  className="w-full mt-3.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  title="Download cover page image from database (Admin Only)"
                >
                  <Download size={14} /> Download Cover Page (Admin)
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:w-2/3">
            {/* Format & Genre Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-[#111214] text-[#F5F23B] text-[11px] font-extrabold uppercase tracking-wider">
                {book.genre || "General"}
              </span>
              {isEpub ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30 shadow-xs">
                  <Sparkles size={13} className="text-amber-600" /> e-Book (EPUB)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-900 border border-blue-400/30 shadow-xs">
                  <FileText size={13} className="text-blue-600" /> Standard PDF
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-2 text-[#111214]" style={fontDisplay}>{book.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <h2 className="text-xl text-slate-700 font-semibold">by {book.author}</h2>
              <button type="button" onClick={() => setShowCite(true)} className="admin-glass-pill flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full text-[#111214] hover:bg-[#111214] hover:text-[#F5F23B] transition-colors cursor-pointer">
                <Quote size={14} /> Cite this book
              </button>
            </div>
            
            <div className="prose max-w-none text-slate-800 leading-relaxed mb-8">
              <h3 className="text-base font-bold text-[#111214] mb-3 border-b border-black/10 pb-2">Description</h3>
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                {displayDescription || 
                 "No description provided for this title. This book is part of the SpellBound ( Publishers and Distributors ) catalog and offers an in-depth exploration of its subject matter, meticulously crafted by the author."}
              </p>
            </div>

            {/* Book Metadata Grid */}
            <h3 className="text-base font-bold text-[#111214] mb-4 border-b border-black/10 pb-2">Book Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <BookOpen className="text-[#111214] mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">Publisher</div>
                  <div className="font-semibold text-[#111214]">{book.publisher || "Not specified"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <Tag className="text-[#111214] mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">Genre</div>
                  <div className="font-semibold text-[#111214]">{book.genre}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <Calendar className="text-[#111214] mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">First Published</div>
                  <div className="font-semibold text-[#111214]">{book.firstPublish || "N/A"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <Info className="text-[#111214] mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">Volume / Pages</div>
                  <div className="font-semibold text-[#111214]">{isEpub ? (book.totalPages ? `${book.totalPages} pages (${book.epubData?.chapters?.length || 0} Chapters)` : `${book.epubData?.chapters?.length || 0} Chapters`) : (book.totalPages || (book.pages ? book.pages.length : "N/A") + " pages")}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <FileText className="text-[#111214] mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">Document Format</div>
                  <div className="font-semibold text-[#111214] flex items-center gap-1.5 mt-0.5">
                    {isEpub ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900">
                        <Sparkles size={12} className="text-amber-600" /> Multi-Section e-Book (EPUB)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900">
                        <FileText size={12} className="text-blue-600" /> Standard PDF Document
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <div className="text-[#111214] mt-0.5 font-bold text-xs px-1.5 py-0.5 rounded bg-[#F5F23B]">eISBN</div>
                <div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold">Online ISBN</div>
                  <div className="font-semibold text-[#111214]">{book.onlineIsbn || "N/A"}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showCite && (
        <Modal title="Cite this book" onClose={() => setShowCite(false)}>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-xs mb-2 text-slate-600 uppercase tracking-wider">APA</h4>
              <div className="p-3.5 bg-white/75 border border-white/90 rounded-2xl text-sm flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author.split(' ')[0][0]}. ({book.firstPublish?.slice(0, 4) || new Date().getFullYear()}). <i>{book.title}</i>. {book.publisher}.</span>
                <button type="button" aria-label="Copy APA citation" onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author.split(' ')[0][0]}. (${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}). ${book.title}. ${book.publisher}.`)} className="p-1.5 rounded-full hover:bg-slate-200 text-[#111214] shrink-0 cursor-pointer"><Copy size={15} /></button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs mb-2 text-slate-600 uppercase tracking-wider">MLA</h4>
              <div className="p-3.5 bg-white/75 border border-white/90 rounded-2xl text-sm flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author}. <i>{book.title}</i>. {book.publisher}, {book.firstPublish?.slice(0, 4) || new Date().getFullYear()}.</span>
                <button type="button" aria-label="Copy MLA citation" onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author}. ${book.title}. ${book.publisher}, ${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}.`)} className="p-1.5 rounded-full hover:bg-slate-200 text-[#111214] shrink-0 cursor-pointer"><Copy size={15} /></button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs mb-2 text-slate-600 uppercase tracking-wider">Chicago</h4>
              <div className="p-3.5 bg-white/75 border border-white/90 rounded-2xl text-sm flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author}. {book.firstPublish?.slice(0, 4) || new Date().getFullYear()}. <i>{book.title}</i>. {book.publisher}.</span>
                <button type="button" aria-label="Copy Chicago citation" onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author}. ${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}. ${book.title}. ${book.publisher}.`)} className="p-1.5 rounded-full hover:bg-slate-200 text-[#111214] shrink-0 cursor-pointer"><Copy size={15} /></button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
