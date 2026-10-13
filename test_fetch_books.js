import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://cctdfzdcnunkiriwqnyn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRmemRjbnVua2lyaXdxbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDIwMDIsImV4cCI6MjEwNTgxODAwMn0.7EB085g6QXPi7kDnChjITAq_DJQAuSQDqNG0ISE78PU');

async function testDB() {
  const { data, error } = await supabase.from('books').select('id, title, coverurl');
  if (error) {
    console.error("Fetch Error:", error.message);
    return;
  }
  console.log("Books:", data);
}
testDB();
