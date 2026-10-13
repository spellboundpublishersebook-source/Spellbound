const fs = require('fs');
let content = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');

content = content.replace(
  /price: book\.price \|\| "",/g,
  'price: book.price !== undefined && book.price !== null ? book.price : "",'
);

content = content.replace(
  /description: book\.description \|\| "",/g,
  'description: (book.description || "").split("\\n\\n__CUSTOM_FILTERS__:")[0],'
);

fs.writeFileSync('src/pages/UploaderPanel.jsx', content);
