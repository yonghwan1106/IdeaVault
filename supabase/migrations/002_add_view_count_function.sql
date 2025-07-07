-- Add function to increment view count safely
CREATE OR REPLACE FUNCTION increment_view_count(idea_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ideas 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = NOW()
  WHERE id = idea_id 
    AND status = 'active' 
    AND validation_status = 'approved';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;