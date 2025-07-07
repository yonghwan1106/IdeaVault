-- 추천 클릭 추적 테이블
CREATE TABLE IF NOT EXISTS recommendation_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_user_id ON recommendation_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_idea_id ON recommendation_clicks(idea_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_clicked_at ON recommendation_clicks(clicked_at);

-- RLS 정책 설정
ALTER TABLE recommendation_clicks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 클릭 데이터만 볼 수 있음
CREATE POLICY "Users can view own recommendation clicks" ON recommendation_clicks
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 클릭만 생성할 수 있음
CREATE POLICY "Users can create own recommendation clicks" ON recommendation_clicks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 데이터에 접근 가능
CREATE POLICY "Admins can view all recommendation clicks" ON recommendation_clicks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );