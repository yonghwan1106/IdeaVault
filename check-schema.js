const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wydhzaicymzxjesvaorw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGh6YWljeW16eGplc3Zhb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3MTQ2NCwiZXhwIjoyMDY3MzQ3NDY0fQ.mTF8s5L0W7ZeFYPzbyC1qtBy_sC_qRFvaP1dCoqvpGQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('=== Checking database schema ===')
  
  // Check what tables exist
  const { data: tables, error } = await supabase
    .rpc('sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    })
  
  console.log('Existing tables:', tables, error)
}

async function createTables() {
  console.log('=== Creating tables ===')
  
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE,
      full_name VARCHAR(100),
      avatar_url TEXT,
      user_type TEXT CHECK (user_type IN ('buyer', 'seller', 'both')) DEFAULT 'buyer',
      verified BOOLEAN DEFAULT false,
      bio TEXT,
      expertise_tags TEXT[],
      location VARCHAR(100),
      website_url TEXT,
      social_links JSONB,
      notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login_at TIMESTAMP WITH TIME ZONE
    );

    -- Create ideas table
    CREATE TABLE IF NOT EXISTS ideas (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(250) UNIQUE,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      subcategory VARCHAR(50),
      package_type TEXT CHECK (package_type IN ('idea', 'mvp', 'launch_kit')) DEFAULT 'idea',
      price INTEGER NOT NULL CHECK (price >= 50000 AND price <= 1000000),
      currency VARCHAR(3) DEFAULT 'KRW',
      target_audience TEXT,
      revenue_model VARCHAR(100),
      implementation_difficulty INTEGER CHECK (implementation_difficulty BETWEEN 1 AND 5),
      estimated_dev_time VARCHAR(50),
      tech_stack TEXT[],
      market_size VARCHAR(100),
      validation_status TEXT CHECK (validation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      validation_notes TEXT,
      preview_content TEXT,
      full_content TEXT,
      files JSONB,
      view_count INTEGER DEFAULT 0,
      purchase_count INTEGER DEFAULT 0,
      status TEXT CHECK (status IN ('draft', 'active', 'paused', 'sold', 'archived')) DEFAULT 'draft',
      featured BOOLEAN DEFAULT false,
      seo_keywords TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITH TIME ZONE,
      sold_at TIMESTAMP WITH TIME ZONE
    );
  `
  
  const { data, error } = await supabase.rpc('sql', { query: createTablesSQL })
  console.log('Tables creation result:', data, error)
}

async function main() {
  await checkSchema()
  await createTables()
  await checkSchema()
}

main().catch(console.error)