import React, { useState, useEffect } from "react";
import { ChevronLeft, BookOpen, Calendar, ShieldCheck, Tag, Info, Quote, Copy } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import BookLoader from "../components/BookLoader";
import AnimatedSweepButton from "../components/AnimatedSweepButton";
import { Modal } from "../components/UI";
import BookCover from "../components/BookCover";

export default function BookDetailsPage({ book, onNavigate, session }) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [book?.id]);
  const [showCite, setShowCite] = useState(false);
  const [openingReader, setOpeningReader] = useState(false);
  
  if (!book) return null;

  const handleOpenReader = () => {
    setOpeningReader(true);
    setTimeout(() => {
      onNavigate("reading", book.id);
    }, 650);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-[#131313]" style={fontBody}>
      {/* Fullscreen Book Loading Animation when opening reader */}
      {openingReader && (
        <BookLoader 
          fullScreen 
          dark 
          book={book} 
          message="Opening Secure Reader..." 
          subMessage="Decrypting and preparing digital edition..." 
        />
      )}

      {/* Header / Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-black">
          <button 
            onClick={() => onNavigate(session?.role === "reader" ? "reader-dashboard" : "catalog")} 
            className="hover:text-black transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <ChevronLeft size={16} /> {session?.role === "reader" ? "Back to Library" : "Back to Catalog"}
          </button>
          <span>/</span>
          <span>{book.genre}</span>
          <span>/</span>
          <span className="text-black font-semibold truncate">{book.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Left Column - Cover */}
          <div className="md:w-1/3 flex flex-col items-center">
            <BookCover book={book} className="w-full max-w-sm aspect-[2/3] rounded-lg mb-8" />
            
            <div className="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              {session ? (
                (session.role === "admin" || session.role === "uploader" || session.bookIds === "all" || session.bookIds?.includes(book.id)) ? (
                  <AnimatedSweepButton 
                    onClick={handleOpenReader} 
                    variant="yellow"
                    className="w-full font-bold py-3 rounded-md mb-3 text-sm shadow-sm"
                  >
                    <BookOpen size={18} /> {book.pdfUrl ? "View PDF" : "Read Book"}
                  </AnimatedSweepButton>
                ) : (
                  <div className="w-full bg-gray-100 text-black font-bold py-3 rounded-md text-center mb-3 border border-gray-200 text-sm">
                    Not available for your institution
                  </div>
                )
              ) : (
                <>
                  <AnimatedSweepButton 
                    onClick={() => onNavigate("login-reader")} 
                    variant="yellow"
                    className="w-full font-bold py-3 rounded-md mb-3 text-sm shadow-sm"
                  >
                    Access via Institution
                  </AnimatedSweepButton>
                  <AnimatedSweepButton 
                    onClick={() => onNavigate("trial")} 
                    variant="black"
                    className="w-full font-bold py-3 rounded-md text-sm shadow-sm"
                  >
                    Request Free Trial
                  </AnimatedSweepButton>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-bold mb-2" style={fontDisplay}>{book.title}</h1>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl text-black font-semibold">by {book.author}</h2>
              <button onClick={() => setShowCite(true)} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors text-black">
                <Quote size={14} /> Cite this book
              </button>
            </div>
            
            <div className="prose max-w-none text-black leading-relaxed mb-10">
              <h3 className="text-lg font-bold text-black mb-3 border-b border-gray-200 pb-2">Description</h3>
              <p>
                {book.description || 
                 "No description provided for this title. This book is part of the SpellBound ( Publishers and Distributors ) catalog and offers an in-depth exploration of its subject matter, meticulously crafted by the author."}
              </p>
            </div>

            {/* Book Metadata Grid */}
            <h3 className="text-lg font-bold text-black mb-4 border-b border-gray-200 pb-2">Book Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              
              <div className="flex items-start gap-3">
                <BookOpen className="text-black mt-1" size={20} />
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">Publisher</div>
                  <div className="font-semibold text-black">{book.publisher || "Not specified"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Tag className="text-black mt-1" size={20} />
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">Genre</div>
                  <div className="font-semibold text-black">{book.genre}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="text-black mt-1" size={20} />
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">First Published</div>
                  <div className="font-semibold text-black">{book.firstPublish || "N/A"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-black mt-1" size={20} />
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">Copyright</div>
                  <div className="font-semibold text-black">{book.copyright || "N/A"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Info className="text-black mt-1" size={20} />
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">Pages</div>
                  <div className="font-semibold text-black">{book.totalPages || (book.pages ? book.pages.length : "N/A")}</div>
                </div>
              </div>
              

              <div className="flex items-start gap-3">
                <div className="text-black mt-1 font-bold text-sm">eISBN</div>
                <div>
                  <div className="text-xs text-black uppercase tracking-wider font-bold">Online ISBN</div>
                  <div className="font-semibold text-black">{book.onlineIsbn || "N/A"}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showCite && (
        <Modal title="Cite this book" onClose={() => setShowCite(false)}>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-sm mb-2 text-black uppercase tracking-wider">APA</h4>
              <div className="p-3 bg-gray-50 border rounded text-sm relative group flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author.split(' ')[0][0]}. ({book.firstPublish?.slice(0, 4) || new Date().getFullYear()}). <i>{book.title}</i>. {book.publisher}.</span>
                <button onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author.split(' ')[0][0]}. (${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}). ${book.title}. ${book.publisher}.`)} className="text-black hover:text-black shrink-0"><Copy size={16} /></button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2 text-black uppercase tracking-wider">MLA</h4>
              <div className="p-3 bg-gray-50 border rounded text-sm relative group flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author}. <i>{book.title}</i>. {book.publisher}, {book.firstPublish?.slice(0, 4) || new Date().getFullYear()}.</span>
                <button onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author}. ${book.title}. ${book.publisher}, ${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}.`)} className="text-black hover:text-black shrink-0"><Copy size={16} /></button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2 text-black uppercase tracking-wider">Chicago</h4>
              <div className="p-3 bg-gray-50 border rounded text-sm relative group flex justify-between items-start gap-4">
                <span>{book.author.split(' ').pop()}, {book.author}. {book.firstPublish?.slice(0, 4) || new Date().getFullYear()}. <i>{book.title}</i>. {book.publisher}.</span>
                <button onClick={() => navigator.clipboard.writeText(`${book.author.split(' ').pop()}, ${book.author}. ${book.firstPublish?.slice(0, 4) || new Date().getFullYear()}. ${book.title}. ${book.publisher}.`)} className="text-black hover:text-black shrink-0"><Copy size={16} /></button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
