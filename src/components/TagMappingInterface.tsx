import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Plus,
  Save,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "sonner";

interface TemplateTagMapping {
  id: string;
  tagName: string;
  mappingType: 'unique' | 'document';
  mappingField?: string;
  customMapping?: string;
  customMappingDocLevel?: string;
  mappingStatus: 'mapped' | 'unmapped' | 'error';
  isActive: boolean;
  templateId: string;
  extractedTagId?: string;
}

export const TagMappingInterface = () => {
  const [selectedDocument, setSelectedDocument] = useState<string>("all");
  const [templateMappings, setTemplateMappings] = useState<TemplateTagMapping[]>([]);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagType, setNewTagType] = useState<string>("unique");
  
  const { templates } = useTemplates();
  const { 
    extractedTags, 
    internalTags, 
    tagMappings,
    createTagMapping,
    updateTagMapping,
  } = useExtractedTags(selectedDocument === "all" ? undefined : selectedDocument);

  // Initialize template mappings from extracted tags
  useEffect(() => {
    const mappings: TemplateTagMapping[] = extractedTags.map(tag => {
      const existingMapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
      const uniqueMapping = internalTags.find(internal => 
        internal.name.toLowerCase() === tag.text.toLowerCase()
      );
      
      // Check for document level mapping
      const hasDocLevelMapping = existingMapping?.mapping_logic?.includes('DocLevel:');
      const docLevelValue = hasDocLevelMapping 
        ? existingMapping.mapping_logic.replace('DocLevel: ', '') 
        : '';
      
      // Check for custom mapping (both from existing mappings and unique library)
      let customValue = '';
      if (existingMapping?.mapping_logic) {
        // First check if there's a direct custom mapping
        if (existingMapping.mapping_logic.includes('Custom:') && !hasDocLevelMapping) {
          customValue = existingMapping.mapping_logic.replace('Custom: ', '');
        }
        // Also check for custom logic pattern from unique tag mapping
        else if (existingMapping.mapping_logic.includes('Custom logic:')) {
          const customPart = existingMapping.mapping_logic.split('Custom logic:')[1];
          if (customPart) {
            customValue = customPart.replace(/^\s*\|\s*/, '').trim();
          }
        }
      }
      
      // If no direct custom mapping found, check if unique mapping exists with custom logic
      if (!customValue && uniqueMapping) {
        // Look for existing mapping in tag_mappings that might have custom logic for this internal tag
        const uniqueTagMapping = tagMappings.find(m => m.internal_tag_id === uniqueMapping.id);
        if (uniqueTagMapping?.mapping_logic && uniqueTagMapping.mapping_logic.includes('Custom logic:')) {
          const customPart = uniqueTagMapping.mapping_logic.split('Custom logic:')[1];
          if (customPart) {
            customValue = customPart.replace(/^\s*\|\s*/, '').trim();
          }
        }
      }
      
      // Determine mapping type: default to 'unique', but switch to 'document' if doc level mapping exists
      const mappingType = hasDocLevelMapping ? 'document' : 'unique';
      
      // Determine effective mapping field and status based on precedence
      let effectiveMappingField = '';
      let mappingStatus: 'mapped' | 'unmapped' | 'error' = 'unmapped';
      
      if (hasDocLevelMapping && docLevelValue) {
        // Document level mapping has highest precedence
        mappingStatus = 'mapped';
      } else if (existingMapping?.internal_tag_id) {
        // Direct internal tag mapping
        effectiveMappingField = existingMapping.internal_tag_id;
        mappingStatus = 'mapped';
      } else if (uniqueMapping) {
        // Fallback to unique tag library mapping
        effectiveMappingField = uniqueMapping.id;
        mappingStatus = 'mapped';
      }
      
      // If there's custom mapping but no other mapping, still consider it mapped
      if (!mappingStatus && customValue) {
        mappingStatus = 'mapped';
      }
      
      console.log(`Tag ${tag.text}:`, {
        existingMapping: existingMapping?.mapping_logic,
        uniqueMapping: uniqueMapping?.name,
        customValue,
        effectiveMappingField,
        mappingStatus
      });
      
      return {
        id: tag.id,
        tagName: tag.text,
        mappingType: mappingType,
        mappingField: effectiveMappingField,
        customMapping: customValue,
        customMappingDocLevel: docLevelValue,
        mappingStatus: mappingStatus,
        isActive: true,
        templateId: tag.template_id,
        extractedTagId: tag.id
      };
    });
    
    setTemplateMappings(mappings);
  }, [extractedTags, tagMappings, internalTags]);

  const filteredMappings = templateMappings.filter(mapping => {
    if (selectedDocument === "all") return true;
    return mapping.templateId === selectedDocument;
  });

  const handleMappingTypeChange = (mappingId: string, type: 'unique' | 'document') => {
    setTemplateMappings(prev => 
      prev.map(mapping => {
        if (mapping.id === mappingId) {
          const uniqueMapping = internalTags.find(internal => 
            internal.name.toLowerCase() === mapping.tagName.toLowerCase()
          );
          
          return {
            ...mapping,
            mappingType: type,
            mappingField: type === 'unique' ? uniqueMapping?.id : undefined,
            mappingStatus: type === 'unique' && uniqueMapping ? 'mapped' : 'unmapped'
          };
        }
        return mapping;
      })
    );
  };

  const handleMappingFieldChange = (mappingId: string, fieldId: string) => {
    setTemplateMappings(prev => 
      prev.map(mapping => 
        mapping.id === mappingId 
          ? { ...mapping, mappingField: fieldId, mappingStatus: 'mapped' }
          : mapping
      )
    );
  };

  const handleCustomMappingChange = (mappingId: string, customValue: string, isDocLevel: boolean = false) => {
    setTemplateMappings(prev => 
      prev.map(mapping => {
        if (mapping.id === mappingId) {
          const updates: Partial<TemplateTagMapping> = {
            [isDocLevel ? 'customMappingDocLevel' : 'customMapping']: customValue,
          };
          
          // If document level mapping is provided, automatically switch to document type
          if (isDocLevel && customValue.trim()) {
            updates.mappingType = 'document';
            updates.mappingStatus = 'mapped';
          } else if (isDocLevel && !customValue.trim()) {
            // If document level mapping is cleared, revert to unique type and check for unique mapping
            const uniqueMapping = internalTags.find(internal => 
              internal.name.toLowerCase() === mapping.tagName.toLowerCase()
            );
            updates.mappingType = 'unique';
            updates.mappingField = uniqueMapping?.id;
            updates.mappingStatus = uniqueMapping ? 'mapped' : (mapping.customMapping ? 'mapped' : 'unmapped');
          } else {
            // Regular custom mapping
            updates.mappingStatus = customValue ? 'mapped' : 'unmapped';
          }
          
          return { ...mapping, ...updates };
        }
        return mapping;
      })
    );
  };

  const handleActiveToggle = (mappingId: string) => {
    setTemplateMappings(prev => 
      prev.map(mapping => 
        mapping.id === mappingId 
          ? { ...mapping, isActive: !mapping.isActive }
          : mapping
      )
    );
  };

  const handleAddManualTag = () => {
    if (!newTagName.trim()) return;
    
    const newMapping: TemplateTagMapping = {
      id: `manual-${Date.now()}`,
      tagName: newTagName,
      mappingType: newTagType as 'unique' | 'document',
      mappingField: undefined,
      customMapping: '',
      customMappingDocLevel: '',
      mappingStatus: 'unmapped',
      isActive: true,
      templateId: selectedDocument === "all" ? templates[0]?.id || '' : selectedDocument
    };
    
    setTemplateMappings(prev => [...prev, newMapping]);
    setNewTagName("");
    setShowAddTagDialog(false);
    toast.success("Manual tag added successfully");
  };

  const handleSaveMappings = async () => {
    try {
      for (const mapping of templateMappings) {
        if (mapping.extractedTagId) {
          const existing = tagMappings.find(m => m.extracted_tag_id === mapping.extractedTagId);
          
          const updates = {
            internal_tag_id: mapping.mappingField,
            mapping_logic: mapping.customMapping ? `Custom: ${mapping.customMapping}` : 
                          mapping.customMappingDocLevel ? `DocLevel: ${mapping.customMappingDocLevel}` : null,
            status: mapping.mappingStatus
          };
          
          if (existing) {
            await updateTagMapping(existing.id, updates);
          } else if (mapping.mappingField || mapping.customMapping || mapping.customMappingDocLevel) {
            await createTagMapping({
              extracted_tag_id: mapping.extractedTagId,
              internal_tag_id: mapping.mappingField,
              mapping_logic: updates.mapping_logic,
              confidence: 80
            });
          }
        }
      }
      toast.success("Mappings saved successfully");
    } catch (error) {
      toast.error("Failed to save mappings");
    }
  };

  const handleDownloadMappings = () => {
    const csvContent = [
      ['Tag Name', 'Mapping Type', 'Mapping Field', 'Custom Mapping', 'Custom Mapping - Document Level', 'Status', 'Active'],
      ...filteredMappings.map(mapping => [
        mapping.tagName,
        mapping.mappingType,
        mapping.mappingField ? internalTags.find(t => t.id === mapping.mappingField)?.name || '' : '',
        mapping.customMapping || '',
        mapping.customMappingDocLevel || '',
        mapping.mappingStatus,
        mapping.isActive ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-field-mappings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Template Field Mapping</h2>
          <p className="text-muted-foreground">Map template fields to internal tags with unique library or document-level mappings</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadMappings}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={() => setShowAddTagDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
          <Button onClick={handleSaveMappings} className="bg-gradient-primary hover:shadow-glow">
            <Save className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>

      {/* Document Selection */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Label className="text-sm font-medium">Select Document:</Label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents ({templateMappings.length} tags)</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({templateMappings.filter(m => m.templateId === template.id).length} tags)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{filteredMappings.length}</div>
                <p className="text-xs text-muted-foreground">Total Tags</p>
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
                  {filteredMappings.filter(m => m.mappingStatus === 'mapped').length}
                </div>
                <p className="text-xs text-muted-foreground">Mapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredMappings.filter(m => m.mappingStatus === 'unmapped').length}
                </div>
                <p className="text-xs text-muted-foreground">Unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredMappings.filter(m => m.mappingType === 'unique').length}
                </div>
                <p className="text-xs text-muted-foreground">Unique Library</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredMappings.filter(m => m.mappingType === 'document').length}
                </div>
                <p className="text-xs text-muted-foreground">Document Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Table */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
          <CardDescription>
            Configure how template fields map to internal tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Name</TableHead>
                <TableHead>Type of Mapping</TableHead>
                <TableHead>Mapping Field</TableHead>
                <TableHead>Custom Mapping</TableHead>
                <TableHead>Custom Mapping - Document Level</TableHead>
                <TableHead>Mapping Status</TableHead>
                <TableHead>Active / Inactive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {mapping.tagName}
                    </code>
                  </TableCell>
                  
                  <TableCell>
                    <Select 
                      value={mapping.mappingType} 
                      onValueChange={(value: 'unique' | 'document') => 
                        handleMappingTypeChange(mapping.id, value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unique">Unique Tag Library</SelectItem>
                        <SelectItem value="document">Document Level Mapping</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select 
                      value={mapping.mappingField || ""} 
                      onValueChange={(value) => handleMappingFieldChange(mapping.id, value)}
                      disabled={mapping.mappingType === 'document'}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {internalTags.map(tag => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name} ({tag.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Input
                      placeholder="Custom mapping..."
                      value={mapping.customMapping || ''}
                      onChange={(e) => handleCustomMappingChange(mapping.id, e.target.value)}
                      className="w-48"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Input
                      placeholder="Document level mapping..."
                      value={mapping.customMappingDocLevel || ''}
                      onChange={(e) => handleCustomMappingChange(mapping.id, e.target.value, true)}
                      className="w-48"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      className={cn(
                        "text-xs",
                        mapping.mappingStatus === 'mapped' ? 'bg-primary text-primary-foreground' :
                        mapping.mappingStatus === 'error' ? 'bg-destructive text-destructive-foreground' :
                        'bg-warning text-warning-foreground'
                      )}
                    >
                      {mapping.mappingStatus === 'mapped' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {mapping.mappingStatus === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {mapping.mappingStatus}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Checkbox
                      checked={mapping.isActive}
                      onCheckedChange={() => handleActiveToggle(mapping.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMappings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>No tags found for the selected document</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Tag Dialog */}
      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Tag</DialogTitle>
            <DialogDescription>
              Add a new tag manually to the current template mapping
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mapping Type</Label>
              <Select value={newTagType} onValueChange={setNewTagType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unique">Unique Tag Library</SelectItem>
                  <SelectItem value="document">Document Level Mapping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddManualTag}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};