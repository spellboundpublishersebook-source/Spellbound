const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('src/supabaseClient.js', 'utf8');
const urlMatch = content.match(/createClient\(['"](.*?)['"], ['"](.*?)['"]/);
if (urlMatch) {
  const supabase = createClient(urlMatch[1], urlMatch[2]);
  supabase.from('books').select('id, title, price').limit(5).then(res => console.log("RES:", res));
}
