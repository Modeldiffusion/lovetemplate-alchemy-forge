import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Eye,
  History,
  ArrowRightLeft,
  Zap,
  FileDown,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { toast } from "sonner";

interface TemplateConversionData {
  id: string;
  name: string;
  totalTags: number;
  mappedTags: number;
  logicAppliedTags: number;
  unmappedTags: number;
  status: 'ready' | 'processing' | 'completed' | 'error';
  lastConverted?: string;
  convertedContent?: string;
}

interface ConversionResult {
  original: string;
  replacement: string;
  type: 'document-level' | 'field-mapping' | 'custom-mapping' | 'unchanged';
  replaced: boolean;
}

export const TemplateConversion = () => {
  const [conversionData, setConversionData] = useState<TemplateConversionData[]>([]);
  const [processingTemplates, setProcessingTemplates] = useState<Set<string>>(new Set());
  const [viewingTemplate, setViewingTemplate] = useState<{ id: string; name: string; content: string } | null>(null);
  const [conversionResults, setConversionResults] = useState<Map<string, ConversionResult[]>>(new Map());
  
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { extractedTags, tagMappings, internalTags } = useExtractedTags();

  // Calculate conversion data for each template
  useEffect(() => {
    const data: TemplateConversionData[] = templates.map(template => {
      const templateTags = extractedTags.filter(tag => tag.template_id === template.id);
      const totalTags = templateTags.length;

      let mappedTags = 0;
      let logicAppliedTags = 0;
      let unmappedTags = 0;

      templateTags.forEach(tag => {
        const mapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
        const uniqueMapping = internalTags.find(internal => 
          internal.name.toLowerCase() === tag.text.toLowerCase()
        );

        // Check for document level mapping
        const hasDocLevelMapping = mapping?.mapping_logic?.includes('DocLevel:');
        const docLevelValue = hasDocLevelMapping 
          ? mapping.mapping_logic.replace('DocLevel: ', '').trim() 
          : '';

        // Check for custom mapping
        let customValue = '';
        if (mapping?.mapping_logic) {
          if (mapping.mapping_logic.includes('Custom:') && !hasDocLevelMapping) {
            customValue = mapping.mapping_logic.replace('Custom: ', '').trim();
          } else if (mapping.mapping_logic.includes('Custom logic:')) {
            const customPart = mapping.mapping_logic.split('Custom logic:')[1];
            if (customPart) {
              customValue = customPart.replace(/^\s*\|\s*/, '').trim();
            }
          }
        }

        // Determine status
        const hasFieldMapping = mapping?.internal_tag_id || uniqueMapping;
        const hasCustomMapping = customValue !== '';
        const hasDocLevelMappingValue = docLevelValue !== '';

        if (hasDocLevelMappingValue || hasFieldMapping || hasCustomMapping) {
          mappedTags++;
          if (hasDocLevelMappingValue || hasCustomMapping) {
            logicAppliedTags++;
          }
        } else {
          unmappedTags++;
        }
      });

      return {
        id: template.id,
        name: template.name,
        totalTags,
        mappedTags,
        logicAppliedTags,
        unmappedTags,
        status: totalTags === 0 ? 'error' : (mappedTags === totalTags ? 'ready' : 'ready'),
        lastConverted: undefined
      };
    });

    setConversionData(data);
  }, [templates, extractedTags, tagMappings, internalTags]);

  const handleConversion = async (templateId: string) => {
    setProcessingTemplates(prev => new Set([...prev, templateId]));
    
    try {
      // Get template and its tags
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const templateTags = extractedTags.filter(tag => tag.template_id === templateId);
      
      // Process each tag according to the conversion logic
      const processedTags: ConversionResult[] = templateTags.map(tag => {
        const mapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
        
        console.log('Processing tag:', tag.text, 'mapping:', mapping);

        // Check for document level mapping first (highest priority)
        if (mapping?.mapping_logic?.includes('DocLevel:')) {
          const docLevelValue = mapping.mapping_logic.split('DocLevel:')[1]?.trim();
          if (docLevelValue) {
            return {
              original: tag.text,
              replacement: docLevelValue,
              type: 'document-level' as const,
              replaced: true
            };
          }
        }

        // Check for direct internal tag mapping (field mapping)
        if (mapping?.internal_tag_id) {
          const internalTag = internalTags.find(t => t.id === mapping.internal_tag_id);
          if (internalTag && internalTag.name) {
            return {
              original: tag.text,
              replacement: internalTag.name,
              type: 'field-mapping' as const,
              replaced: true
            };
          }
        }

        // Check for custom mapping logic
        if (mapping?.mapping_logic) {
          let customValue = '';
          
          // Handle different custom mapping formats
          if (mapping.mapping_logic.includes('Custom:') && !mapping.mapping_logic.includes('DocLevel:')) {
            customValue = mapping.mapping_logic.replace('Custom:', '').trim();
          } else if (mapping.mapping_logic.includes('Custom logic:')) {
            const parts = mapping.mapping_logic.split('Custom logic:');
            if (parts[1]) {
              customValue = parts[1].replace(/^\s*\|\s*/, '').trim();
            }
          } else if (mapping.mapping_logic.includes('Field mapped to:')) {
            // Extract field name from mapping logic
            const fieldPart = mapping.mapping_logic.replace('Field mapped to:', '').trim();
            if (fieldPart) {
              customValue = fieldPart;
            }
          }
          
          if (customValue && customValue !== '') {
            return {
              original: tag.text,
              replacement: customValue,
              type: 'custom-mapping' as const,
              replaced: true
            };
          }
        }

        // Check for unique field name matching (fallback)
        const uniqueMapping = internalTags.find(internal => 
          internal.name && internal.name.toLowerCase() === tag.text.toLowerCase()
        );
        
        if (uniqueMapping) {
          return {
            original: tag.text,
            replacement: uniqueMapping.name,
            type: 'field-mapping' as const,
            replaced: true
          };
        }

        // Retain original tag if no mapping found
        return {
          original: tag.text,
          replacement: tag.text,
          type: 'unchanged' as const,
          replaced: false
        };
      });

      // Simulate processing the actual template file content
      // In a real implementation, this would read the uploaded file from storage
      // and process the actual Word document while preserving formatting
      
      const originalContent = `Template: ${template.name}
File Type: ${template.file_type || 'Unknown'}
Original Size: ${template.file_size ? `${(template.file_size / 1024).toFixed(2)} KB` : 'Unknown'}

=== ORIGINAL CONTENT ===
${templateTags.map(tag => `${tag.text} (found at position ${tag.position}, context: "${tag.context || 'N/A'}")`).join('\n')}

=== CONVERSION MAPPING ===
${processedTags.map(tag => 
  `${tag.original} → ${tag.replaced ? `[BLUE HIGHLIGHT: ${tag.replacement}]` : tag.replacement} (${tag.type})`
).join('\n')}

=== NOTE ===
In production, this would process the actual uploaded ${template.file_type} file,
replace tags while preserving original formatting, fonts, and alignment,
and highlight replaced content in blue color.`;
      
      // Store conversion results
      setConversionResults(prev => new Map(prev.set(templateId, processedTags)));

      // Update conversion data with enhanced content
      setConversionData(prev => prev.map(item => 
        item.id === templateId 
          ? { 
              ...item, 
              status: 'completed', 
              lastConverted: new Date().toISOString(),
              convertedContent: originalContent
            }
          : item
      ));

      toast.success(`Template "${template.name}" converted! ${processedTags.filter(t => t.replaced).length} tags will be highlighted in blue when downloaded as Word document.`);
      
    } catch (error) {
      toast.error('Conversion failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setConversionData(prev => prev.map(item => 
        item.id === templateId 
          ? { ...item, status: 'error' }
          : item
      ));
    } finally {
      setProcessingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleDownloadMapping = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const templateTags = extractedTags.filter(tag => tag.template_id === templateId);
    
    const csvContent = [
      ['Tag Name', 'Mapping Type', 'Replacement Value', 'Status'],
      ...templateTags.map(tag => {
        const mapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
        const uniqueMapping = internalTags.find(internal => 
          internal.name.toLowerCase() === tag.text.toLowerCase()
        );

        let mappingType = 'Unchanged';
        let replacementValue = tag.text;

        const hasDocLevelMapping = mapping?.mapping_logic?.includes('DocLevel:');
        if (hasDocLevelMapping) {
          const docLevelValue = mapping.mapping_logic.replace('DocLevel: ', '').trim();
          if (docLevelValue) {
            mappingType = 'Document Level';
            replacementValue = docLevelValue;
          }
        } else if (mapping?.internal_tag_id || uniqueMapping) {
          const internalTag = internalTags.find(t => 
            t.id === mapping?.internal_tag_id || t.id === uniqueMapping?.id
          );
          if (internalTag) {
            mappingType = 'Field Mapping';
            replacementValue = internalTag.name;
          }
        } else if (mapping?.mapping_logic) {
          let customValue = '';
          if (mapping.mapping_logic.includes('Custom:')) {
            customValue = mapping.mapping_logic.replace('Custom: ', '').trim();
          } else if (mapping.mapping_logic.includes('Custom logic:')) {
            const customPart = mapping.mapping_logic.split('Custom logic:')[1];
            if (customPart) {
              customValue = customPart.replace(/^\s*\|\s*/, '').trim();
            }
          }
          
          if (customValue) {
            mappingType = 'Custom Mapping';
            replacementValue = customValue;
          }
        }

        return [
          tag.text,
          mappingType,
          replacementValue,
          replacementValue !== tag.text ? 'Mapped' : 'Unmapped'
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}-mapping.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const conversionResult = conversionData.find(c => c.id === templateId);
    
    if (!template) return;
    
    // Get template tags for content generation
    const templateTags = extractedTags.filter(tag => tag.template_id === templateId);
    const sampleContent = `Template: ${template.name}

Content Preview:
${templateTags.map(tag => `${tag.text} - Context: ${tag.context || 'No context available'}`).join('\n')}

${conversionResult?.convertedContent ? `\n--- CONVERTED VERSION ---\n${conversionResult.convertedContent}` : ''}

--- Template Metadata ---
File Type: ${template.file_type || 'Unknown'}
Size: ${template.file_size ? `${(template.file_size / 1024).toFixed(2)} KB` : 'Unknown'}
Uploaded: ${new Date(template.uploaded_at).toLocaleDateString()}
Status: ${template.status}`;

    setViewingTemplate({
      id: templateId,
      name: template.name,
      content: sampleContent
    });
  };

  const handleDownloadConverted = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const conversionResult = conversionData.find(c => c.id === templateId);
    const processedTags = conversionResults.get(templateId);
    
    if (!template || !conversionResult?.convertedContent || !processedTags) {
      toast.error('No converted content available');
      return;
    }

    // Generate HTML content that simulates a Word document with blue highlighting
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${template.name} - Converted</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
        .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .replaced-tag { color: #0066CC; font-weight: bold; background-color: #E6F3FF; padding: 2px; }
        .conversion-info { border: 1px solid #ccc; padding: 10px; margin: 20px 0; background-color: #f9f9f9; }
        .tag-mapping { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Converted Template: ${template.name}</h1>
        <p>Original File: ${template.file_type || 'Unknown'} | Size: ${template.file_size ? `${(template.file_size / 1024).toFixed(2)} KB` : 'Unknown'}</p>
        <p>Converted on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="conversion-info">
        <h3>Tag Conversion Summary</h3>
        <p><strong>Total Tags:</strong> ${processedTags.length}</p>
        <p><strong>Replaced Tags:</strong> ${processedTags.filter(t => t.replaced).length} (highlighted in blue)</p>
        <p><strong>Unchanged Tags:</strong> ${processedTags.filter(t => !t.replaced).length}</p>
    </div>

    <h3>Converted Content Preview</h3>
    <div class="content">
        ${processedTags.map(tag => `
            <div class="tag-mapping">
                Original: "${tag.original}" → 
                ${tag.replaced ? 
                  `<span class="replaced-tag">${tag.replacement}</span> (${tag.type})` : 
                  `"${tag.replacement}" (unchanged)`
                }
            </div>
        `).join('')}
    </div>

    <div style="margin-top: 30px; padding: 15px; border: 2px solid #ff9900; background-color: #fff8e1;">
        <h4>🔧 Production Implementation Required</h4>
        <p>To fully implement your requirements, the backend needs enhancement to:</p>
        <ul>
            <li>Read actual uploaded Word document files from storage</li>
            <li>Process documents using libraries like docx or mammoth.js</li>
            <li>Replace tags while preserving original formatting, fonts, and alignment</li>
            <li>Generate proper .docx files with blue highlighting for replaced tags</li>
            <li>Maintain document structure, headers, footers, tables, etc.</li>
        </ul>
        <p><strong>Current Status:</strong> This is a preview showing how the conversion would work. The actual Word document processing requires backend document manipulation capabilities.</p>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}-converted-preview.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Converted document preview downloaded. For actual Word document processing, backend enhancement is required.');
  };

  const handleUnmappedClick = (templateId: string) => {
    // Navigate to mapping interface with template field mapping tab and template selected
    navigate(`/mapping?tab=template-mapping&template=${templateId}`);
    toast.info('Navigating to template field mapping for this template');
  };

  const handleViewHistory = (templateId: string) => {
    // This would show audit trail
    toast.info('History viewer will be implemented');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Template Conversion</h2>
          <p className="text-sm text-muted-foreground">Convert templates by replacing tags with mapped values</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <div className="text-lg font-bold">{conversionData.length}</div>
                <p className="text-xs text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <div className="text-2xl font-bold">
                  {conversionData.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">
                  {conversionData.filter(t => t.status === 'ready').length}
                </div>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">
                  {conversionData.reduce((sum, t) => sum + t.mappedTags, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total Mapped Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Convert templates by replacing tags with their mapped values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Tag Count</TableHead>
                <TableHead>Mapped</TableHead>
                <TableHead>Logic Applied</TableHead>
                <TableHead>Unmapped</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversionData.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    {template.lastConverted && (
                      <div className="text-xs text-muted-foreground">
                        Last converted: {new Date(template.lastConverted).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {template.totalTags}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {template.mappedTags}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {template.logicAppliedTags}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={template.unmappedTags > 0 ? "destructive" : "secondary"} 
                      className={cn(
                        "font-mono",
                        template.unmappedTags > 0 && "cursor-pointer hover:bg-destructive/80"
                      )}
                      onClick={() => template.unmappedTags > 0 && handleUnmappedClick(template.id)}
                    >
                      {template.unmappedTags}
                      {template.unmappedTags > 0 && (
                        <ExternalLink className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      className={cn(
                        "text-xs",
                        template.status === 'completed' ? 'bg-primary text-primary-foreground' :
                        template.status === 'ready' ? 'bg-warning text-warning-foreground' :
                        template.status === 'processing' ? 'bg-accent text-accent-foreground' :
                        'bg-destructive text-destructive-foreground'
                      )}
                    >
                      {template.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {template.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {template.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleConversion(template.id)}
                        disabled={processingTemplates.has(template.id)}
                        className="bg-gradient-primary hover:shadow-glow"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        {processingTemplates.has(template.id) ? 'Converting...' : 'Convert'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadMapping(template.id)}
                        title="Download Mapping CSV"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {template.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadConverted(template.id)}
                          title="Download Converted Document"
                          className="bg-success/10 hover:bg-success/20"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTemplate(template.id)}
                        title="View Template"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistory(template.id)}
                        title="View History"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {conversionData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>No templates found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Viewer Dialog */}
      <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Template Viewer: {viewingTemplate?.name}</DialogTitle>
            <DialogDescription>
              View template content and converted version
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-mono">
              {viewingTemplate?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};