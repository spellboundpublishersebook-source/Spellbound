import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cctdfzdcnunkiriwqnyn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRmemRjbnVua2lyaXdxbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDIwMDIsImV4cCI6MjEwNTgxODAwMn0.7EB085g6QXPi7kDnChjITAq_DJQAuSQDqNG0ISE78PU'

export const supabase = createClient(supabaseUrl, supabaseKey)
