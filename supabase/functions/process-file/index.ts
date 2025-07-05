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
    let contentToStore = fileContent; // Store base64 by default
    
    try {
      // Handle different file formats
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
        // For Word documents (.docx, .doc), store base64 for now
        // TODO: Implement proper document parsing using libraries like docx or mammoth
        console.log('Word document detected - storing as base64 for future processing');
        contentToStore = fileContent;
        extractedText = `[Word Document: ${fileType}] - Content stored as base64. Proper document parsing needed for text extraction.`;
      } else if (fileType === 'application/pdf') {
        // For PDF documents, store base64 for now
        // TODO: Implement proper PDF text extraction
        console.log('PDF document detected - storing as base64 for future processing');
        contentToStore = fileContent;
        extractedText = `[PDF Document] - Content stored as base64. Proper PDF parsing needed for text extraction.`;
      } else {
        // For other formats, try to decode as text if possible
        try {
          extractedText = atob(fileContent);
          contentToStore = extractedText;
        } catch {
          // If not base64, store as-is
          extractedText = fileContent;
          contentToStore = fileContent;
        }
      }

      console.log(`File type: ${fileType}`);
      console.log(`Extracted text preview: ${extractedText.substring(0, 100)}...`);
      console.log(`Content storage type: ${typeof contentToStore}`);
      
      // Update template with extracted content
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          metadata: { 
            content: contentToStore,
            extractedText: extractedText,
            processedAt: new Date().toISOString(),
            originalFileType: fileType,
            needsDocumentParsing: fileType.includes('word') || fileType.includes('pdf')
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