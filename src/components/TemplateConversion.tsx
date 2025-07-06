import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Eye,
  History,
  ArrowRightLeft,
  Zap
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
}

export const TemplateConversion = () => {
  const [conversionData, setConversionData] = useState<TemplateConversionData[]>([]);
  const [processingTemplates, setProcessingTemplates] = useState<Set<string>>(new Set());
  
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
      const processedTags = templateTags.map(tag => {
        const mapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
        const uniqueMapping = internalTags.find(internal => 
          internal.name.toLowerCase() === tag.text.toLowerCase()
        );

        // Check for document level mapping first
        const hasDocLevelMapping = mapping?.mapping_logic?.includes('DocLevel:');
        if (hasDocLevelMapping) {
          const docLevelValue = mapping.mapping_logic.replace('DocLevel: ', '').trim();
          if (docLevelValue) {
            return {
              original: tag.text,
              replacement: docLevelValue,
              type: 'document-level',
              replaced: true
            };
          }
        }

        // Check for unique tag library mapping
        if (mapping?.internal_tag_id || uniqueMapping) {
          const internalTag = internalTags.find(t => 
            t.id === mapping?.internal_tag_id || t.id === uniqueMapping?.id
          );
          
          if (internalTag) {
            return {
              original: tag.text,
              replacement: internalTag.name,
              type: 'field-mapping',
              replaced: true
            };
          }
        }

        // Check for custom mapping
        if (mapping?.mapping_logic) {
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
            return {
              original: tag.text,
              replacement: customValue,
              type: 'custom-mapping',
              replaced: true
            };
          }
        }

        // Retain original tag
        return {
          original: tag.text,
          replacement: tag.text,
          type: 'unchanged',
          replaced: false
        };
      });

      // Update conversion data
      setConversionData(prev => prev.map(item => 
        item.id === templateId 
          ? { ...item, status: 'completed', lastConverted: new Date().toISOString() }
          : item
      ));

      toast.success(`Template "${template.name}" converted successfully! ${processedTags.filter(t => t.replaced).length} tags replaced.`);
      
      // Here you would typically save the converted template to the backend
      console.log('Conversion results:', processedTags);
      
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
    // This would open the template in a new window/tab
    toast.info('Template viewer will be implemented');
  };

  const handleViewHistory = (templateId: string) => {
    // This would show audit trail
    toast.info('History viewer will be implemented');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Template Conversion</h2>
          <p className="text-muted-foreground">Convert templates by replacing tags with mapped values</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{conversionData.length}</div>
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
                      className="font-mono"
                    >
                      {template.unmappedTags}
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
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTemplate(template.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistory(template.id)}
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
    </div>
  );
};