import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database utility functions
export class DatabaseService {
  
  // User Management
  static async createUser(data: {
    email: string;
    name: string;
    role?: 'ADMIN' | 'REVIEWER' | 'CONVERTER' | 'VIEWER';
  }) {
    return await prisma.user.create({
      data: {
        ...data,
        role: data.role || 'CONVERTER'
      }
    });
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        uploadedTemplates: true,
        tagMappings: true,
        conversions: true
      }
    });
  }

  // Template Management
  static async createTemplate(data: {
    name: string;
    originalName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedById: string;
  }) {
    return await prisma.template.create({
      data,
      include: {
        uploadedBy: true
      }
    });
  }

  static async getTemplates(filters?: {
    status?: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR' | 'ARCHIVED';
    uploadedById?: string;
    limit?: number;
    offset?: number;
  }) {
    return await prisma.template.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.uploadedById && { uploadedById: filters.uploadedById })
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        extractedTags: true,
        _count: {
          select: {
            extractedTags: true,
            conversions: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' },
      ...(filters?.limit && { take: filters.limit }),
      ...(filters?.offset && { skip: filters.offset })
    });
  }

  static async updateTemplateStatus(
    id: string, 
    status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR' | 'ARCHIVED',
    additionalData?: {
      aiProcessingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
      aiConfidence?: number;
      extractedText?: string;
      processingError?: string;
    }
  ) {
    return await prisma.template.update({
      where: { id },
      data: {
        status,
        ...(status === 'PROCESSED' && { processedAt: new Date() }),
        ...additionalData
      }
    });
  }

  // LLM Provider Management
  static async createLLMProvider(data: {
    name: string;
    provider: string;
    model: string;
    apiKeyHash: string;
    systemPrompt: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    return await prisma.lLMProvider.create({
      data: {
        ...data,
        maxTokens: data.maxTokens || 4096,
        temperature: data.temperature || 0.7
      }
    });
  }

  static async getLLMProviders(activeOnly = true) {
    return await prisma.lLMProvider.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateLLMProviderHealth(id: string, healthData: {
    healthStatus: 'EXCELLENT' | 'GOOD' | 'POOR' | 'ERROR';
    averageLatency?: number;
    lastUsedAt: Date;
  }) {
    return await prisma.lLMProvider.update({
      where: { id },
      data: healthData
    });
  }

  // Tag Management
  static async createExtractedTag(data: {
    templateId: string;
    text: string;
    pattern?: string;
    position: number;
    context?: string;
    confidence: number;
    providerId?: string;
  }) {
    return await prisma.extractedTag.create({
      data
    });
  }

  static async getExtractedTags(templateId?: string) {
    return await prisma.extractedTag.findMany({
      where: templateId ? { templateId } : {},
      include: {
        template: {
          select: { id: true, name: true }
        },
        provider: {
          select: { id: true, name: true }
        },
        mappings: {
          include: {
            internalTag: true
          }
        }
      },
      orderBy: { position: 'asc' }
    });
  }

  static async getInternalTags() {
    return await prisma.internalTag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
  }

  static async createInternalTag(data: {
    name: string;
    category: string;
    description?: string;
    dataType?: string;
    validation?: string;
  }) {
    return await prisma.internalTag.create({
      data: {
        ...data,
        dataType: data.dataType || 'string'
      }
    });
  }

  // Tag Mapping
  static async createTagMapping(data: {
    extractedTagId: string;
    internalTagId?: string;
    mappingLogic?: string;
    createdById: string;
    confidence?: number;
  }) {
    return await prisma.tagMapping.create({
      data: {
        ...data,
        status: data.internalTagId ? 'MAPPED' : (data.mappingLogic ? 'LOGIC' : 'UNMAPPED'),
        confidence: data.confidence || 50
      },
      include: {
        extractedTag: true,
        internalTag: true,
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async updateTagMapping(id: string, data: {
    internalTagId?: string;
    mappingLogic?: string;
    status?: 'UNMAPPED' | 'MAPPED' | 'LOGIC' | 'VALIDATED' | 'ERROR';
    confidence?: number;
    validationResult?: string;
  }) {
    return await prisma.tagMapping.update({
      where: { id },
      data,
      include: {
        extractedTag: true,
        internalTag: true
      }
    });
  }

  static async getTagMappings(templateId?: string) {
    return await prisma.tagMapping.findMany({
      where: templateId ? {
        extractedTag: {
          templateId
        }
      } : {},
      include: {
        extractedTag: {
          include: {
            template: {
              select: { id: true, name: true }
            }
          }
        },
        internalTag: true,
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Conversion Management
  static async createConversion(data: {
    templateId: string;
    createdById: string;
    preserveFormatting?: boolean;
    validateOutput?: boolean;
  }) {
    return await prisma.conversion.create({
      data: {
        ...data,
        preserveFormatting: data.preserveFormatting ?? true,
        validateOutput: data.validateOutput ?? true
      },
      include: {
        template: true,
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async updateConversionStatus(id: string, data: {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    outputFilePath?: string;
    errorMessage?: string;
    totalTags?: number;
    mappedTags?: number;
    unmappedTags?: number;
    processingTime?: number;
  }) {
    return await prisma.conversion.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'COMPLETED' && { completedAt: new Date() })
      }
    });
  }

  // Analytics and Metrics
  static async getSystemMetrics(date?: Date) {
    const targetDate = date || new Date();
    
    return await prisma.systemMetrics.findUnique({
      where: { date: targetDate }
    });
  }

  static async updateSystemMetrics(date: Date, metrics: {
    totalTemplates?: number;
    templatesProcessed?: number;
    templatesWithErrors?: number;
    aiRequestsCount?: number;
    aiSuccessRate?: number;
    averageConfidence?: number;
    conversionsCount?: number;
    conversionSuccessRate?: number;
    activeUsers?: number;
  }) {
    return await prisma.systemMetrics.upsert({
      where: { date },
      update: metrics,
      create: {
        date,
        ...metrics
      }
    });
  }

  // Audit Logging
  static async createAuditLog(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: string;
    newValues?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await prisma.auditLog.create({
      data
    });
  }

  // Cleanup and Maintenance
  static async cleanupOldAuditLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
  }

  static async getHealthStats() {
    const [
      totalTemplates,
      activeProviders,
      pendingConversions,
      totalMappings
    ] = await Promise.all([
      prisma.template.count(),
      prisma.lLMProvider.count({ where: { isActive: true } }),
      prisma.conversion.count({ where: { status: 'PENDING' } }),
      prisma.tagMapping.count()
    ]);

    return {
      totalTemplates,
      activeProviders,
      pendingConversions,
      totalMappings,
      timestamp: new Date()
    };
  }
}