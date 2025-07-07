const { Client } = require('pg')
const fs = require('fs')

// Supabase connection string (need to construct from env vars)
const connectionString = `postgresql://postgres:${encodeURIComponent('ideavault-db-2024')}@db.wydhzaicymzxjesvaorw.supabase.co:5432/postgres`

async function createSchema() {
  console.log('🚀 Connecting to Supabase PostgreSQL...')
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8')
    console.log('📝 Read schema file')
    
    // Execute the entire schema
    console.log('⏳ Creating tables and indexes...')
    await client.query(schemaSQL)
    console.log('✅ Schema created successfully')
    
    // Add test data
    console.log('🎯 Adding test data...')
    
    const testDataSQL = `
      -- Test user
      INSERT INTO users (id, email, full_name, user_type, verified, bio) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'seller@test.com', '김창업', 'seller', true, '검증된 마이크로 SaaS 아이디어를 제공합니다.')
      ON CONFLICT (id) DO NOTHING;
      
      -- Test ideas
      INSERT INTO ideas (
        id, seller_id, title, description, category, package_type, price, 
        implementation_difficulty, tech_stack, status, validation_status, 
        view_count, target_audience, revenue_model
      ) VALUES 
      (
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'AI 기반 학습 도우미 SaaS',
        '개인 맞춤형 학습 계획을 제공하는 AI 기반 학습 도우미 플랫폼입니다. 사용자의 학습 패턴을 분석하여 최적의 학습 방법을 제안합니다.',
        'education',
        'mvp',
        350000,
        3,
        ARRAY['React', 'Node.js', 'Python', 'OpenAI API'],
        'active',
        'approved',
        156,
        '대학생, 직장인, 자기계발을 원하는 성인',
        'subscription'
      ),
      (
        '44444444-4444-4444-4444-444444444444',
        '11111111-1111-1111-1111-111111111111',
        '소상공인을 위한 재고 관리 도구',
        '소규모 상점과 카페를 위한 간단하고 직관적인 재고 관리 솔루션입니다.',
        'business',
        'launch_kit',
        750000,
        2,
        ARRAY['Vue.js', 'Laravel', 'MySQL'],
        'active',
        'approved',
        89,
        '소상공인, 카페 사장',
        'saas'
      ),
      (
        '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111',
        '펫시터 매칭 플랫폼',
        '신뢰할 수 있는 펫시터와 반려동물 주인을 연결해주는 플랫폼입니다.',
        'lifestyle',
        'idea',
        180000,
        4,
        ARRAY['React Native', 'Node.js', 'MongoDB'],
        'active',
        'approved',
        234,
        '반려동물을 키우는 직장인',
        'commission'
      )
      ON CONFLICT (id) DO NOTHING;
    `
    
    await client.query(testDataSQL)
    console.log('✅ Test data added')
    
    // Verify creation
    const result = await client.query('SELECT COUNT(*) as count FROM ideas')
    console.log(`🔍 Database contains ${result.rows[0].count} ideas`)
    
    const ideasResult = await client.query('SELECT title, category, price FROM ideas LIMIT 3')
    console.log('📋 Sample ideas:')
    ideasResult.rows.forEach(idea => {
      console.log(`  - ${idea.title} (${idea.category}) - ₩${idea.price.toLocaleString()}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
    console.log('🔌 Disconnected from database')
  }
}

createSchema().then(() => {
  console.log('🎉 Database setup complete!')
}).catch(console.error)