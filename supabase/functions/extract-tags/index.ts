import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== EXTRACT-TAGS FUNCTION STARTED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    // Step 1: Parse request
    console.log('Step 1: Parsing request...');
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { templateId, extractionConfig } = body;
    if (!templateId) {
      console.error('❌ No template ID provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Template ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Template ID:', templateId);
    console.log('✅ Extraction Config:', extractionConfig);

    // Step 2: Check environment
    console.log('Step 2: Checking environment...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.log('OPENAI_API_KEY:', openaiKey ? '✅ Set' : '❌ Missing');

    if (!openaiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Initialize Supabase
    console.log('Step 3: Initializing Supabase...');
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });
    console.log('✅ Supabase client initialized');

    // Step 4: Get template details
    console.log('Step 4: Fetching template details...');
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('❌ Template fetch error:', templateError);
      return new Response(
        JSON.stringify({ success: false, error: `Template fetch failed: ${templateError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!template) {
      console.error('❌ Template not found with ID:', templateId);
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Template found:', template.name);

    // Step 5: Get actual template content from metadata or file
    console.log('Step 5: Attempting to get template content...');
    
    let templateContent = '';
    
    // Check if template has actual content in metadata
    if (template.metadata && (template.metadata.content || template.metadata.extractedText)) {
      // Check if this is a PDF document that needs proper parsing
      if (template.metadata.needsDocumentParsing && template.metadata.originalFileType?.includes('pdf')) {
        console.error('❌ PDF document requires proper parsing');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `PDF documents require proper parsing. Current extraction from PDF files is not supported. Please convert to plain text or implement PDF parsing.` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use extracted text if available, otherwise use content
      templateContent = template.metadata.extractedText || template.metadata.content;
      console.log('Using actual content from metadata, length:', templateContent.length);
      console.log('Content preview:', templateContent.substring(0, 200));
    } else if (template.file_path) {
      console.log('File path exists:', template.file_path);
      // Try to read from Supabase Storage
      try {
        const { data: fileData, error: storageError } = await supabaseClient.storage
          .from('templates')
          .download(template.file_path);
          
        if (storageError) {
          console.error('Storage read error:', storageError);
          throw new Error(`Cannot read template file: ${storageError.message}`);
        }
        
        if (fileData) {
          templateContent = await fileData.text();
          console.log('Successfully read file from storage, length:', templateContent.length);
        }
      } catch (storageError) {
        console.log('Storage access failed, no content available');
        templateContent = '';
      }
    } else {
      // No content available
      console.log('⚠️ No template content available');
      templateContent = '';
    }

    // If no content is available, return empty result
    if (!templateContent || templateContent.length < 10) {
      console.log('No content available for tag extraction');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content available for tag extraction',
          data: {
            templateId,
            tags: [],
            totalTags: 0,
            processingTime: '0.1s'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Template content prepared, length:', templateContent.length);
    console.log('Sample content preview:', templateContent.substring(0, 200) + '...');

    // Step 6: Build dynamic regex based on extraction config
    console.log('Step 6: Building extraction regex...');
    
    // Default delimiter configuration
    const defaultConfig = {
      delimiterPairs: [{ start: '[', end: ']' }],
      caseSensitive: false,
      includeDelimiters: true
    };
    
    const config = { ...defaultConfig, ...extractionConfig };
    console.log('Using extraction config:', config);
    
    // Build regex pattern for delimiter pairs and @ tags
    const buildExtractionRegex = (delimiterPairs, caseSensitive) => {
      // Escape special regex characters properly, including Unicode characters
      const escapeRegex = (str) => {
        // Handle Unicode characters like « and » by escaping them properly
        return str.replace(/[.*+?^${}()|[\]\\«»]/g, '\\$&');
      };
      
      const patterns = [];
      
      // Create patterns for delimiter pairs
      const pairPatterns = delimiterPairs
        .filter(pair => pair.start && pair.end)
        .map(pair => {
          const startEscaped = escapeRegex(pair.start);
          const endEscaped = pair.end === ' ' ? '\\s+' : escapeRegex(pair.end);
          
          // Support mixed case tags like tag_Name or TAG_NAME
          return `(${startEscaped})([A-Za-z_][A-Za-z0-9_]*)(${endEscaped})`;
        });
      
      patterns.push(...pairPatterns);
      
      // Add @ tag pattern (comma or space terminated, or end of line)
      // @tagname followed by comma, space, or end of string/line
      patterns.push('(@)([A-Za-z_][A-Za-z0-9_]*)(?=[ ,\\n\\t\\r]|$)');
      
      if (patterns.length === 0) {
        // Fallback to default if no valid patterns
        return /(\\[)([A-Za-z_][A-Za-z0-9_]*)(\\])/gi;
      }
      
      // Combine all patterns with OR
      const combinedPattern = patterns.join('|');
      const flags = caseSensitive ? 'g' : 'gi';
      
      return new RegExp(combinedPattern, flags);
    };
    
    const tagRegex = buildExtractionRegex(config.delimiterPairs, config.caseSensitive);
    
    console.log('Generated regex:', tagRegex);
    const extractedTags = [];
    const seenTags = new Set();
    let position = 1;

    // Reset regex lastIndex to ensure we scan from the beginning
    tagRegex.lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(templateContent)) !== null) {
      const fullMatch = match[0]; // Full match including delimiters
      
      // Handle different capture groups based on pattern type
      let startDelim = '';
      let tagContent = '';
      let endDelim = '';
      
      // Find which capture groups are populated
      for (let i = 1; i < match.length; i += 3) {
        if (match[i] && match[i + 1]) {
          startDelim = match[i];
          tagContent = match[i + 1];
          endDelim = match[i + 2] || '';
          break;
        }
      }
      
      // For @ tags, if no explicit end delimiter is captured, use comma or space
      if (startDelim === '@' && !endDelim) {
        // Look ahead in the text to find the actual terminator
        const afterMatch = templateContent.substring(match.index + fullMatch.length, match.index + fullMatch.length + 10);
        if (afterMatch.match(/^[, \n\t]/)) {
          endDelim = afterMatch.charAt(0);
        }
      }
      
      const tagText = config.includeDelimiters ? (startDelim + tagContent + endDelim) : tagContent;
      
      // Skip if we've already seen this tag
      if (seenTags.has(tagText)) {
        continue;
      }
      seenTags.add(tagText);

      // Get context around the tag (±30 characters)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(templateContent.length, match.index + match[0].length + 30);
      const context = templateContent.substring(start, end).trim();

      // Determine pattern/category based on tag content
      let pattern = `${startDelim}...${endDelim || ''} placeholder`;
      let confidence = 85;

      // Special handling for @ tags
      if (startDelim === '@') {
        pattern = '@tag (comma/space terminated)';
        confidence = 90;
      } else if (tagContent.includes('DATE')) {
        pattern = 'Date placeholder';
        confidence = 95;
      } else if (tagContent.includes('NAME')) {
        pattern = 'Name placeholder';
        confidence = 90;
      } else if (tagContent.includes('EMAIL')) {
        pattern = 'Email placeholder';
        confidence = 95;
      } else if (tagContent.includes('PHONE')) {
        pattern = 'Phone placeholder';
        confidence = 90;
      } else if (tagContent.includes('ADDRESS')) {
        pattern = 'Address placeholder';
        confidence = 90;
      } else if (tagContent.includes('VALUE') || tagContent.includes('AMOUNT')) {
        pattern = 'Currency/Value placeholder';
        confidence = 90;
      } else if (tagContent.includes('NUMBER')) {
        pattern = 'Number placeholder';
        confidence = 85;
      } else if (tagContent.includes('COMPANY')) {
        pattern = 'Company information placeholder';
        confidence = 95;
      }

      extractedTags.push({
        text: tagText,
        pattern: pattern,
        position: position++,
        context: context,
        confidence: confidence,
        startDelimiter: startDelim,
        endDelimiter: endDelim,
        tagContent: tagContent
      });
    }

    console.log(`✅ Found ${extractedTags.length} unique tags:`, extractedTags.map(t => t.text));

    if (extractedTags.length === 0) {
      console.log('⚠️ No tags found in template content');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No tags found in template',
          data: {
            templateId,
            tags: [],
            totalTags: 0,
            processingTime: '0.1s'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 8: Get user context for database insert
    console.log('Step 8: Getting user context...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('❌ User auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: `Authentication failed: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ User authenticated:', user?.id);

    // Step 9: Prepare tags for database insertion
    console.log('Step 9: Preparing tags for database insertion...');
    const tagsToInsert = extractedTags.map((tag) => ({
      template_id: templateId,
      text: tag.text,
      pattern: tag.pattern,
      position: tag.position,
      context: tag.context,
      confidence: tag.confidence,
      extracted_by: user?.id
    }));

    console.log(`Step 10: Inserting ${tagsToInsert.length} tags into database...`);

    // First, delete any existing tags for this template to avoid duplicates
    const { error: deleteError } = await supabaseClient
      .from('extracted_tags')
      .delete()
      .eq('template_id', templateId);

    if (deleteError) {
      console.log('⚠️ Note: Could not delete existing tags (might be first extraction):', deleteError.message);
    }

    // Insert new tags
    const { data: insertedTags, error: insertError } = await supabaseClient
      .from('extracted_tags')
      .insert(tagsToInsert)
      .select();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to store extracted tags: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Successfully inserted tags:', insertedTags?.length);

    // Step 11: Update template status
    console.log('Step 11: Updating template status...');
    const { error: updateError } = await supabaseClient
      .from('templates')
      .update({ status: 'completed' })
      .eq('id', templateId);
      
    if (updateError) {
      console.log('⚠️ Template update warning:', updateError.message);
      // Don't throw here as the main operation succeeded
    }

    console.log('🎉 Tag extraction completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tags: insertedTags,
          totalTags: insertedTags?.length || 0,
          processingTime: '1.2s',
          templateName: template.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in extract-tags function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Function error: ${error.message}`,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});