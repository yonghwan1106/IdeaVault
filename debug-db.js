const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wydhzaicymzxjesvaorw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGh6YWljeW16eGplc3Zhb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3MTQ2NCwiZXhwIjoyMDY3MzQ3NDY0fQ.mTF8s5L0W7ZeFYPzbyC1qtBy_sC_qRFvaP1dCoqvpGQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('=== Checking database tables ===')
  
  // Check if ideas table exists and has data
  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('count(*)')
    .single()
  
  console.log('Ideas count:', ideas, ideasError)
  
  // Check if users table exists and has data
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('count(*)')
    .single()
  
  console.log('Users count:', users, usersError)
}

async function addTestData() {
  console.log('=== Adding test data ===')
  
  // Add test user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      full_name: '테스트 판매자',
      user_type: 'seller',
      verified: true
    })
    .select()
  
  console.log('User created:', user, userError)
  
  // Add test idea
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .insert({
      seller_id: '11111111-1111-1111-1111-111111111111',
      title: 'AI 기반 학습 도우미',
      description: '개인 맞춤형 학습 계획을 제공하는 AI 기반 학습 도우미 플랫폼입니다.',
      category: 'education',
      package_type: 'mvp',
      price: 350000,
      implementation_difficulty: 3,
      tech_stack: ['React', 'Node.js', 'OpenAI'],
      status: 'active',
      validation_status: 'approved'
    })
    .select()
  
  console.log('Idea created:', idea, ideaError)
}

async function testQuery() {
  console.log('=== Testing basic query ===')
  
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('status', 'active')
  
  console.log('Ideas query result:', data, error)
}

async function main() {
  await checkTables()
  await addTestData()
  await testQuery()
}

main().catch(console.error)