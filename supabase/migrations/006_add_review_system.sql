-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  implementation_success INTEGER CHECK (implementation_success >= 1 AND implementation_success <= 5) NOT NULL,
  revenue_potential INTEGER CHECK (revenue_potential >= 1 AND revenue_potential <= 5) NOT NULL,
  comment TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, buyer_id)
);

-- Create review_votes table for helpful voting
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Create function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reviews 
  SET helpful_count = COALESCE(helpful_count, 0) + 1,
      updated_at = NOW()
  WHERE id = review_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_idea_id ON reviews(idea_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
CREATE POLICY "Public read access to reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for purchased ideas" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND
    EXISTS (
      SELECT 1 FROM transactions 
      WHERE buyer_id = auth.uid() 
      AND idea_id = reviews.idea_id 
      AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = buyer_id);

-- Create RLS policies for review_votes
CREATE POLICY "Public read access to review votes" ON review_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON review_votes TO authenticated;
GRANT EXECUTE ON FUNCTION increment_helpful_count(UUID) TO authenticated;

-- Add trigger to update updated_at on reviews
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();