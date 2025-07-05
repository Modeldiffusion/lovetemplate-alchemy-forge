// API Client for Template Conversion Tool
// Handles all API communications with proper error handling and type safety

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}>;

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API client with error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'API request failed', data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Template Management API
export const templateApi = {
  // Upload template file
  async upload(file: File, metadata?: { name?: string; description?: string }) {
    const formData = new FormData();
    formData.append('template', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return apiCall<{
      id: string;
      name: string;
      status: string;
      uploadedAt: string;
    }>('/templates/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
  },

  // Get templates with pagination and filters
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Template>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/templates?${queryParams.toString()}`);
  },

  // Get single template
  async getById(id: string) {
    return apiCall<Template>(`/templates/${id}`);
  },

  // Delete template
  async delete(id: string) {
    return apiCall(`/templates/${id}`, { method: 'DELETE' });
  },

  // Update template status
  async updateStatus(id: string, status: string) {
    return apiCall(`/templates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

// AI Configuration API
export const aiApi = {
  // Get all LLM providers
  async getProviders() {
    return apiCall<LLMProvider[]>('/ai/providers');
  },

  // Create new LLM provider
  async createProvider(data: {
    name: string;
    provider: string;
    model: string;
    apiKey: string;
    systemPrompt: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    return apiCall<LLMProvider>('/ai/providers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update LLM provider
  async updateProvider(id: string, data: Partial<LLMProvider>) {
    return apiCall<LLMProvider>(`/ai/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Test LLM provider connection
  async testProvider(id: string, testInput?: string) {
    return apiCall<{
      success: boolean;
      responseTime: number;
      output?: string;
      error?: string;
    }>(`/ai/providers/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ testInput })
    });
  },

  // Extract tags from template using AI
  async extractTags(templateId: string, providerId?: string) {
    return apiCall<{
      tags: ExtractedTag[];
      confidence: number;
      processingTime: number;
    }>('/ai/extract-tags', {
      method: 'POST',
      body: JSON.stringify({ templateId, providerId })
    });
  }
};

// Tag Management API  
export const tagApi = {
  // Get extracted tags
  async getExtractedTags(templateId?: string) {
    const query = templateId ? `?templateId=${templateId}` : '';
    return apiCall<ExtractedTag[]>(`/tags/extracted${query}`);
  },

  // Get internal tags
  async getInternalTags() {
    return apiCall<InternalTag[]>('/tags/internal');
  },

  // Create internal tag
  async createInternalTag(data: {
    name: string;
    category: string;
    description?: string;
    dataType?: string;
    validation?: string;
  }) {
    return apiCall<InternalTag>('/tags/internal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get tag mappings
  async getMappings(templateId?: string) {
    const query = templateId ? `?templateId=${templateId}` : '';
    return apiCall<TagMapping[]>(`/tags/mappings${query}`);
  },

  // Create tag mapping
  async createMapping(data: {
    extractedTagId: string;
    internalTagId?: string;
    mappingLogic?: string;
    confidence?: number;
  }) {
    return apiCall<TagMapping>('/tags/mappings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update tag mapping
  async updateMapping(id: string, data: {
    internalTagId?: string;
    mappingLogic?: string;
    status?: string;
    confidence?: number;
  }) {
    return apiCall<TagMapping>(`/tags/mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Bulk map tags using AI
  async bulkMapTags(extractedTagIds: string[]) {
    return apiCall<{
      mappings: TagMapping[];
      successCount: number;
      failureCount: number;
    }>('/tags/mappings/bulk', {
      method: 'POST',
      body: JSON.stringify({ extractedTagIds })
    });
  },

  // Validate mappings
  async validateMappings(mappingIds: string[]) {
    return apiCall<{
      results: Array<{
        id: string;
        isValid: boolean;
        error?: string;
      }>;
    }>('/tags/mappings/validate', {
      method: 'POST',
      body: JSON.stringify({ mappingIds })
    });
  }
};

// Conversion API
export const conversionApi = {
  // Create new conversion job
  async create(data: {
    templateId: string;
    preserveFormatting?: boolean;
    validateOutput?: boolean;
  }) {
    return apiCall<Conversion>('/conversions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get conversions
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Conversion>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    return apiCall(`/conversions?${queryParams.toString()}`);
  },

  // Get single conversion
  async getById(id: string) {
    return apiCall<Conversion>(`/conversions/${id}`);
  },

  // Cancel conversion
  async cancel(id: string) {
    return apiCall(`/conversions/${id}/cancel`, { method: 'POST' });
  },

  // Download converted file
  async download(id: string) {
    const response = await fetch(`${API_BASE_URL}/conversions/${id}/download`);
    if (!response.ok) {
      throw new Error('Download failed');
    }
    return response.blob();
  }
};

// Document Comparison API
export const comparisonApi = {
  // Create document comparison
  async create(data: {
    originalFileId: string;
    convertedFileId: string;
  }) {
    return apiCall<DocumentComparison>('/comparisons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get comparison results
  async getById(id: string) {
    return apiCall<DocumentComparison>(`/comparisons/${id}`);
  },

  // Add comment to comparison
  async addComment(comparisonId: string, data: {
    lineNumber: number;
    content: string;
  }) {
    return apiCall<Comment>(`/comparisons/${comparisonId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Resolve comment
  async resolveComment(commentId: string) {
    return apiCall(`/comparisons/comments/${commentId}/resolve`, {
      method: 'POST'
    });
  },

  // Export comparison report
  async exportReport(id: string, format: 'pdf' | 'excel' = 'pdf') {
    const response = await fetch(`${API_BASE_URL}/comparisons/${id}/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  }
};

// Review and Workflow API
export const reviewApi = {
  // Get reviews for current user
  async getAll(params?: {
    status?: string;
    assignedToMe?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.assignedToMe) queryParams.append('assignedToMe', 'true');

    return apiCall<Review[]>(`/reviews?${queryParams.toString()}`);
  },

  // Submit review
  async submit(id: string, data: {
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
    feedback?: string;
  }) {
    return apiCall<Review>(`/reviews/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Assign review
  async assign(conversionId: string, reviewerId: string, dueDate?: string) {
    return apiCall<Review>('/reviews/assign', {
      method: 'POST',
      body: JSON.stringify({ conversionId, reviewerId, dueDate })
    });
  }
};

// Analytics API
export const analyticsApi = {
  // Get dashboard metrics
  async getDashboardMetrics() {
    return apiCall<{
      totalTemplates: number;
      pendingReview: number;
      conversionRate: number;
      avgProcessingTime: string;
      activeUsers: number;
      aiProcessingJobs: number;
    }>('/analytics/dashboard');
  },

  // Get system health
  async getSystemHealth() {
    return apiCall<{
      totalTemplates: number;
      activeProviders: number;
      pendingConversions: number;
      totalMappings: number;
      timestamp: string;
    }>('/analytics/health');
  },

  // Get usage statistics
  async getUsageStats(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'day' | 'week' | 'month';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.granularity) queryParams.append('granularity', params.granularity);

    return apiCall(`/analytics/usage?${queryParams.toString()}`);
  }
};

// Type definitions for API responses
export interface Template {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  processedAt?: string;
  aiProcessingStatus: string;
  aiConfidence?: number;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  extractedTags?: ExtractedTag[];
  _count?: {
    extractedTags: number;
    conversions: number;
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  isActive: boolean;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  rateLimitRPM: number;
  healthStatus: string;
  totalRequests: number;
  averageLatency?: number;
  lastUsedAt?: string;
}

export interface ExtractedTag {
  id: string;
  templateId: string;
  text: string;
  pattern?: string;
  position: number;
  context?: string;
  confidence: number;
  extractedAt: string;
  template?: {
    id: string;
    name: string;
  };
  provider?: {
    id: string;
    name: string;
  };
  mappings?: TagMapping[];
}

export interface InternalTag {
  id: string;
  name: string;
  category: string;
  description?: string;
  dataType: string;
  validation?: string;
  isRequired: boolean;
  defaultValue?: string;
}

export interface TagMapping {
  id: string;
  extractedTagId: string;
  internalTagId?: string;
  mappingLogic?: string;
  status: string;
  confidence: number;
  validationResult?: string;
  createdAt: string;
  updatedAt: string;
  extractedTag?: ExtractedTag;
  internalTag?: InternalTag;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface Conversion {
  id: string;
  templateId: string;
  status: string;
  outputFilePath?: string;
  errorMessage?: string;
  totalTags: number;
  mappedTags: number;
  unmappedTags: number;
  processingTime?: number;
  createdAt: string;
  completedAt?: string;
  template?: Template;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface DocumentComparison {
  id: string;
  conversionId: string;
  originalFilePath: string;
  convertedFilePath: string;
  comparisonData: string;
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  createdAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  comparisonId: string;
  lineNumber: number;
  content: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  author: {
    id: string;
    name: string;
  };
}

export interface Review {
  id: string;
  conversionId: string;
  reviewerId: string;
  status: string;
  feedback?: string;
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  conversion?: Conversion;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}