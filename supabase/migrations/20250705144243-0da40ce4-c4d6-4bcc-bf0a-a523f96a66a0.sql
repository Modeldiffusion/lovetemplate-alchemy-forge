-- Clean up dummy/placeholder tags that were generated during testing
DELETE FROM extracted_tags 
WHERE text IN (
  '[COMPANY_NAME]', '[CLIENT_NAME]', '[DATE]', '[AMOUNT]', '[ADDRESS]', 
  '[PHONE]', '[EMAIL]', '[PROJECT_NAME]', '[REFERENCE_NUMBER]', '[DESCRIPTION]'
) 
OR pattern LIKE '%placeholder%';