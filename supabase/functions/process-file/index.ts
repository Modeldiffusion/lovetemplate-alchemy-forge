import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, fileContent, fileType } = await req.json();
    
    if (!templateId || !fileContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing templateId or fileContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file for template ${templateId}, type: ${fileType}`);

    let extractedText = '';
    
    try {
      // For now, handle base64 encoded text content
      // In the future, this can be extended to handle different file formats
      if (fileType === 'text/plain' || fileType === 'application/octet-stream') {
        // Assume base64 encoded text
        try {
          extractedText = atob(fileContent);
        } catch {
          // If not base64, treat as plain text
          extractedText = fileContent;
        }
      } else {
        // For other formats, we'll need to implement specific parsers
        // For now, treat as text
        try {
          extractedText = atob(fileContent);
        } catch {
          extractedText = fileContent;
        }
      }

      console.log(`Extracted text length: ${extractedText.length}`);
      
      // Update template with extracted content
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          metadata: { 
            content: extractedText,
            processedAt: new Date().toISOString(),
            originalFileType: fileType
          },
          status: 'completed'
        })
        .eq('id', templateId);

      if (updateError) {
        console.error('Error updating template:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Successfully processed file for template ${templateId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedLength: extractedText.length,
          message: 'File processed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('Error processing file content:', processingError);
      
      // Update template status to failed
      await supabase
        .from('templates')
        .update({ status: 'failed' })
        .eq('id', templateId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to process file content' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in process-file function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});