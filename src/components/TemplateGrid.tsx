import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, Download, Eye, Trash2, RefreshCw } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import type { Template } from "@/hooks/useTemplates";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewer } from "./DocumentViewer";

export const TemplateGrid = () => {
  const { templates, loading, error, refetch, deleteTemplate } = useTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || template.status === statusFilter;
    const matchesType = typeFilter === "all" || template.file_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueFileTypes = Array.from(new Set(templates.map(t => t.file_type).filter(Boolean)));

  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'processing':
        return 'bg-status-processing text-white';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const handleView = async (template: Template) => {
    console.log('View clicked for template:', template);
    console.log('Template metadata:', template.metadata);
    setViewingTemplate(template);
  };

  const handleDownload = async (template: Template) => {
    console.log('Download clicked for template:', template);
    try {
      if (template.metadata && typeof template.metadata === 'object') {
        const metadata = template.metadata as any;
        let content = '';
        
        if (metadata.extractedText) {
          content = metadata.extractedText;
        } else if (metadata.content) {
          content = metadata.content;
        } else {
          throw new Error('No content available for download');
        }

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.replace(/\.[^/.]+$/, '')}_extracted.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download successful",
          description: `Downloaded content from ${template.name}`,
        });
      } else {
        toast({
          title: "No content available",
          description: "This template doesn't have processed content to download",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (template: Template) => {
    console.log('Delete clicked for template:', template);
    console.log('Template ID:', template.id);
    
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('User confirmed delete, proceeding...');
    try {
      console.log('Calling deleteTemplate function...');
      await deleteTemplate(template.id);
      console.log('Delete successful, showing success toast');
      toast({
        title: "Template deleted",
        description: `${template.name} has been deleted successfully`,
      });
      console.log('Refreshing template list...');
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-12 text-center">
          <div className="text-destructive mb-4">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading templates: {error}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Viewer Modal */}
      {viewingTemplate && (
        <DocumentViewer 
          template={viewingTemplate} 
          onClose={() => setViewingTemplate(null)} 
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Uploaded Templates</h3>
          <p className="text-sm text-muted-foreground">Manage your template library</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-custom-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background h-9 text-sm"
              >
                <option value="all">All Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="w-full sm:w-36">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background h-9 text-sm"
              >
                <option value="all">All Types</option>
                {uniqueFileTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
          <CardDescription>Your uploaded template files</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No templates match your search.' : 'Upload your first template to get started.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded Date</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getStatusColor(template.status))}>
                          {template.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {template.file_type || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(template.file_size)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(template.uploaded_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          )) || <span className="text-muted-foreground text-sm">No tags</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleView(template)}
                            title="View template content"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownload(template)}
                            title="Download template content"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(template)}
                            title="Delete template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};