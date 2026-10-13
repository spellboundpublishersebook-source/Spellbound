import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cctdfzdcnunkiriwqnyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRmemRjbnVua2lyaXdxbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDIwMDIsImV4cCI6MjEwNTgxODAwMn0.7EB085g6QXPi7kDnChjITAq_DJQAuSQDqNG0ISE78PU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
  if (data && data.pages) {
    const pages = data.pages;
    if (pages["contact-us"]) {
      pages["contact-us"].content = "Reach out to us using the following details:\n\nAddress: 113, Vivekananda Rd, Manicktala, Azad Hind Bag, Kolkata, West Bengal 700006\nPhone: 6289998227\nEmail: spellboudpd@gmail.com\nWebsite: www.spellboudpd.in";
      await supabase.from('settings').upsert({ id: 'global', pages: pages });
      console.log("Fixed contact-us in Supabase DB!");
    } else {
      console.log("Contact-us not found in DB pages.");
    }
  } else {
    console.log("No settings data in DB");
  }
}

fix();
