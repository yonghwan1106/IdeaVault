const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wydhzaicymzxjesvaorw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGh6YWljeW16eGplc3Zhb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3MTQ2NCwiZXhwIjoyMDY3MzQ3NDY0fQ.mTF8s5L0W7ZeFYPzbyC1qtBy_sC_qRFvaP1dCoqvpGQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function simpleTest() {
  console.log('=== Testing connection ===')
  
  try {
    // Try to query auth.users (default Supabase table)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    console.log('Auth users:', authUsers?.users?.length, authError)
  } catch (e) {
    console.log('Auth error:', e.message)
  }
  
  // Try different table variations
  const tables = ['ideas', 'users', 'profiles']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      console.log(`Table ${table}:`, data ? 'EXISTS' : 'ERROR', error?.message)
    } catch (e) {
      console.log(`Table ${table}: CATCH ERROR`, e.message)
    }
  }
}

simpleTest().catch(console.error)