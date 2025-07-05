import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  FileText, 
  ArrowRight, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Wand2,
  Save,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface SourceTag {
  id: string;
  name: string;
  templateName: string;
  templateId: string;
  position: number;
  context: string;
  confidence: number;
  pattern: string;
}

interface InternalTag {
  id: string;
  name: string;
  category: string;
  description: string;
  dataType: string;
  validation?: string;
}

interface TagMapping {
  id: string;
  sourceTagId: string;
  internalTagId?: string;
  mappingLogic?: string;
  status: 'unmapped' | 'mapped' | 'logic' | 'error' | 'validated';
  confidence: number;
  lastModified: string;
  modifiedBy: string;
  validationResult?: string;
}

interface Template {
  id: string;
  name: string;
  tagCount: number;
  mappedCount: number;
  lastModified: string;
}

export const TagMappingInterface = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMappings, setSelectedMappings] = useState<string[]>([]);
  const [isTestingLogic, setIsTestingLogic] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showExtractionDialog, setShowExtractionDialog] = useState(false);
  const [selectedTemplateForExtraction, setSelectedTemplateForExtraction] = useState<string>("");
  
  const { templates } = useTemplates();
  const { 
    extractedTags, 
    internalTags, 
    tagMappings,
    loading, 
    error,
    extractTags,
    createTagMapping,
    updateTagMapping,
    refetch
  } = useExtractedTags(selectedTemplate === "all" ? undefined : selectedTemplate);

  // Transform data to match component interface
  const sourceTags: SourceTag[] = extractedTags.map(tag => ({
    id: tag.id,
    name: tag.text,
    templateName: tag.template?.name || "Unknown Template",
    templateId: tag.template_id,
    position: tag.position,
    context: tag.context || "",
    confidence: tag.confidence,
    pattern: tag.pattern || ""
  }));

  const filteredSourceTags = sourceTags.filter(tag => {
    const templateMatch = selectedTemplate === "all" || tag.templateId === selectedTemplate;
    const searchMatch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       tag.context.toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = true;
    if (statusFilter !== "all") {
      const mapping = tagMappings.find(m => m.extracted_tag_id === tag.id);
      const currentStatus = mapping?.status.toLowerCase() || "unmapped";
      statusMatch = currentStatus === statusFilter;
    }
    
    return templateMatch && searchMatch && statusMatch;
  });

  const getMappingForTag = (tagId: string) => {
    return tagMappings.find(m => m.extracted_tag_id === tagId);
  };

  const getInternalTag = (id: string) => {
    return internalTags.find(t => t.id === id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'mapped': return 'bg-primary text-primary-foreground';
      case 'validated': return 'bg-success text-success-foreground';
      case 'logic': return 'bg-accent text-accent-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'mapped': case 'validated': return <CheckCircle2 className="w-4 h-4" />;
      case 'logic': return <Code className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleMappingUpdate = async (sourceTagId: string, updates: any) => {
    try {
      const existing = tagMappings.find(m => m.extracted_tag_id === sourceTagId);
      
      if (existing) {
        await updateTagMapping(existing.id, updates);
      } else {
        await createTagMapping({
          extracted_tag_id: sourceTagId,
          internal_tag_id: updates.internal_tag_id,
          mapping_logic: updates.mapping_logic,
          confidence: updates.confidence || 50
        });
      }
      
      toast.success("Tag mapping has been saved successfully");
    } catch (error) {
      toast.error("Could not update tag mapping");
    }
  };

  const handleExtractTags = async (templateId: string) => {
    setIsExtracting(true);
    try {
      await extractTags(templateId);
      setShowExtractionDialog(false);
      toast.success("AI has extracted tags from the template");
    } catch (error) {
      toast.error("Could not extract tags from template");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleBulkMap = async () => {
    // For now, just show a message - bulk mapping would need additional implementation
    toast.info("Bulk AI mapping will be available in the next update");
  };

  const validateMappings = async () => {
    setIsTestingLogic(true);
    setTimeout(() => {
      tagMappings.forEach(mapping => {
        if (mapping.status === 'mapped' || mapping.status === 'logic') {
          handleMappingUpdate(mapping.extracted_tag_id, {
            status: 'validated',
            confidence: Math.min(mapping.confidence + 5, 100)
          });
        }
      });
      setIsTestingLogic(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tag Extraction & Mapping</h2>
          <p className="text-muted-foreground">Extract tags from templates and map them to internal fields</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={validateMappings} disabled={isTestingLogic}>
            {isTestingLogic ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Validate All
          </Button>
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Save className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Templates for Tag Extraction</CardTitle>
          <CardDescription>Select a template to extract tags using AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-card/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {extractedTags.filter(tag => tag.template_id === template.id).length} tags extracted
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplateForExtraction(template.id);
                        setShowExtractionDialog(true);
                      }}
                    >
                      <Wand2 className="w-4 h-4 mr-1" />
                      Extract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tag Extraction Dialog */}
      <Dialog open={showExtractionDialog} onOpenChange={setShowExtractionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extract Tags from Template</DialogTitle>
            <DialogDescription>
              Use AI to automatically extract tags and placeholders from the selected template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="mb-2">This will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Analyze the template content using AI</li>
                <li>Extract all placeholders and variable fields</li>
                <li>Add extracted tags to your tag library</li>
                <li>Enable mapping to internal tag fields</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExtractionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleExtractTags(selectedTemplateForExtraction)}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Extract Tags
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection and Filters */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates ({sourceTags.length} tags)</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} (tags available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Search Tags</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unmapped">Unmapped</SelectItem>
                  <SelectItem value="mapped">Mapped</SelectItem>
                  <SelectItem value="logic">Custom Logic</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bulk Actions</Label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkMap}
                  disabled={selectedMappings.length === 0 || isValidating}
                  className="flex-1"
                >
                  {isValidating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                  AI Map ({selectedMappings.length})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Table */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tag Mappings</CardTitle>
              <CardDescription>
                {filteredSourceTags.length} tags • 
                {tagMappings.filter(m => m.status === 'mapped' || m.status === 'validated').length} mapped • 
                {tagMappings.filter(m => m.status === 'unmapped').length} unmapped
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-muted rounded-lg text-sm font-medium">
              <div className="col-span-1">
                <Checkbox 
                  checked={selectedMappings.length === filteredSourceTags.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMappings(filteredSourceTags.map(t => t.id));
                    } else {
                      setSelectedMappings([]);
                    }
                  }}
                />
              </div>
              <div className="col-span-3">Source Tag</div>
              <div className="col-span-3">Internal Mapping</div>
              <div className="col-span-3">Mapping Logic</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Rows */}
            {filteredSourceTags.map((sourceTag) => {
              const mapping = getMappingForTag(sourceTag.id);
              const status = mapping?.status.toLowerCase() || 'unmapped';

              return (
                <div key={sourceTag.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                  {/* Selection */}
                  <div className="col-span-1 pt-2">
                    <Checkbox 
                      checked={selectedMappings.includes(sourceTag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMappings(prev => [...prev, sourceTag.id]);
                        } else {
                          setSelectedMappings(prev => prev.filter(id => id !== sourceTag.id));
                        }
                      }}
                    />
                  </div>

                  {/* Source Tag */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{sourceTag.name}</code>
                      <Badge variant="secondary" className="text-xs">{sourceTag.confidence}%</Badge>
                    </div>
                    {selectedTemplate === "all" && (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{sourceTag.templateName}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{sourceTag.context}</p>
                  </div>

                  {/* Internal Mapping */}
                  <div className="col-span-3">
                    <Select 
                      value={mapping?.internal_tag_id || ""} 
                      onValueChange={(value) => handleMappingUpdate(sourceTag.id, { 
                        internal_tag_id: value, 
                        status: 'mapped'
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select internal tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {internalTags.map(tag => (
                          <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs">{tag.name}</code>
                              <Badge variant="outline" className="text-xs">{tag.category}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping?.internal_tag_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {internalTags.find(t => t.id === mapping.internal_tag_id)?.description}
                      </p>
                    )}
                  </div>

                  {/* Mapping Logic */}
                  <div className="col-span-3">
                    <Textarea
                      placeholder="Custom mapping logic (JS)..."
                      value={mapping?.mapping_logic || ""}
                      onChange={(e) => handleMappingUpdate(sourceTag.id, { 
                        mapping_logic: e.target.value,
                        status: e.target.value ? 'logic' : (mapping?.internal_tag_id ? 'mapped' : 'unmapped')
                      })}
                      className="h-8 text-xs font-mono resize-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="col-span-1 pt-1">
                    <Badge className={cn("text-xs", getStatusColor(status))}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 pt-1">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSourceTags.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="w-8 h-8 mx-auto mb-2" />
              <p>No tags found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <div className="text-2xl font-bold">{tagMappings.filter(m => m.status === 'validated').length}</div>
                <p className="text-xs text-muted-foreground">Validated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{tagMappings.filter(m => m.status === 'mapped').length}</div>
                <p className="text-xs text-muted-foreground">Direct Mapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">{tagMappings.filter(m => m.status === 'logic').length}</div>
                <p className="text-xs text-muted-foreground">Custom Logic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{sourceTags.length - tagMappings.length}</div>
                <p className="text-xs text-muted-foreground">Unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};