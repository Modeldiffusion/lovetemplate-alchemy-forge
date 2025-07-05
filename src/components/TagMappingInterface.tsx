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

  // Mock data
  const [templates] = useState<Template[]>([
    { id: "1", name: "Contract Template v2.1", tagCount: 23, mappedCount: 18, lastModified: "2 hours ago" },
    { id: "2", name: "Invoice Format", tagCount: 15, mappedCount: 15, lastModified: "1 day ago" },
    { id: "3", name: "Policy Document", tagCount: 31, mappedCount: 12, lastModified: "3 days ago" },
    { id: "4", name: "User Manual Template", tagCount: 44, mappedCount: 28, lastModified: "1 week ago" }
  ]);

  const [sourceTags, setSourceTags] = useState<SourceTag[]>([
    {
      id: "1", name: "{{CLIENT_NAME}}", templateName: "Contract Template v2.1", templateId: "1",
      position: 1, context: "This agreement is between {{CLIENT_NAME}} and Company", confidence: 98, pattern: "{{[A-Z_]+}}"
    },
    {
      id: "2", name: "{{CONTRACT_DATE}}", templateName: "Contract Template v2.1", templateId: "1", 
      position: 2, context: "Date of agreement: {{CONTRACT_DATE}}", confidence: 95, pattern: "{{[A-Z_]+}}"
    },
    {
      id: "3", name: "{{INVOICE_NUMBER}}", templateName: "Invoice Format", templateId: "2",
      position: 1, context: "Invoice #{{INVOICE_NUMBER}}", confidence: 99, pattern: "{{[A-Z_]+}}"
    },
    {
      id: "4", name: "{{AMOUNT_DUE}}", templateName: "Invoice Format", templateId: "2",
      position: 2, context: "Total Amount Due: {{AMOUNT_DUE}}", confidence: 97, pattern: "{{[A-Z_]+}}"
    }
  ]);

  const [internalTags] = useState<InternalTag[]>([
    { id: "1", name: "client.name", category: "Client Info", description: "Primary client name", dataType: "string" },
    { id: "2", name: "client.company", category: "Client Info", description: "Client company name", dataType: "string" },
    { id: "3", name: "contract.date", category: "Contract", description: "Contract execution date", dataType: "date" },
    { id: "4", name: "contract.duration", category: "Contract", description: "Contract duration in months", dataType: "number" },
    { id: "5", name: "invoice.number", category: "Financial", description: "Unique invoice identifier", dataType: "string" },
    { id: "6", name: "amount.total", category: "Financial", description: "Total amount due", dataType: "currency" }
  ]);

  const [mappings, setMappings] = useState<TagMapping[]>([
    {
      id: "1", sourceTagId: "1", internalTagId: "1", status: "mapped", confidence: 95,
      lastModified: "2 hours ago", modifiedBy: "John Smith"
    },
    {
      id: "2", sourceTagId: "2", internalTagId: "3", status: "mapped", confidence: 90,
      lastModified: "2 hours ago", modifiedBy: "John Smith"
    },
    {
      id: "3", sourceTagId: "3", internalTagId: "5", status: "validated", confidence: 99,
      lastModified: "1 day ago", modifiedBy: "Sarah Wilson", validationResult: "✓ Valid format"
    },
    {
      id: "4", sourceTagId: "4", mappingLogic: "parseFloat(value.replace('$', '').replace(',', ''))", 
      status: "logic", confidence: 85, lastModified: "1 day ago", modifiedBy: "Mike Johnson"
    }
  ]);

  const filteredSourceTags = sourceTags.filter(tag => {
    const templateMatch = selectedTemplate === "all" || tag.templateId === selectedTemplate;
    const searchMatch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       tag.context.toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusMatch = true;
    if (statusFilter !== "all") {
      const mapping = mappings.find(m => m.sourceTagId === tag.id);
      const currentStatus = mapping?.status || "unmapped";
      statusMatch = currentStatus === statusFilter;
    }
    
    return templateMatch && searchMatch && statusMatch;
  });

  const getMappingForTag = (tagId: string) => {
    return mappings.find(m => m.sourceTagId === tagId);
  };

  const getInternalTag = (id: string) => {
    return internalTags.find(t => t.id === id);
  };

  const getStatusColor = (status: TagMapping['status']) => {
    switch (status) {
      case 'mapped': return 'bg-primary text-primary-foreground';
      case 'validated': return 'bg-success text-success-foreground';
      case 'logic': return 'bg-accent text-accent-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusIcon = (status: TagMapping['status'] | 'unmapped') => {
    switch (status) {
      case 'mapped': case 'validated': return <CheckCircle2 className="w-4 h-4" />;
      case 'logic': return <Code className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleMappingUpdate = (sourceTagId: string, updates: Partial<TagMapping>) => {
    setMappings(prev => {
      const existing = prev.find(m => m.sourceTagId === sourceTagId);
      if (existing) {
        return prev.map(m => m.sourceTagId === sourceTagId ? { ...m, ...updates } : m);
      } else {
        const newMapping: TagMapping = {
          id: Date.now().toString(),
          sourceTagId,
          status: 'unmapped',
          confidence: 50,
          lastModified: 'Just now',
          modifiedBy: 'Current User',
          ...updates
        };
        return [...prev, newMapping];
      }
    });
  };

  const handleBulkMap = async () => {
    setIsValidating(true);
    // Simulate AI-powered bulk mapping
    setTimeout(() => {
      selectedMappings.forEach(sourceTagId => {
        const sourceTag = sourceTags.find(t => t.id === sourceTagId);
        if (sourceTag) {
          // Simple similarity matching (in real app, this would use AI)
          const bestMatch = internalTags.find(internal => 
            sourceTag.name.toLowerCase().includes(internal.name.split('.')[1]?.toLowerCase() || '')
          );
          
          if (bestMatch) {
            handleMappingUpdate(sourceTagId, {
              internalTagId: bestMatch.id,
              status: 'mapped',
              confidence: 85,
              lastModified: 'Just now',
              modifiedBy: 'AI Assistant'
            });
          }
        }
      });
      setIsValidating(false);
      setSelectedMappings([]);
    }, 2000);
  };

  const validateMappings = async () => {
    setIsTestingLogic(true);
    setTimeout(() => {
      mappings.forEach(mapping => {
        if (mapping.status === 'mapped' || mapping.status === 'logic') {
          handleMappingUpdate(mapping.sourceTagId, {
            status: 'validated',
            validationResult: '✓ Validation passed',
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
          <h2 className="text-3xl font-bold text-foreground">Tag Mapping Interface</h2>
          <p className="text-muted-foreground">Map template tags to internal fields with custom logic support</p>
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
                      {template.name} ({template.tagCount} tags)
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
                {mappings.filter(m => m.status === 'mapped' || m.status === 'validated').length} mapped • 
                {mappings.filter(m => m.status === 'unmapped').length} unmapped
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
              const internalTag = mapping?.internalTagId ? getInternalTag(mapping.internalTagId) : null;
              const status = mapping?.status || 'unmapped';

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
                      value={mapping?.internalTagId || ""} 
                      onValueChange={(value) => handleMappingUpdate(sourceTag.id, { 
                        internalTagId: value, 
                        status: 'mapped',
                        lastModified: 'Just now',
                        modifiedBy: 'Current User'
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
                    {internalTag && (
                      <p className="text-xs text-muted-foreground mt-1">{internalTag.description}</p>
                    )}
                  </div>

                  {/* Mapping Logic */}
                  <div className="col-span-3">
                    <Textarea
                      placeholder="Custom mapping logic (JS)..."
                      value={mapping?.mappingLogic || ""}
                      onChange={(e) => handleMappingUpdate(sourceTag.id, { 
                        mappingLogic: e.target.value,
                        status: e.target.value ? 'logic' : (mapping?.internalTagId ? 'mapped' : 'unmapped'),
                        lastModified: 'Just now',
                        modifiedBy: 'Current User'
                      })}
                      className="h-8 text-xs font-mono resize-none"
                    />
                    {mapping?.validationResult && (
                      <p className="text-xs text-success mt-1">{mapping.validationResult}</p>
                    )}
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
                <div className="text-2xl font-bold">{mappings.filter(m => m.status === 'validated').length}</div>
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
                <div className="text-2xl font-bold">{mappings.filter(m => m.status === 'mapped').length}</div>
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
                <div className="text-2xl font-bold">{mappings.filter(m => m.status === 'logic').length}</div>
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
                <div className="text-2xl font-bold">{sourceTags.length - mappings.length}</div>
                <p className="text-xs text-muted-foreground">Unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};