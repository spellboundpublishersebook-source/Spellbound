const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

const targetStr = `113, Vivekananda Rd, Manicktala, Azad Hind Bag<br />
                  Kolkata, West Bengal 700006<br />
                  <br />
                  Phone: 6289998227<br />
                  Email: spellboudpd@gmail.com<br />
                  Web: www.spellboudpd.in`;

const newStr = `<p>
                  113, Vivekananda Rd, Manicktala,<br />
                  Azad Hind Bag, Kolkata,<br />
                  West Bengal 700006
                </p>
                <p>
                  Phone: 6289998227<br />
                  Email: spellboudpd@gmail.com<br />
                  Web: www.spellboudpd.in
                </p>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync('src/pages/CatalogPage.jsx', content);
  console.log('Fixed CatalogPage footer gap');
} else {
  console.log('Target string not found!');
}
