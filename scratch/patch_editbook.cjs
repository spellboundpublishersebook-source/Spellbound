const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /const \{ error, data \} = await supabase\.from\('books'\)\.update\(dbBook\)\.eq\('id', id\)\.select\(\);/g,
  `const { error, data } = await supabase.from('books').update(dbBook).eq('id', id).select();
      if (!error && (!data || data.length === 0)) {
        alert("Database update succeeded but returned no rows. Make sure the book ID exists in the database.");
      }`
);

fs.writeFileSync('src/App.jsx', content);
