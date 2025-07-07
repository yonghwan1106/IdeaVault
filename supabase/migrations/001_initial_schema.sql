-- Initial Schema for IdeaVault
-- Create core tables for micro SaaS idea marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
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
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  package_type TEXT CHECK (package_type IN ('idea', 'mvp', 'launch_kit')) DEFAULT 'idea',
  price INTEGER NOT NULL CHECK (price >= 50000 AND price <= 1000000), -- in KRW cents
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
  files JSONB, -- {filename, url, size, type}
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

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- total amount in KRW cents
  platform_commission INTEGER NOT NULL,
  seller_amount INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  toss_payment_id VARCHAR(255),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'toss')),
  status TEXT CHECK (status IN ('pending', 'processing', 'paid', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  refund_requested_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  buyer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  implementation_success_rating INTEGER CHECK (implementation_success_rating BETWEEN 1 AND 5),
  revenue_potential_rating INTEGER CHECK (revenue_potential_rating BETWEEN 1 AND 5),
  comment TEXT,
  anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for buyer-seller communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID, -- for grouping related messages
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);

CREATE INDEX idx_ideas_seller_id ON ideas(seller_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_package_type ON ideas(package_type);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_validation_status ON ideas(validation_status);
CREATE INDEX idx_ideas_price ON ideas(price);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
CREATE INDEX idx_ideas_slug ON ideas(slug);

CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_idea_id ON transactions(idea_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_idea_id ON messages(idea_id);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate slug on idea insert/update
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
    
    -- Ensure slug uniqueness
    WHILE EXISTS (SELECT 1 FROM ideas WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug = NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    END LOOP;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slugs
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT OR UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and other public profiles
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Anyone can view published ideas" ON ideas
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own ideas" ON ideas
  FOR ALL USING (seller_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions as buyers" ON transactions
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their transactions" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE id = transaction_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());