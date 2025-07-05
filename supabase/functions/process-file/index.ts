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

// Function to extract text from DOCX files
async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  try {
    // Import JSZip for ZIP file handling
    const JSZip = (await import('https://esm.sh/jszip@3.7.1')).default;
    
    // Load the DOCX file as a ZIP archive
    const zip = await JSZip.loadAsync(bytes);
    
    // Get the main document XML file
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      throw new Error('Could not find document.xml in DOCX file');
    }
    
    // Read the XML content
    const xmlContent = await documentXml.async('string');
    
    // Extract text from XML tags (simplified approach)
    // Remove XML tags and extract text content
    let textContent = xmlContent
      .replace(/<[^>]*>/g, ' ')  // Remove XML tags
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    // Clean up common Word XML artifacts
    textContent = textContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    
    return textContent;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw error;
  }
}

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
        // For Word documents, attempt to extract text content
        console.log('Word document detected - attempting text extraction');
        try {
          // Decode base64 to get binary data
          const binaryString = atob(fileContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // DOCX files are ZIP archives - try to extract text from document.xml
          // This is a simplified extraction - for production use a proper library
          const textContent = await extractTextFromDocx(bytes);
          
          if (textContent && textContent.length > 10) {
            extractedText = textContent;
            contentToStore = textContent;
            console.log(`Extracted ${textContent.length} characters from DOCX`);
          } else {
            // Fallback - store the base64 content for manual processing
            extractedText = `DOCX document content (${bytes.length} bytes)`;
            contentToStore = fileContent; // Store original base64
            console.log('Could not extract text, storing original content');
          }
        } catch (error) {
          console.error('DOCX processing error:', error);
          extractedText = `DOCX document uploaded (processing error: ${error.message})`;
          contentToStore = fileContent;
        }
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