import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ExtractedTag {
  id: string;
  template_id: string;
  text: string;
  pattern: string | null;
  position: number;
  context: string | null;
  confidence: number;
  extracted_at: string;
  updated_at: string;
  extracted_by: string | null;
  template?: {
    id: string;
    name: string;
  };
}

export interface InternalTag {
  id: string;
  name: string;
  category: string;
  description: string | null;
  data_type: string;
  validation: string | null;
  is_required: boolean;
  default_value: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TagMapping {
  id: string;
  extracted_tag_id: string;
  internal_tag_id: string | null;
  mapping_logic: string | null;
  status: 'unmapped' | 'mapped' | 'logic' | 'validated' | 'error';
  confidence: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  extracted_tag?: ExtractedTag;
  internal_tag?: InternalTag;
}

export const useExtractedTags = (templateId?: string) => {
  const [extractedTags, setExtractedTags] = useState<ExtractedTag[]>([]);
  const [internalTags, setInternalTags] = useState<InternalTag[]>([]);
  const [tagMappings, setTagMappings] = useState<TagMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExtractedTags = async () => {
    try {
      let query = supabase
        .from('extracted_tags')
        .select(`
          *,
          template:templates(id, name)
        `)
        .order('position', { ascending: true });

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExtractedTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch extracted tags');
    }
  };

  const fetchInternalTags = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setInternalTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch internal tags');
    }
  };

  const fetchTagMappings = async () => {
    try {
      let query = supabase
        .from('tag_mappings')
        .select(`
          *,
          extracted_tag:extracted_tags(*),
          internal_tag:internal_tags(*)
        `);

      if (templateId) {
        query = query.eq('extracted_tags.template_id', templateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTagMappings((data as TagMapping[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tag mappings');
    }
  };

  const extractTags = async (templateId: string, extractionConfig?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('extract-tags', {
        body: { templateId, extractionConfig }
      });

      if (error) throw error;
      
      if (data.success) {
        await fetchExtractedTags();
        return data.data;
      } else {
        throw new Error(data.error || 'Tag extraction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tag extraction failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTagMapping = async (data: {
    extracted_tag_id: string;
    internal_tag_id?: string;
    mapping_logic?: string;
    confidence?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: mapping, error } = await supabase
        .from('tag_mappings')
        .insert({
          ...data,
          status: data.internal_tag_id ? 'mapped' : 'unmapped',
          created_by: user?.id
        })
        .select(`
          *,
          extracted_tag:extracted_tags(*),
          internal_tag:internal_tags(*)
        `)
        .single();

      if (error) throw error;
      
      setTagMappings(prev => [...prev, mapping as TagMapping]);
      return mapping;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag mapping');
      throw err;
    }
  };

  const updateTagMapping = async (id: string, updates: {
    internal_tag_id?: string;
    mapping_logic?: string;
    status?: string;
    confidence?: number;
  }) => {
    try {
      const { data: mapping, error } = await supabase
        .from('tag_mappings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          extracted_tag:extracted_tags(*),
          internal_tag:internal_tags(*)
        `)
        .single();

      if (error) throw error;
      
      setTagMappings(prev => prev.map(m => m.id === id ? mapping as TagMapping : m));
      return mapping;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag mapping');
      throw err;
    }
  };

  const createInternalTag = async (data: {
    name: string;
    category: string;
    description?: string;
    data_type?: string;
    validation?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: tag, error } = await supabase
        .from('internal_tags')
        .insert({
          ...data,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setInternalTags(prev => [...prev, tag]);
      return tag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create internal tag');
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchExtractedTags(),
        fetchInternalTags(),
        fetchTagMappings()
      ]);
      setLoading(false);
    };

    fetchData();
  }, [templateId]);

  return {
    extractedTags,
    internalTags,
    tagMappings,
    loading,
    error,
    extractTags,
    createTagMapping,
    updateTagMapping,
    createInternalTag,
    refetch: () => {
      fetchExtractedTags();
      fetchInternalTags();
      fetchTagMappings();
    }
  };
};