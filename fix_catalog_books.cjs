const fs = require('fs');
let content = fs.readFileSync('src/pages/CatalogPage.jsx', 'utf8');

// Revert the side books to full size and clear opacity to remove the white film but prevent "zoomed out" look
content = content.replace(
  /scale-90 z-10/g,
  'scale-100 z-10'
);

// If they meant the actual BookCover component was zoomed out, let's also change bg-cover to bg-[length:100%_100%] just in case to prevent cropping!
// "ALL THE BOOK COVERS SHOWS LIKE ZOOMED OUT" -> often means cropping (zoomed in). Let's stretch to fit instead of crop.
content = content.replace(
  /bg-cover bg-center/g,
  'bg-[length:100%_100%] bg-center bg-no-repeat'
);

fs.writeFileSync('src/pages/CatalogPage.jsx', content);
console.log('Fixed CatalogPage');
