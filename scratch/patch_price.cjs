const fs = require('fs');
let content = fs.readFileSync('src/pages/UploaderPanel.jsx', 'utf8');

content = content.replace(
  /price: Number\(form\.price\) \|\| 0,/g,
  'price: isNaN(Number(form.price)) ? 0 : Number(form.price),'
);

fs.writeFileSync('src/pages/UploaderPanel.jsx', content);
