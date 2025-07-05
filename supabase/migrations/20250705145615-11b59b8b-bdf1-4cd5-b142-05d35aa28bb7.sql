-- Clean up all user data for a fresh start
-- Delete all extracted tags
DELETE FROM extracted_tags;

-- Delete all tag mappings
DELETE FROM tag_mappings;

-- Delete all internal tags
DELETE FROM internal_tags;

-- Delete all templates
DELETE FROM templates;

-- Delete all user profiles (except system users)
DELETE FROM profiles WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email LIKE '%@supabase%' OR email LIKE '%@system%'
);

-- Reset sequences if they exist
-- (PostgreSQL will handle auto-increment resets automatically for UUID primary keys)