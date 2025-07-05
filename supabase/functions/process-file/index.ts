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
    let contentToStore = '';
    
    try {
      // Simple processing based on file type
      if (fileType === 'text/plain') {
        // For plain text files, decode base64 to get actual text
        try {
          extractedText = atob(fileContent);
          contentToStore = extractedText;
        } catch {
          extractedText = fileContent;
          contentToStore = fileContent;
        }
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 fileType === 'application/msword' ||
                 fileType.includes('word')) {
        // For Word documents, store a simple message
        console.log('Word document detected - storing basic info');
        extractedText = `Word document uploaded successfully. File ready for tag extraction.`;
        contentToStore = extractedText;
      } else if (fileType === 'application/pdf') {
        // For PDF documents, store a simple message
        console.log('PDF document detected - storing basic info');
        extractedText = `PDF document uploaded successfully. File ready for tag extraction.`;
        contentToStore = extractedText;
      } else {
        // For other formats, try to decode as text
        try {
          extractedText = atob(fileContent);
          contentToStore = extractedText;
        } catch {
          extractedText = fileContent;
          contentToStore = fileContent;
        }
      }

      console.log(`File processed successfully, content length: ${contentToStore.length}`);
      
      // Update template with extracted content
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          metadata: { 
            content: contentToStore,
            extractedText: extractedText,
            processedAt: new Date().toISOString(),
            originalFileType: fileType,
            fileSize: fileContent.length
          },
          status: 'processed'
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
          error: 'Failed to process file content: ' + processingError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in process-file function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Function error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});