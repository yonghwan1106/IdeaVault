const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://wydhzaicymzxjesvaorw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGh6YWljeW16eGplc3Zhb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3MTQ2NCwiZXhwIjoyMDY3MzQ3NDY0fQ.mTF8s5L0W7ZeFYPzbyC1qtBy_sC_qRFvaP1dCoqvpGQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSchema() {
  console.log('🚀 Creating database schema...')
  
  try {
    // Read the schema file
    const schemaSQL = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}`)
      console.log(`📄 ${statement.substring(0, 100)}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        })
        
        if (error) {
          console.log(`❌ Error:`, error.message)
          // Continue with next statement
        } else {
          console.log(`✅ Success`)
        }
      } catch (e) {
        console.log(`❌ Exception:`, e.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to read schema file:', error)
  }
}

async function addTestData() {
  console.log('\n🎯 Adding test data...')
  
  // Add test user
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'seller@test.com',
        full_name: '김창업',
        user_type: 'seller',
        verified: true,
        bio: '검증된 마이크로 SaaS 아이디어를 제공합니다.'
      })
      .select()
    
    if (userError) {
      console.log('❌ User creation error:', userError.message)
    } else {
      console.log('✅ Test user created')
    }
  } catch (e) {
    console.log('❌ User creation exception:', e.message)
  }
  
  // Add test idea
  try {
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        seller_id: '11111111-1111-1111-1111-111111111111',
        title: 'AI 기반 학습 도우미 SaaS',
        description: '개인 맞춤형 학습 계획을 제공하는 AI 기반 학습 도우미 플랫폼입니다. 사용자의 학습 패턴을 분석하여 최적의 학습 방법을 제안합니다.',
        category: 'education',
        package_type: 'mvp',
        price: 350000,
        implementation_difficulty: 3,
        tech_stack: ['React', 'Node.js', 'Python', 'OpenAI API'],
        status: 'active',
        validation_status: 'approved',
        view_count: 156,
        target_audience: '대학생, 직장인, 자기계발을 원하는 성인',
        revenue_model: 'subscription'
      })
      .select()
    
    if (ideaError) {
      console.log('❌ Idea creation error:', ideaError.message)
    } else {
      console.log('✅ Test idea created')
    }
  } catch (e) {
    console.log('❌ Idea creation exception:', e.message)
  }
}

async function verifyCreation() {
  console.log('\n🔍 Verifying database...')
  
  try {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Verification failed:', error.message)
    } else {
      console.log(`✅ Found ${ideas?.length || 0} ideas in database`)
      if (ideas?.length > 0) {
        console.log('📋 Sample idea:', ideas[0].title)
      }
    }
  } catch (e) {
    console.log('❌ Verification exception:', e.message)
  }
}

async function main() {
  await createSchema()
  await addTestData()
  await verifyCreation()
  console.log('\n🎉 Database setup complete!')
}

main().catch(console.error)