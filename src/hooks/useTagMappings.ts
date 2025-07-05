import { useState, useEffect } from 'react';
import { tagApi, TagMapping, ExtractedTag, InternalTag } from '@/lib/api-client';

export const useTagMappings = (templateId?: string) => {
  const [mappings, setMappings] = useState<TagMapping[]>([]);
  const [extractedTags, setExtractedTags] = useState<ExtractedTag[]>([]);
  const [internalTags, setInternalTags] = useState<InternalTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mappingsRes, extractedRes, internalRes] = await Promise.all([
        tagApi.getMappings(templateId),
        tagApi.getExtractedTags(templateId),
        tagApi.getInternalTags()
      ]);

      if (mappingsRes.success && mappingsRes.data) {
        setMappings(mappingsRes.data);
      }
      if (extractedRes.success && extractedRes.data) {
        setExtractedTags(extractedRes.data);
      }
      if (internalRes.success && internalRes.data) {
        setInternalTags(internalRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async (data: {
    extractedTagId: string;
    internalTagId?: string;
    mappingLogic?: string;
    confidence?: number;
  }) => {
    try {
      const response = await tagApi.createMapping(data);
      if (response.success && response.data) {
        setMappings(prev => [...prev, response.data!]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create mapping');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping');
      throw err;
    }
  };

  const updateMapping = async (id: string, data: {
    internalTagId?: string;
    mappingLogic?: string;
    status?: string;
    confidence?: number;
  }) => {
    try {
      const response = await tagApi.updateMapping(id, data);
      if (response.success && response.data) {
        setMappings(prev => prev.map(m => m.id === id ? response.data! : m));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update mapping');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mapping');
      throw err;
    }
  };

  const bulkMapTags = async (extractedTagIds: string[]) => {
    try {
      const response = await tagApi.bulkMapTags(extractedTagIds);
      if (response.success && response.data) {
        await fetchData(); // Refresh all data
        return response.data;
      } else {
        throw new Error(response.error || 'Bulk mapping failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk mapping failed');
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [templateId]);

  return {
    mappings,
    extractedTags,
    internalTags,
    loading,
    error,
    createMapping,
    updateMapping,
    bulkMapTags,
    refreshData: fetchData
  };
};