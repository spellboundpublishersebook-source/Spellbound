import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hmhbbwldajchdxjeidni.supabase.co'
const supabaseKey = 'sb_publishable_GFEY681c9Hx_MCG0vmw6CA_Mm2fPxhg'

export const supabase = createClient(supabaseUrl, supabaseKey)
