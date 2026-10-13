const fs = require('fs');

let content = fs.readFileSync('src/components/Header.jsx', 'utf8');

// Add User to imports
content = content.replace(
  /import \{ LogOut, Menu, X, Home, LayoutDashboard, FlaskConical, ShieldCheck \} from "lucide-react";/,
  'import { LogOut, Menu, X, Home, LayoutDashboard, FlaskConical, ShieldCheck, User } from "lucide-react";'
);

// Replace the session block in NavLinks
const sessionBlockRegex = /\{\s*session && \([\s\S]*?borderLeft: "1px solid #374151"[\s\S]*?Log out\n\s*<\/button>\n\s*<\/>\n\s*\)\}/;

const replacement = `{session && (
        <>
          <button
            style={btn(["reader-dashboard","admin","uploader"].includes(view))}
            onClick={() => onNavigate(session.role === "reader" ? "reader-dashboard" : session.role)}
            onMouseEnter={e => { e.target.style.color = "#111111"; }}
            onMouseLeave={e => { e.target.style.color = ["reader-dashboard","admin","uploader"].includes(view) ? "#111111" : "#6B7280"; }}
          >
            Dashboard
          </button>
          
          <div className="relative group ml-2 flex items-center">
            {/* The hit area is extended slightly downward so hovering to the menu doesn't lose hover state */}
            <div className="pb-4 absolute inset-0 -bottom-4 z-10" />
            
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-black transition-colors border border-gray-200 relative z-20">
              <User size={18} />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute top-[100%] right-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900 truncate">{session.name}</p>
                <p className="text-xs text-gray-500 capitalize">{session.role} Account</p>
              </div>
              <div className="py-1 border-b border-gray-100">
                <button 
                  onClick={() => onNavigate(session.role === "reader" ? "reader-dashboard" : session.role)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>
              </div>
              <div className="py-1">
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </div>
        </>
      )}`;

content = content.replace(sessionBlockRegex, replacement);

fs.writeFileSync('src/components/Header.jsx', content);
console.log('Patched profile dropdown');
