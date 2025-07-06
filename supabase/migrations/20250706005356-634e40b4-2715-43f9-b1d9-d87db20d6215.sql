-- Clean up all user data for a fresh start
-- Delete all extracted tags first (due to foreign key constraints)
DELETE FROM extracted_tags;

-- Delete all tag mappings
DELETE FROM tag_mappings;

-- Delete all internal tags
DELETE FROM internal_tags;

-- Delete all templates
DELETE FROM templates;

-- Delete all user profiles (keep system users if any)
DELETE FROM profiles WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email LIKE '%@supabase%' OR email LIKE '%@system%'
);

-- Reset any sequences if needed (PostgreSQL handles UUID resets automatically)