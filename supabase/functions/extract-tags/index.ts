import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { RequestValidator } from './request-validator.ts';
import { ContentProcessor } from './content-processor.ts';
import { TagExtractor } from './tag-extractor.ts';
import { DatabaseHandler } from './database-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== EXTRACT-TAGS FUNCTION STARTED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    // Step 1: Parse and validate request
    const { templateId, extractionConfig } = await RequestValidator.validateRequest(req);

    // Step 2: Check environment
    const { supabaseUrl, supabaseKey } = RequestValidator.validateEnvironment();

    // Step 3: Initialize Supabase
    console.log('Step 3: Initializing Supabase...');
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });
    console.log('✅ Supabase client initialized');

    // Step 4: Get template details
    const template = await DatabaseHandler.getTemplate(supabaseClient, templateId);

    // Step 5: Process template content
    const { content: templateContent } = await ContentProcessor.processTemplate(template, supabaseClient);

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

    // Step 6: Extract tags
    const extractedTags = TagExtractor.extractTags(templateContent, extractionConfig);

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

    // Step 8: Get user context
    const user = await DatabaseHandler.getUser(supabaseClient);

    // Step 9-10: Insert tags into database
    const insertedTags = await DatabaseHandler.insertExtractedTags(
      supabaseClient,
      templateId,
      extractedTags,
      user?.id
    );

    // Step 11: Update template status
    await DatabaseHandler.updateTemplateStatus(supabaseClient, templateId);

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
        status: error.message.includes('Template ID is required') ? 400 :
               error.message.includes('Template not found') ? 404 :
               error.message.includes('Authentication failed') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});