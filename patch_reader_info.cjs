const fs = require('fs');
let content = fs.readFileSync('src/pages/ReaderDashboard.jsx', 'utf8');

// Add icons to lucide-react import
content = content.replace(
  /import \{ Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft, X \} from "lucide-react";/,
  'import { Clock, AlertTriangle, Search, BookOpen, ChevronRight, ChevronLeft, X, User, Mail, Building2 } from "lucide-react";'
);

// Add the info bar
const infoBar = `
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 mt-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 py-3 px-4 rounded-lg inline-flex">
                <span className="flex items-center gap-1.5"><User size={16} className="text-gray-400" /> <span className="font-semibold text-gray-800">ID:</span> {session.id}</span>
                {session.email && (
                  <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400" /> <span className="font-semibold text-gray-800">Email:</span> {session.email}</span>
                )}
                {session.institution && session.institution !== session.name && (
                  <span className="flex items-center gap-1.5"><Building2 size={16} className="text-gray-400" /> <span className="font-semibold text-gray-800">Institution:</span> {session.institution}</span>
                )}
              </div>
`;

content = content.replace(
  /<\/h1>\n\s*<p className="text-gray-500 text-sm md:text-base max-w-2xl">/,
  `</h1>\n${infoBar}\n              <p className="text-gray-500 text-sm md:text-base max-w-2xl">`
);

fs.writeFileSync('src/pages/ReaderDashboard.jsx', content);
console.log('Patched reader info bar');
