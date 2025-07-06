import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Edit,
  Database,
  FileText,
  Filter,
  ChevronDown,
  Download,
  Plus
} from "lucide-react";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useUploadedFields } from "@/hooks/useUploadedFields";
import { useTemplates } from "@/hooks/useTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TagLibraryItem {
  id: string;
  tagName: string;
  mappingField: string | null;
  applicableDocuments: string[];
  mappingStatus: 'unmapped' | 'mapped' | 'logic' | 'validated' | 'error';
  isActive: boolean;
  extractedTagId: string;
  internalTagId: string | null;
}

export const TagLibrary = () => {
  const { extractedTags, tagMappings, internalTags, loading, createTagMapping, updateTagMapping, createInternalTag, createManualTag, refetch } = useExtractedTags();
  const { getAllFieldNames, loading: fieldsLoading } = useUploadedFields();
  const { templates } = useTemplates();
  const [tagLibraryData, setTagLibraryData] = useState<TagLibraryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  
  // Manual tag dialog state
  const [isManualTagDialogOpen, setIsManualTagDialogOpen] = useState(false);
  const [manualTagData, setManualTagData] = useState({
    text: '',
    context: '',
    confidence: 100,
    templateId: ''
  });

  // Load available fields
  useEffect(() => {
    if (!fieldsLoading) {
      setAvailableFields(getAllFieldNames());
    }
  }, [fieldsLoading, getAllFieldNames]);

  // Process the data to create tag library items
  useEffect(() => {
    if (!extractedTags.length) return;

    const processedData: TagLibraryItem[] = [];
    
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

    // Create library items
    Object.values(tagGroups).forEach(group => {
      const representativeTag = group.tags[0];
      const mapping = tagMappings.find(m => 
        group.tags.some(t => t.id === m.extracted_tag_id)
      );
      
      const internalTag = mapping?.internal_tag_id 
        ? internalTags.find(it => it.id === mapping.internal_tag_id)
        : null;

      processedData.push({
        id: `${representativeTag.id}_group`,
        tagName: group.tagName,
        mappingField: internalTag?.name || null,
        applicableDocuments: Array.from(group.documents),
        mappingStatus: mapping?.status || 'unmapped',
        isActive: true, // Default to active, could be stored in DB
        extractedTagId: representativeTag.id,
        internalTagId: mapping?.internal_tag_id || null
      });
    });

    setTagLibraryData(processedData);
  }, [extractedTags, tagMappings, internalTags]);

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

  const handleFieldMapping = async (tagId: string, extractedTagId: string, fieldName: string) => {
    try {
      // First, try to find an existing internal tag with this field name
      let internalTag = internalTags.find(tag => tag.name === fieldName);
      
      // If not found, create a new internal tag
      if (!internalTag) {
        internalTag = await createInternalTag({
          name: fieldName,
          category: 'uploaded_fields',
          description: `Field uploaded from external file`,
          data_type: 'string'
        });
      }

      // Create the mapping with the internal tag ID
      await createTagMapping({
        extracted_tag_id: extractedTagId,
        internal_tag_id: internalTag.id,
        mapping_logic: `Field mapped to: ${fieldName}`,
        confidence: 95
      });

      // Refetch data to get the updated mappings and internal tags
      await refetch();
      
      toast.success(`Tag "${tagLibraryData.find(t => t.id === tagId)?.tagName}" mapped to "${fieldName}"`);
    } catch (error) {
      console.error('Field mapping error:', error);
      toast.error("Failed to create field mapping");
    }
  };

  const handleToggleActive = async (tagId: string, currentStatus: boolean) => {
    // Here you would typically update the database
    // For now, just update local state
    setTagLibraryData(prev => 
      prev.map(item => 
        item.id === tagId 
          ? { ...item, isActive: !currentStatus }
          : item
      )
    );
    toast.success(`Tag ${currentStatus ? 'deactivated' : 'activated'} successfully`);
  };

  const handleEdit = (tagId: string) => {
    // Navigate to edit page or open edit modal
    toast.info("Edit functionality will be implemented");
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
      
      setManualTagData({ text: '', context: '', confidence: 100, templateId: '' });
      setIsManualTagDialogOpen(false);
      
      toast.success(`Manual tag "${manualTagData.text}" has been added to the library`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add manual tag");
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error("No tags to export");
      return;
    }

    // Create CSV content
    const headers = ['Tag Name', 'Mapping Field', 'Applicable Documents', 'Status', 'Active'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${item.tagName}"`,
        `"${item.mappingField || 'Not mapped'}"`,
        `"${item.applicableDocuments.join('; ')}"`,
        `"${getStatusLabel(item.mappingStatus)}"`,
        `"${item.isActive ? 'Yes' : 'No'}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tag-library-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredData.length} tags successfully`);
  };

  const filteredData = tagLibraryData.filter(item => {
    const matchesSearch = item.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.mappingField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.applicableDocuments.some(doc => 
                           doc.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === "all" || item.mappingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-2xl font-bold text-foreground">Tag Library</h3>
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
        <Database className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">Tag Library</h3>
          <p className="text-muted-foreground">
            Manage and view all extracted tags from your documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tags</p>
                <p className="text-xl font-bold">{tagLibraryData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mapped</p>
                <p className="text-xl font-bold">
                  {tagLibraryData.filter(t => t.mappingStatus === 'mapped' || t.mappingStatus === 'validated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unmapped</p>
                <p className="text-xl font-bold">
                  {tagLibraryData.filter(t => t.mappingStatus === 'unmapped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">
                  {tagLibraryData.filter(t => t.isActive).length}
                </p>
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
                  placeholder="Search tags, mapping fields, or documents..."
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
                <option value="mapped">Mapped</option>
                <option value="validated">Validated</option>
                <option value="logic">Logic Applied</option>
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
                Tag Library ({filteredData.length} items)
              </CardTitle>
              <CardDescription>
                Manage extracted tags and their mappings across all documents
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
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Manual Tag</DialogTitle>
                    <DialogDescription>
                      Add a tag that the system might have missed during extraction
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Name</TableHead>
                  <TableHead>Mapping Field</TableHead>
                  <TableHead>Applicable Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No tags match your search criteria" 
                        : "No tags found. Extract tags from templates to see them here."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
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
                          onCheckedChange={() => handleToggleActive(item.id, item.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};