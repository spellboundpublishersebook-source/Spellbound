const fs = require('fs');

let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// 1. Imports and state
content = content.replace(
  /const \[selectedGenres, setSelectedGenres\] = useState\(\[\]\);/,
  `const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState(false); // true if eBook selected
`
);

// 2. Counts and lists
content = content.replace(
  /const genreCounts = useMemo[\s\S]*?const allPubTypes.*?;/g,
  `const genreCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach(b => {
      if (b.genre) counts[b.genre] = (counts[b.genre] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);
  const authorCounts = useMemo(() => {
    const counts = {};
    myBooksRaw.forEach(b => {
      if (b.author) counts[b.author] = (counts[b.author] || 0) + 1;
    });
    return counts;
  }, [myBooksRaw]);
  
  const allGenres = Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort();
  const allAuthorsList = Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort();`
);

// 3. Filter logic
content = content.replace(
  /const matchesG = selectedGenres\.length === 0 \|\| selectedGenres\.includes\(b\.genre\);\n                  return matchesG;/,
  `const matchesG = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      const matchesA = selectedAuthors.length === 0 || selectedAuthors.includes(b.author);
      // Assuming all are eBooks for now, so typeFilter doesn't strict filter unless we want it to
      return matchesG && matchesA;`
);

// 4. Icon imports (adding X for modal closing)
content = content.replace(
  /import \{ Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft \} from "lucide-react";/,
  `import { Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft, X } from "lucide-react";`
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Patched dashboard state');
