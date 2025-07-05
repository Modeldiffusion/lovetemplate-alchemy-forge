import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Template {
  id: string;
  name: string;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  tags: string[] | null;
  metadata: Record<string, any>;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('templates')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      if (params?.limit) {
        const offset = params.page ? (params.page - 1) * params.limit : 0;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const uploadTemplate = async (templateData: {
    name: string;
    file_size: number;
    file_type: string;
    tags?: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .insert({
          name: templateData.name,
          file_size: templateData.file_size,
          file_type: templateData.file_type,
          tags: templateData.tags || [],
          status: 'uploaded' as const,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add the new template to the list
      setTemplates(prev => [data as Template, ...prev]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateTemplateStatus = async (id: string, status: Template['status']) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Update the template in the list
      setTemplates(prev => prev.map(template =>
        template.id === id ? { ...template, status } : template
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    uploadTemplate,
    updateTemplateStatus,
    deleteTemplate,
    refetch: fetchTemplates
  };
};