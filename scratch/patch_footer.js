const fs = require('fs');
const file = 'src/pages/CatalogPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change grid columns
content = content.replace(
  'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12',
  'grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10'
);

// 2. Remove redundant text next to logo
const redundantTextRegex = /<img src="\/logo\.png"[^>]+>\s*<span[^>]*>\s*SpellBound <br\/>[^<]*<\/span>\s*<\/span>/m;
content = content.replace(redundantTextRegex, '<img src="/logo.png" alt="SpellBound Logo" className="h-20" />');

// 3. Extract the map block
const mapBlockStart = '<div className="mb-6 rounded-lg overflow-hidden border border-gray-800 shadow-sm opacity-80 hover:opacity-100 transition-opacity relative group">';
const mapBlockEnd = '</iframe>\n              </div>';
const mapStartIndex = content.indexOf(mapBlockStart);
const mapEndIndex = content.indexOf(mapBlockEnd) + mapBlockEnd.length;

if (mapStartIndex !== -1 && mapEndIndex !== -1) {
  const mapBlock = content.substring(mapStartIndex, mapEndIndex);
  
  // Remove map from branding column
  content = content.substring(0, mapStartIndex) + content.substring(mapEndIndex);

  // Insert map before Newsletter column
  const newsletterIndex = content.indexOf('{/* Newsletter */}');
  
  const newMapColumn = `
            {/* Location Map */}
            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6 tracking-wider text-sm uppercase">Our Location</h4>
              ${mapBlock}
            </div>

            `;
            
  content = content.substring(0, newsletterIndex) + newMapColumn + content.substring(newsletterIndex);
}

fs.writeFileSync(file, content);
