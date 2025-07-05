export interface ValidatedRequest {
  templateId: string;
  extractionConfig?: any;
}

export class RequestValidator {
  static async validateRequest(request: Request): Promise<ValidatedRequest> {
    console.log('Step 1: Parsing request...');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { templateId, extractionConfig } = body;
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    console.log('✅ Template ID:', templateId);
    console.log('✅ Extraction Config:', extractionConfig);

    return { templateId, extractionConfig };
  }

  static validateEnvironment() {
    console.log('Step 2: Checking environment...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.log('OPENAI_API_KEY:', openaiKey ? '✅ Set' : '❌ Missing');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    return { supabaseUrl, supabaseKey, openaiKey };
  }
}