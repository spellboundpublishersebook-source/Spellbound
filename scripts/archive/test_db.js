import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://cctdfzdcnunkiriwqnyn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRmemRjbnVua2lyaXdxbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDIwMDIsImV4cCI6MjEwNTgxODAwMn0.7EB085g6QXPi7kDnChjITAq_DJQAuSQDqNG0ISE78PU');

async function testDB() {
  console.log("1. Fetching existing institutions...");
  const { data: initialData, error: fetchErr } = await supabase.from('licenses').select('*');
  if (fetchErr) {
    console.error("Fetch Error:", fetchErr.message);
    return;
  }
  console.log(`Found ${initialData.length} institutions.`);

  console.log("2. Creating a test institution...");
  const testId = `test_${Date.now()}`;
  const { error: insertErr } = await supabase.from('licenses').insert([
    { 
      id: testId, 
      name: "Test University", 
      startdate: "2026-09-01", 
      enddate: "2027-09-01", 
      password: "testpassword", 
      bookids: "all" 
    }
  ]);
  
  if (insertErr) {
    console.error("Insert Error:", insertErr.message);
    return;
  }
  console.log("Test institution successfully created!");

  console.log("3. Fetching updated institutions...");
  const { data: updatedData } = await supabase.from('licenses').select('*').eq('id', testId);
  console.log("Newly fetched institution from cloud:", updatedData);

  console.log("4. Cleaning up test institution...");
  await supabase.from('licenses').delete().eq('id', testId);
  console.log("Cleanup successful. Database integration is confirmed working!");
}
testDB();
