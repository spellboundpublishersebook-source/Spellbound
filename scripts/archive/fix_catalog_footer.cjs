const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

const targetStr = `<p>Kolkata - 700006</p>
                <p>West Bengal, India</p>`;

const newStr = `113, Vivekananda Rd, Manicktala, Azad Hind Bag<br />
                  Kolkata, West Bengal 700006<br />
                  <br />
                  Phone: 6289998227<br />
                  Email: spellboudpd@gmail.com<br />
                  Web: www.spellboudpd.in`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log('Fixed CatalogPage.jsx');
