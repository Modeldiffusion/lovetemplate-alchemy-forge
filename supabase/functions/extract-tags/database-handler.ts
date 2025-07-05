import type { ExtractedTagResult } from './tag-extractor.ts';

export class DatabaseHandler {
  static async insertExtractedTags(
    supabaseClient: any,
    templateId: string,
    extractedTags: ExtractedTagResult[],
    userId: string
  ) {
    console.log('Step 9: Preparing tags for database insertion...');
    const tagsToInsert = extractedTags.map((tag) => ({
      template_id: templateId,
      text: tag.text,
      pattern: tag.pattern,
      position: tag.position,
      context: tag.context,
      confidence: tag.confidence,
      extracted_by: userId
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
      throw new Error(`Failed to store extracted tags: ${insertError.message}`);
    }

    console.log('✅ Successfully inserted tags:', insertedTags?.length);
    return insertedTags;
  }

  static async updateTemplateStatus(supabaseClient: any, templateId: string) {
    console.log('Step 11: Updating template status...');
    const { error: updateError } = await supabaseClient
      .from('templates')
      .update({ status: 'completed' })
      .eq('id', templateId);
      
    if (updateError) {
      console.log('⚠️ Template update warning:', updateError.message);
      // Don't throw here as the main operation succeeded
    }
  }

  static async getTemplate(supabaseClient: any, templateId: string) {
    console.log('Step 4: Fetching template details...');
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      throw new Error(`Template fetch failed: ${templateError.message}`);
    }

    if (!template) {
      throw new Error('Template not found');
    }

    console.log('✅ Template found:', template.name);
    return template;
  }

  static async getUser(supabaseClient: any) {
    console.log('Step 8: Getting user context...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    console.log('✅ User authenticated:', user?.id);
    return user;
  }
}