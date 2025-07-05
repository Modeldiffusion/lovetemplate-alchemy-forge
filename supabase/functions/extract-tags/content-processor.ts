export interface ProcessedContent {
  content: string;
  source: 'metadata' | 'storage' | 'empty';
}

export class ContentProcessor {
  static async processTemplate(template: any, supabaseClient: any): Promise<ProcessedContent> {
    console.log('Step 5: Attempting to get template content...');
    
    let templateContent = '';
    let source: ProcessedContent['source'] = 'empty';
    
    // Check if template has actual content in metadata
    if (template.metadata && (template.metadata.content || template.metadata.extractedText)) {
      // Check if this is a PDF document that needs proper parsing
      if (template.metadata.needsDocumentParsing && template.metadata.originalFileType?.includes('pdf')) {
        throw new Error('PDF documents require proper parsing. Current extraction from PDF files is not supported. Please convert to plain text or implement PDF parsing.');
      }
      
      // Use extracted text if available, otherwise use content
      templateContent = template.metadata.extractedText || template.metadata.content;
      source = 'metadata';
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
          source = 'storage';
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

    console.log('Template content prepared, length:', templateContent.length);
    if (templateContent.length > 0) {
      console.log('Sample content preview:', templateContent.substring(0, 200) + '...');
    }

    return { content: templateContent, source };
  }
}