const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

if (!content.includes('@media print')) {
  content = content.replace(
    '</head>',
    '  <style>@media print { body { display: none !important; } }</style>\n  </head>'
  );
  fs.writeFileSync('index.html', content);
  console.log('Fixed index.html');
}
