-- AI Deep Tech Features Migration
-- Adding tables and functions for AI matching, prediction, and analytics

-- 1. AI Success Prediction System
CREATE TABLE success_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prediction_score DECIMAL(5,2) CHECK (prediction_score >= 0 AND prediction_score <= 100),
  market_timing_score DECIMAL(5,2) CHECK (market_timing_score >= 0 AND market_timing_score <= 100),
  technical_feasibility_score DECIMAL(5,2) CHECK (technical_feasibility_score >= 0 AND technical_feasibility_score <= 100),
  developer_match_score DECIMAL(5,2) CHECK (developer_match_score >= 0 AND developer_match_score <= 100),
  funding_probability_score DECIMAL(5,2) CHECK (funding_probability_score >= 0 AND funding_probability_score <= 100),
  confidence_interval DECIMAL(5,2) CHECK (confidence_interval >= 0 AND confidence_interval <= 100),
  prediction_factors JSONB DEFAULT '{}'::jsonb,
  model_version VARCHAR(20) DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Market Analytics Data
CREATE TABLE market_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  search_volume INTEGER DEFAULT 0,
  trend_direction TEXT CHECK (trend_direction IN ('rising', 'falling', 'stable')) DEFAULT 'stable',
  market_size_estimate BIGINT DEFAULT 0,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  revenue_potential TEXT CHECK (revenue_potential IN ('low', 'medium', 'high')) DEFAULT 'medium',
  data_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100) DEFAULT 50.0,
  UNIQUE(keyword, analysis_date)
);

-- 3. Developer Analytics
CREATE TABLE developer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  github_username VARCHAR(255),
  skill_scores JSONB DEFAULT '{}'::jsonb, -- {"javascript": 85, "react": 90, ...}
  project_completion_rate DECIMAL(5,2) DEFAULT 0.0,
  average_project_duration INTEGER DEFAULT 0, -- in days
  preferred_tech_stack TEXT[] DEFAULT ARRAY[]::TEXT[],
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  specialization_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_github_sync TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Generated Code Storage
CREATE TABLE generated_code (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code_type TEXT CHECK (code_type IN ('mvp', 'api', 'ui', 'database', 'config')) DEFAULT 'mvp',
  programming_language VARCHAR(50) DEFAULT 'javascript',
  framework VARCHAR(100) DEFAULT 'nextjs',
  code_content TEXT,
  file_structure JSONB DEFAULT '{}'::jsonb,
  dependencies JSONB DEFAULT '{}'::jsonb,
  deployment_instructions TEXT,
  quality_score DECIMAL(5,2) CHECK (quality_score >= 0 AND quality_score <= 100) DEFAULT 0.0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Training Data
CREATE TABLE ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_type TEXT CHECK (data_type IN ('idea_success', 'market_trend', 'developer_skill', 'matching_outcome')) NOT NULL,
  input_features JSONB NOT NULL,
  target_output JSONB NOT NULL,
  source_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  validation_split TEXT CHECK (validation_split IN ('train', 'validation', 'test')) DEFAULT 'train',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. External Data Sources Tracking
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name VARCHAR(100) NOT NULL,
  source_type TEXT CHECK (source_type IN ('api', 'web_scraping', 'manual', 'file_upload')) NOT NULL,
  endpoint_url TEXT,
  api_key_name VARCHAR(100), -- reference to secure key storage
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_frequency_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  data_schema JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. NLP Analysis Cache
CREATE TABLE nlp_analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of analyzed content
  original_text TEXT NOT NULL,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  similarity_vectors FLOAT8[], -- for similarity matching
  language_detected VARCHAR(10) DEFAULT 'ko',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version VARCHAR(20) DEFAULT 'v1.0'
);

-- Add success_prediction_id to transactions table
ALTER TABLE transactions ADD COLUMN success_prediction_id UUID REFERENCES success_predictions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_success_predictions_idea_id ON success_predictions(idea_id);
CREATE INDEX idx_success_predictions_buyer_id ON success_predictions(buyer_id);
CREATE INDEX idx_success_predictions_score ON success_predictions(prediction_score);

CREATE INDEX idx_market_analytics_keyword ON market_analytics(keyword);
CREATE INDEX idx_market_analytics_date ON market_analytics(analysis_date);
CREATE INDEX idx_market_analytics_trend ON market_analytics(trend_direction);

CREATE INDEX idx_developer_analytics_user_id ON developer_analytics(user_id);
CREATE INDEX idx_developer_analytics_github ON developer_analytics(github_username);
CREATE INDEX idx_developer_analytics_success_rate ON developer_analytics(success_rate);

