import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadedFieldFile {
  id: string;
  name: string;
  file_type: string;
  file_size: number | null;
  file_path: string | null;
  uploaded_at: string;
  uploaded_by: string;
  status: string;
}

export interface FieldName {
  id: string;
  file_id: string;
  field_name: string;
  position: number;
  created_at: string;
}

export const useUploadedFields = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFieldFile[]>([]);
  const [fieldNames, setFieldNames] = useState<FieldName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploadedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_field_files')
        .select('*')
        .eq('status', 'active')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uploaded files');
    }
  };

  const fetchFieldNames = async () => {
    try {
      const { data, error } = await supabase
        .from('field_names')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setFieldNames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch field names');
    }
  };

  const createUploadedFile = async (fileData: {
    name: string;
    file_type: string;
    file_size?: number;
    file_path?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('uploaded_field_files')
        .insert({
          ...fileData,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setUploadedFiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create uploaded file record');
      throw err;
    }
  };

  const createFieldNames = async (fileId: string, fieldNames: string[]) => {
    try {
      const fieldData = fieldNames.map((name, index) => ({
        file_id: fileId,
        field_name: name.trim(),
        position: index
      }));

      const { data, error } = await supabase
        .from('field_names')
        .insert(fieldData)
        .select();

      if (error) throw error;
      
      setFieldNames(prev => [...prev, ...(data || [])]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field names');
      throw err;
    }
  };

  const deleteUploadedFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_field_files')
        .update({ status: 'deleted' })
        .eq('id', fileId);

      if (error) throw error;
      
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      setFieldNames(prev => prev.filter(field => field.file_id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete uploaded file');
      throw err;
    }
  };

  const getAllFieldNames = () => {
    return Array.from(new Set(fieldNames.map(field => field.field_name))).sort();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchUploadedFiles(), fetchFieldNames()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    uploadedFiles,
    fieldNames,
    loading,
    error,
    createUploadedFile,
    createFieldNames,
    deleteUploadedFile,
    getAllFieldNames,
    refetch: () => {
      fetchUploadedFiles();
      fetchFieldNames();
    }
  };
};