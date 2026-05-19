import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kehnwgwekdloitvemphi.supabase.co'
const supabaseKey = 'sb_publishable_Tr1D1F38rsh55pUud8hdpQ_9zos7t6M'

export const supabase = createClient(supabaseUrl, supabaseKey)