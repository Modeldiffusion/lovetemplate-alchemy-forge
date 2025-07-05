import { useState, useEffect } from 'react';
import { templateApi, Template } from '@/lib/api-client';

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
      const response = await templateApi.getAll(params);
      if (response.success && response.data) {
        setTemplates(response.data.items);
      } else {
        setError(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const uploadTemplate = async (file: File, metadata?: { name?: string; description?: string }) => {
    try {
      const response = await templateApi.upload(file, metadata);
      if (response.success) {
        await fetchTemplates(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await templateApi.delete(id);
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error(response.error || 'Delete failed');
      }
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
    deleteTemplate,
    refreshTemplates: fetchTemplates
  };
};