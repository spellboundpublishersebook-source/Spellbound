const fs = require('fs');

let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

content = content.replace(
  '<h2 className="text-2xl font-bold" style={fontDisplay}>Why Choose SpellBound ( Publishers and Distributors )?</h2>',
  '<h2 className="text-2xl font-bold" style={fontDisplay}>Why Choose <span className="font-black uppercase" style={fontBody}>SpellBound</span> <span className="italic">Publishers & Distributors</span>?</h2>'
);

content = content.replace(
  '<p className="font-semibold text-gray-300">SpellBound ( Publishers and Distributors )</p>',
  `<p>
                  <span className="font-black text-gray-200 uppercase" style={fontBody}>SpellBound</span>
                  <br />
                  <span className="text-gray-400 italic" style={fontDisplay}>Publishers & Distributors</span>
                </p>`
);

content = content.replace(
  '<p>© {new Date().getFullYear()} SpellBound ( Publishers and Distributors ). All Rights Reserved.</p>',
  '<p>© {new Date().getFullYear()} <strong className="uppercase" style={fontBody}>SpellBound</strong> <i style={fontDisplay}>Publishers & Distributors</i>. All Rights Reserved.</p>'
);

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log('Patched catalog page');
