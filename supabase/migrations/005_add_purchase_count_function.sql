-- Add function to increment purchase count safely
CREATE OR REPLACE FUNCTION increment_purchase_count(idea_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ideas 
  SET purchase_count = COALESCE(purchase_count, 0) + 1,
      updated_at = NOW()
  WHERE id = idea_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_purchase_count(UUID) TO authenticated;