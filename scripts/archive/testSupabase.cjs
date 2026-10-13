const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Extract url and key from src/supabaseClient.js
const code = fs.readFileSync('src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/supabaseUrl = '([^']+)'/);
const keyMatch = code.match(/supabaseKey = '([^']+)'/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('admins').select('*').then(({ data, error }) => {
    if (error) console.error("Error:", error);
    else console.log("Admins fetched:", data);
  });
}
