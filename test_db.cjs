const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cctdfzdcnunkiriwqnyn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRmemRjbnVua2lyaXdxbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDIwMDIsImV4cCI6MjEwNTgxODAwMn0.7EB085g6QXPi7kDnChjITAq_DJQAuSQDqNG0ISE78PU');

async function test() {
  const { data, error } = await supabase.from('settings').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
test();
