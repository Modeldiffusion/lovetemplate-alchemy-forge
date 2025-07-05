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

    const { templateId } = body;
    if (!templateId) {
      console.error('❌ No template ID provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Template ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Template ID:', templateId);

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

    // Step 4: Just return success for now (simplified)
    console.log('Step 4: Returning success (simplified version)');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simplified extraction function works!',
        data: {
          templateId,
          tags: [
            { text: "COMPANY_NAME", confidence: 90, context: "Company: [COMPANY_NAME]", position: 1, pattern: "Company name placeholder" },
            { text: "CONTRACT_DATE", confidence: 85, context: "Date: [CONTRACT_DATE]", position: 2, pattern: "Date placeholder" }
          ],
          totalTags: 2,
          processingTime: '0.1s'
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