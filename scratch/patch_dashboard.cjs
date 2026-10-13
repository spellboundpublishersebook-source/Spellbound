const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

content = content.replace(
  'import { Clock, AlertTriangle, Search, BookOpen, ChevronRight } from "lucide-react";',
  'import { Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";'
);

content = content.replace(
  'const expired = daysLeft < 0;',
  `const expired = daysLeft < 0;
  
  const curatedBooks = useMemo(() => {
    return [...myBooksRaw].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [myBooksRaw]);
  
  const [curatedIndex, setCuratedIndex] = useState(0);`
);

const curatedSection = `
            {/* Curated For You */}
            {curatedBooks.length > 0 && (
              <div className="bg-[#111111] rounded-2xl shadow-xl overflow-hidden mb-12 p-8 md:p-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-widest" style={fontDisplay}>
                      Curated For You
                    </h2>
                    <p className="text-gray-400 text-sm max-w-md">
                      Tailored to your reading history and preferences based on your past activity.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCuratedIndex(Math.max(0, curatedIndex - 1))}
                      disabled={curatedIndex === 0}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => setCuratedIndex(Math.min(curatedBooks.length - 1, curatedIndex + 1))}
                      disabled={curatedIndex >= curatedBooks.length - 1}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-50 hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex transition-transform duration-500 ease-out" style={{ transform: \`translateX(-\${curatedIndex * 100}%)\` }}>
                  {curatedBooks.map((b) => (
                    <div key={b.id} className="w-full flex-shrink-0 flex flex-col md:flex-row gap-8 items-center bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                      <div 
                        className="w-32 md:w-48 aspect-[2/3] rounded-lg shadow-2xl bg-cover bg-center flex-shrink-0"
                        style={{ backgroundColor: b.color || '#333', backgroundImage: b.coverUrl ? \`url(\${b.coverUrl})\` : 'none' }}
                      />
                      <div className="flex-1 text-left">
                        <span className="text-[#FDD132] text-xs font-bold uppercase tracking-wider mb-2 block">{b.genre}</span>
                        <h3 className="text-white text-2xl md:text-3xl font-bold mb-3 leading-tight" style={fontDisplay}>{b.title}</h3>
                        <p className="text-gray-400 text-sm mb-6">{b.author}</p>
                        <button 
                          onClick={() => onOpenBook(b.id)}
                          className="bg-[#FDD132] text-black font-bold px-6 py-3 rounded hover:bg-yellow-400 transition-colors"
                        >
                          Read Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
`;

content = content.replace(
  '            {/* Filters */}',
  curatedSection + '\n            {/* Filters */}'
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
