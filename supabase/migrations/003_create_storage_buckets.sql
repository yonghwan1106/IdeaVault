-- Create storage buckets for file uploads

-- Avatar images bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Idea images bucket (public - for previews)  
INSERT INTO storage.buckets (id, name, public) VALUES ('idea-images', 'idea-images', true);

-- Idea files bucket (private - requires purchase)
INSERT INTO storage.buckets (id, name, public) VALUES ('idea-files', 'idea-files', false);

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- RLS Policies for idea-images bucket
CREATE POLICY "Users can upload images for their ideas" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'idea-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update images for their ideas" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'idea-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete images for their ideas" ON storage.objects
FOR DELETE USING (
  bucket_id = 'idea-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view idea images" ON storage.objects
FOR SELECT USING (bucket_id = 'idea-images');

-- RLS Policies for idea-files bucket (protected files)
CREATE POLICY "Users can upload files for their ideas" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'idea-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update files for their ideas" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'idea-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete files for their ideas" ON storage.objects
FOR DELETE USING (
  bucket_id = 'idea-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only allow access to idea files if user has purchased the idea or is the seller
CREATE POLICY "Users can view files they purchased or own" ON storage.objects
FOR SELECT USING (
  bucket_id = 'idea-files' 
  AND (
    -- User is the seller (owns the files)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- User has purchased the idea
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN ideas i ON i.id = t.idea_id
      WHERE t.buyer_id = auth.uid()
        AND t.status = 'completed'
        AND name LIKE '%idea_' || i.id::text || '%'
    )
  )
);