CREATE INDEX idx_generated_code_idea_id ON generated_code(idea_id);
CREATE INDEX idx_generated_code_buyer_id ON generated_code(buyer_id);
CREATE INDEX idx_generated_code_type ON generated_code(code_type);

CREATE INDEX idx_ai_training_data_type ON ai_training_data(data_type);
CREATE INDEX idx_ai_training_data_split ON ai_training_data(validation_split);

CREATE INDEX idx_data_sources_active ON data_sources(is_active);
CREATE INDEX idx_data_sources_sync ON data_sources(last_sync);

CREATE INDEX idx_nlp_cache_hash ON nlp_analysis_cache(content_hash);
CREATE INDEX idx_nlp_cache_categories ON nlp_analysis_cache USING GIN(categories);
CREATE INDEX idx_nlp_cache_keywords ON nlp_analysis_cache USING GIN(keywords);

-- Functions for AI features

-- 1. Calculate AI matching score between developer and idea
CREATE OR REPLACE FUNCTION calculate_ai_matching_score(
  developer_user_id UUID,
  target_idea_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  developer_skills JSONB;
  idea_tech_stack TEXT[];
  base_score DECIMAL(5,2) := 0.0;
  skill_match_score DECIMAL(5,2) := 0.0;
  experience_score DECIMAL(5,2) := 0.0;
BEGIN
  -- Get developer skills
  SELECT skill_scores INTO developer_skills
  FROM developer_analytics 
  WHERE user_id = developer_user_id;
  
  -- Get idea tech stack
  SELECT tech_stack INTO idea_tech_stack
  FROM ideas 
  WHERE id = target_idea_id;
  
  -- Calculate skill matching (simplified algorithm)
  IF developer_skills IS NOT NULL AND idea_tech_stack IS NOT NULL THEN
    -- Basic skill overlap calculation
    skill_match_score := 60.0; -- Base score for having skills data
    
    -- Add experience bonus
    SELECT success_rate INTO experience_score
    FROM developer_analytics 
    WHERE user_id = developer_user_id;
    
    base_score := skill_match_score + (experience_score * 0.4);
  END IF;
  
  -- Cap at 100
  RETURN LEAST(base_score, 100.0);
END;
$$ LANGUAGE plpgsql;

-- 2. Generate success prediction for idea-developer pair
CREATE OR REPLACE FUNCTION generate_success_prediction(
  target_idea_id UUID,
  target_buyer_id UUID
) RETURNS UUID AS $$
DECLARE
  prediction_id UUID;
  market_score DECIMAL(5,2) := 70.0; -- Default market timing score
  tech_score DECIMAL(5,2) := 75.0;   -- Default technical feasibility
  match_score DECIMAL(5,2);
  funding_score DECIMAL(5,2) := 65.0; -- Default funding probability
  overall_score DECIMAL(5,2);
BEGIN
  -- Calculate developer matching score
  match_score := calculate_ai_matching_score(target_buyer_id, target_idea_id);
  
  -- Calculate overall prediction score (weighted average)
  overall_score := (market_score * 0.25) + (tech_score * 0.25) + (match_score * 0.3) + (funding_score * 0.2);
  
  -- Insert prediction record
  INSERT INTO success_predictions (
    idea_id,
    buyer_id,
    prediction_score,
    market_timing_score,
    technical_feasibility_score,
    developer_match_score,
    funding_probability_score,
    confidence_interval,
    prediction_factors
  ) VALUES (
    target_idea_id,
    target_buyer_id,
    overall_score,
    market_score,
    tech_score,
    match_score,
    funding_score,
    85.0, -- Default confidence
    jsonb_build_object(
      'calculation_method', 'basic_weighted_average',
      'weights', jsonb_build_object(
        'market_timing', 0.25,
        'technical_feasibility', 0.25,
        'developer_match', 0.3,
        'funding_probability', 0.2
      )
    )
  ) RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Update market analytics from external data
CREATE OR REPLACE FUNCTION update_market_analytics(
  keyword_name VARCHAR(255),
  search_vol INTEGER DEFAULT NULL,
  trend_dir TEXT DEFAULT NULL,
  market_size BIGINT DEFAULT NULL,
  competition TEXT DEFAULT NULL,
  revenue_pot TEXT DEFAULT NULL,
  confidence DECIMAL(5,2) DEFAULT 75.0
) RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO market_analytics (
    keyword,
    search_volume,
    trend_direction,
    market_size_estimate,
    competition_level,
    revenue_potential,
    confidence_score,
    data_sources
  ) VALUES (
    keyword_name,
    COALESCE(search_vol, 0),
    COALESCE(trend_dir, 'stable'),
    COALESCE(market_size, 0),
    COALESCE(competition, 'medium'),
    COALESCE(revenue_pot, 'medium'),
    confidence,
    ARRAY['manual_input']
  ) 
  ON CONFLICT (keyword, analysis_date) 
  DO UPDATE SET
    search_volume = EXCLUDED.search_volume,
    trend_direction = EXCLUDED.trend_direction,
    market_size_estimate = EXCLUDED.market_size_estimate,
    competition_level = EXCLUDED.competition_level,
    revenue_potential = EXCLUDED.revenue_potential,
    confidence_score = EXCLUDED.confidence_score
  RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql;

-- 4. NLP text analysis function
CREATE OR REPLACE FUNCTION analyze_text_nlp(
  input_text TEXT,
  text_language VARCHAR(10) DEFAULT 'ko'
) RETURNS UUID AS $$
DECLARE
  content_hash VARCHAR(64);
  analysis_id UUID;
  extracted_keywords TEXT[];
  detected_categories TEXT[];
BEGIN
  -- Generate content hash
  content_hash := encode(sha256(input_text::bytea), 'hex');
  
  -- Check if already analyzed
  SELECT id INTO analysis_id 
  FROM nlp_analysis_cache 
  WHERE content_hash = content_hash;
  
  IF analysis_id IS NOT NULL THEN
    RETURN analysis_id;
  END IF;
  
  -- Simple keyword extraction (placeholder for real NLP)
  extracted_keywords := string_to_array(
    regexp_replace(lower(input_text), '[^a-zA-Z가-힣\s]', '', 'g'), 
    ' '
  );
  
  -- Simple category detection (placeholder)
  detected_categories := CASE 
    WHEN input_text ILIKE '%AI%' OR input_text ILIKE '%인공지능%' THEN ARRAY['ai', 'technology']
    WHEN input_text ILIKE '%모바일%' OR input_text ILIKE '%앱%' THEN ARRAY['mobile', 'app']
    WHEN input_text ILIKE '%웹%' OR input_text ILIKE '%사이트%' THEN ARRAY['web', 'website']
    ELSE ARRAY['general']
  END;
  
  -- Insert analysis result
  INSERT INTO nlp_analysis_cache (
    content_hash,
    original_text,
    categories,
    keywords,
    sentiment_score,
    language_detected
  ) VALUES (
    content_hash,
    input_text,
    detected_categories,
    extracted_keywords[1:10], -- Top 10 keywords
    0.0, -- Neutral sentiment for now
    text_language
  ) RETURNING id INTO analysis_id;
  
  RETURN analysis_id;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for new tables
CREATE TRIGGER trigger_success_predictions_updated_at
  BEFORE UPDATE ON success_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_developer_analytics_updated_at
  BEFORE UPDATE ON developer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for new tables
ALTER TABLE success_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own success predictions" ON success_predictions
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can view market analytics" ON market_analytics
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own developer analytics" ON developer_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own generated code" ON generated_code
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Admin can manage data sources" ON data_sources
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE user_type = 'admin'));

CREATE POLICY "Anyone can view NLP cache" ON nlp_analysis_cache
  FOR SELECT USING (true);

-- Insert sample data sources
INSERT INTO data_sources (source_name, source_type, endpoint_url, sync_frequency_hours) VALUES
('Product Hunt API', 'api', 'https://api.producthunt.com/v2/api/graphql', 24),
('GitHub Trending', 'api', 'https://api.github.com/search/repositories', 12),
('Google Trends', 'api', 'https://trends.google.com/trends/api', 24),
('Naver Trend', 'web_scraping', 'https://datalab.naver.com', 24),
('Reddit Tech', 'api', 'https://www.reddit.com/r/technology.json', 6);

-- Insert sample market analytics
INSERT INTO market_analytics (keyword, search_volume, trend_direction, competition_level, revenue_potential) VALUES
('AI 스타트업', 15000, 'rising', 'high', 'high'),
('모바일 앱', 8500, 'stable', 'high', 'medium'),
('SaaS 솔루션', 12000, 'rising', 'medium', 'high'),
('핀테크', 9200, 'rising', 'high', 'high'),
('이커머스', 7800, 'stable', 'high', 'medium');