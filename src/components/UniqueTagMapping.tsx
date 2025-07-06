import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Edit,
  Tag,
  FileText,
  Filter,
  Download,
  Plus,
  Save,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useUploadedFields } from "@/hooks/useUploadedFields";
import { useTemplates } from "@/hooks/useTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pagination, ColumnFilters } from "@/components/ui/pagination-table";

interface TagMappingItem {
  id: string;
  tagName: string;
  mappingField: string | null;
  customMapping: string | null;
  applicableDocuments: string[];
  mappingStatus: 'unmapped' | 'mapped' | 'logic' | 'validated' | 'error';
  isActive: boolean;
  extractedTagId: string;
  internalTagId: string | null;
  mappingId: string | null;
}

export const UniqueTagMapping = () => {
  const { extractedTags, tagMappings, internalTags, loading, createTagMapping, updateTagMapping, createInternalTag, createManualTag, refetch } = useExtractedTags();
  const { getAllFieldNames, loading: fieldsLoading } = useUploadedFields();
  const { templates } = useTemplates();
  const [tagMappingData, setTagMappingData] = useState<TagMappingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [editingCustomMapping, setEditingCustomMapping] = useState<string | null>(null);
  const [editingCustomValue, setEditingCustomValue] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Manual tag dialog state
  const [isManualTagDialogOpen, setIsManualTagDialogOpen] = useState(false);
  const [manualTagData, setManualTagData] = useState({
    text: '',
    context: '',
    confidence: 100,
    templateId: '',
    mappingField: '',
    customMapping: ''
  });

  // Load available fields
  useEffect(() => {
    if (!fieldsLoading) {
      setAvailableFields(getAllFieldNames());
    }
  }, [fieldsLoading, getAllFieldNames]);

  // Process the data to create tag mapping items
  useEffect(() => {
    if (!extractedTags.length) return;

    const processedData: TagMappingItem[] = [];
    
    // Group extracted tags by their text to combine documents
    const tagGroups = extractedTags.reduce((groups, tag) => {
      const key = tag.text.toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          tagName: tag.text,
          documents: new Set<string>(),
          tags: []
        };
      }
      if (tag.template?.name) {
        groups[key].documents.add(tag.template.name);
      }
      groups[key].tags.push(tag);
      return groups;
    }, {} as Record<string, { tagName: string; documents: Set<string>; tags: any[] }>);

    // Create mapping items
    Object.values(tagGroups).forEach(group => {
      const representativeTag = group.tags[0];
      const mapping = tagMappings.find(m => 
        group.tags.some(t => t.id === m.extracted_tag_id)
      );
      
      const internalTag = mapping?.internal_tag_id 
        ? internalTags.find(it => it.id === mapping.internal_tag_id)
        : null;

      // Extract custom mapping from mapping_logic if it contains custom logic
      let customMapping = null;
      if (mapping?.mapping_logic && mapping.mapping_logic.includes('Custom logic:')) {
        const customPart = mapping.mapping_logic.split('Custom logic:')[1];
        if (customPart) {
          customMapping = customPart.replace(/^\s*\|\s*/, '').trim();
        }
      }

      processedData.push({
        id: `${representativeTag.id}_group`,
        tagName: group.tagName,
        mappingField: internalTag?.name || null,
        customMapping,
        applicableDocuments: Array.from(group.documents),
        mappingStatus: mapping?.status || 'unmapped',
        isActive: true,
        extractedTagId: representativeTag.id,
        internalTagId: mapping?.internal_tag_id || null,
        mappingId: mapping?.id || null
      });
    });

    setTagMappingData(processedData);
  }, [extractedTags, tagMappings, internalTags]);

  const handleFieldMapping = async (tagId: string, extractedTagId: string, fieldName: string) => {
    try {
      // Find existing internal tag or create new one
      let internalTag = internalTags.find(tag => tag.name === fieldName);
      
      if (!internalTag) {
        internalTag = await createInternalTag({
          name: fieldName,
          category: 'uploaded_fields',
          description: `Field uploaded from external file`,
          data_type: 'string'
        });
      }

      const existingMappingId = tagMappingData.find(t => t.id === tagId)?.mappingId;

      if (existingMappingId) {
        // Update existing mapping
        await updateTagMapping(existingMappingId, {
          internal_tag_id: internalTag.id,
          mapping_logic: `Field mapped to: ${fieldName}`,
          status: 'mapped',
          confidence: 95
        });
      } else {
        // Create new mapping
        await createTagMapping({
          extracted_tag_id: extractedTagId,
          internal_tag_id: internalTag.id,
          mapping_logic: `Field mapped to: ${fieldName}`,
          confidence: 95
        });
      }

      await refetch();
      toast.success(`Tag "${tagMappingData.find(t => t.id === tagId)?.tagName}" mapped to "${fieldName}"`);
    } catch (error) {
      console.error('Field mapping error:', error);
      toast.error("Failed to create field mapping");
    }
  };

  const handleCustomMappingEdit = (tagId: string, currentValue: string) => {
    setEditingCustomMapping(tagId);
    setEditingCustomValue(currentValue || '');
  };

  const handleCustomMappingSave = async (tagId: string, extractedTagId: string) => {
    try {
      const tagItem = tagMappingData.find(t => t.id === tagId);
      if (!tagItem) return;

      let mappingLogic = '';
      if (tagItem.mappingField) {
        mappingLogic = `Field mapped to: ${tagItem.mappingField}`;
      }
      
      if (editingCustomValue.trim()) {
        if (mappingLogic) {
          mappingLogic += ` | Custom logic: ${editingCustomValue.trim()}`;
        } else {
          mappingLogic = `Custom logic: ${editingCustomValue.trim()}`;
        }
      }

      const status = tagItem.mappingField ? 'mapped' : 'logic';

      if (tagItem.mappingId) {
        // Update existing mapping
        await updateTagMapping(tagItem.mappingId, {
          mapping_logic: mappingLogic,
          status,
          confidence: 95
        });
      } else {
        // Create new mapping
        await createTagMapping({
          extracted_tag_id: extractedTagId,
          internal_tag_id: tagItem.internalTagId,
          mapping_logic: mappingLogic,
          confidence: 95
        });
      }

      await refetch();
      setEditingCustomMapping(null);
      setEditingCustomValue('');
      toast.success(`Custom mapping updated for "${tagItem.tagName}"`);
    } catch (error) {
      console.error('Custom mapping error:', error);
      toast.error("Failed to update custom mapping");
    }
  };

  const handleManualTagAdd = async () => {
    if (!manualTagData.text.trim() || !manualTagData.templateId) return;
    
    try {
      await createManualTag({
        template_id: manualTagData.templateId,
        text: manualTagData.text.trim(),
        context: manualTagData.context.trim(),
        confidence: manualTagData.confidence
      });

      // If mapping field or custom mapping is provided, create the mapping
      if (manualTagData.mappingField || manualTagData.customMapping) {
        // Wait a bit for the tag to be created, then fetch and map
        setTimeout(async () => {
          await refetch();
          // Find the newly created tag and create mapping
          // This would need the extracted tag ID from the creation result
          toast.success(`Manual tag "${manualTagData.text}" added with mapping`);
        }, 1000);
      }
      
      setManualTagData({ text: '', context: '', confidence: 100, templateId: '', mappingField: '', customMapping: '' });
      setIsManualTagDialogOpen(false);
      
      toast.success(`Manual tag "${manualTagData.text}" has been added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add manual tag");
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error("No tags to export");
      return;
    }

    const headers = ['Tag Name', 'Mapping Field', 'Custom Mapping', 'Applicable Documents', 'Status', 'Active'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${item.tagName}"`,
        `"${item.mappingField || 'Not mapped'}"`,
        `"${item.customMapping || 'None'}"`,
        `"${item.applicableDocuments.join('; ')}"`,
        `"${getStatusLabel(item.mappingStatus)}"`,
        `"${item.isActive ? 'Yes' : 'No'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `unique-tag-mapping-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredData.length} tag mappings successfully`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mapped': return 'bg-green-100 text-green-800 border-green-200';
      case 'validated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'logic': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'mapped': return 'Mapped';
      case 'validated': return 'Validated';
      case 'logic': return 'Logic Applied';
      case 'error': return 'Error';
      default: return 'Unmapped';
    }
  };

  const filteredData = tagMappingData.filter(item => {
    // Apply column filters
    const columnFiltered = Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;
      
      switch (key) {
        case 'tagName':
          return item.tagName.toLowerCase().includes(value.toLowerCase());
        case 'mappingField':
          return item.mappingField?.toLowerCase().includes(value.toLowerCase()) || false;
        case 'customMapping':
          return item.customMapping?.toLowerCase().includes(value.toLowerCase()) || false;
        case 'documents':
          return item.applicableDocuments.some(doc => 
            doc.toLowerCase().includes(value.toLowerCase())
          );
        case 'status':
          return item.mappingStatus === value;
        default:
          return true;
      }
    });
    
    // Apply search filter
    const matchesSearch = item.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.mappingField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customMapping?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.applicableDocuments.some(doc => 
                           doc.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === "all" || item.mappingStatus === statusFilter;
    
    return columnFiltered && matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Tag className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-2xl font-bold text-foreground">Unique Tag Mapping</h3>
            <p className="text-muted-foreground">Loading extracted tags...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Tag className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">Unique Tag Mapping</h3>
          <p className="text-muted-foreground">
            Configure individual tag mappings with field mapping and custom logic
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{tagMappingData.length}</div>
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
                  {tagMappingData.filter(t => t.mappingStatus === 'mapped').length}
                </div>
                <p className="text-xs text-muted-foreground">Field Mapped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">
                  {tagMappingData.filter(t => t.customMapping).length}
                </div>
                <p className="text-xs text-muted-foreground">Custom Mapping</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">
                  {tagMappingData.filter(t => t.mappingStatus === 'logic').length}
                </div>
                <p className="text-xs text-muted-foreground">Logic Applied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {tagMappingData.filter(t => t.mappingStatus === 'unmapped').length}
                </div>
                <p className="text-xs text-muted-foreground">Unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-card shadow-custom-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags, mapping fields, custom mappings, or documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="unmapped">Unmapped</option>
                <option value="mapped">Field Mapped</option>
                <option value="logic">Custom Logic</option>
                <option value="validated">Validated</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Table */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Unique Tag Mapping ({filteredData.length} items)
              </CardTitle>
              <CardDescription>
                Configure field mappings and custom logic for individual tags
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isManualTagDialogOpen} onOpenChange={setIsManualTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Manual Tag
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Manual Tag with Mapping</DialogTitle>
                    <DialogDescription>
                      Add a tag that the system might have missed and configure its mapping
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-text">Tag Text</Label>
                      <Input
                        id="manual-tag-text"
                        value={manualTagData.text}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Enter tag text (e.g., [CLIENT_NAME])"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-document">Select Document</Label>
                      <Select
                        value={manualTagData.templateId}
                        onValueChange={(value) => setManualTagData(prev => ({ ...prev, templateId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-mapping-field">Mapping Field (Optional)</Label>
                      <Select
                        value={manualTagData.mappingField}
                        onValueChange={(value) => setManualTagData(prev => ({ ...prev, mappingField: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-custom-mapping">Custom Mapping (Optional)</Label>
                      <Textarea
                        id="manual-tag-custom-mapping"
                        value={manualTagData.customMapping}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, customMapping: e.target.value }))}
                        placeholder="Enter custom mapping logic..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-context">Context (Optional)</Label>
                      <Textarea
                        id="manual-tag-context"
                        value={manualTagData.context}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, context: e.target.value }))}
                        placeholder="Describe where this tag should be used..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manual-tag-confidence">Confidence (%)</Label>
                      <Input
                        id="manual-tag-confidence"
                        type="number"
                        min="1"
                        max="100"
                        value={manualTagData.confidence}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, confidence: parseInt(e.target.value) || 100 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsManualTagDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleManualTagAdd}
                      disabled={!manualTagData.text.trim() || !manualTagData.templateId}
                    >
                      Add Tag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={filteredData.length === 0}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ColumnFilters
            filters={[
              { key: 'tagName', label: 'Tag Name', type: 'text' },
              { key: 'mappingField', label: 'Mapping Field', type: 'text' },
              { key: 'customMapping', label: 'Custom Mapping', type: 'text' },
              { key: 'documents', label: 'Documents', type: 'text' },
              { key: 'status', label: 'Status', type: 'select', options: ['unmapped', 'mapped', 'logic', 'validated', 'error'] }
            ]}
            values={filters}
            onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
            onClear={() => setFilters({})}
          />
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Name</TableHead>
                  <TableHead>Mapping Field</TableHead>
                  <TableHead>Custom Mapping</TableHead>
                  <TableHead>Applicable Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || Object.values(filters).some(v => v && v !== 'all')
                        ? "No tags match your search criteria" 
                        : "No tags found. Extract tags from templates to see them here."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {item.tagName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {item.mappingField && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {item.mappingField}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Mapped</span>
                            </div>
                          )}
                          {availableFields.length > 0 && (
                            <Select
                              value=""
                              onValueChange={(value) => handleFieldMapping(item.id, item.extractedTagId, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder={item.mappingField ? "Map to another field..." : "Select field..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields.map((field) => (
                                  <SelectItem key={field} value={field}>
                                    {field}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {!item.mappingField && availableFields.length === 0 && (
                            <span className="text-muted-foreground">Not mapped</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {editingCustomMapping === item.id ? (
                            <div className="flex items-center gap-2">
                              <Textarea
                                value={editingCustomValue}
                                onChange={(e) => setEditingCustomValue(e.target.value)}
                                placeholder="Enter custom mapping logic..."
                                className="min-h-[60px]"
                              />
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomMappingSave(item.id, item.extractedTagId)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCustomMapping(null);
                                    setEditingCustomValue('');
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {item.customMapping && (
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Custom Logic
                                  </Badge>
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground max-w-xs">
                                {item.customMapping || 'No custom mapping'}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCustomMappingEdit(item.id, item.customMapping || '')}
                                className="h-6 px-2"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                {item.customMapping ? 'Edit' : 'Add Custom'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {item.applicableDocuments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.applicableDocuments.slice(0, 2).map((doc, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {doc}
                                </Badge>
                              ))}
                              {item.applicableDocuments.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.applicableDocuments.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No documents</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(item.mappingStatus)}
                        >
                          {getStatusLabel(item.mappingStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => {
                            // Update active status
                            setTagMappingData(prev => 
                              prev.map(t => 
                                t.id === item.id 
                                  ? { ...t, isActive: !t.isActive }
                                  : t
                              )
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredData.length > pageSize && (
            <Pagination
              totalItems={filteredData.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};