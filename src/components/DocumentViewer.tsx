import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, FileText, Calendar, User, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Template } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  template: Template;
  onClose: () => void;
}

export const DocumentViewer = ({ template, onClose }: DocumentViewerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getDocumentContent = () => {
    if (template.metadata && typeof template.metadata === 'object') {
      const metadata = template.metadata as any;
      return metadata.extractedText || metadata.content || 'No content available for this document.';
    }
    return 'No content available for this document.';
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const content = getDocumentContent();
      
      if (content === 'No content available for this document.') {
        toast({
          title: "No content available",
          description: "This document doesn't have processed content to download",
          variant: "destructive"
        });
        return;
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
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download document content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const documentContent = getDocumentContent();
  const hasContent = documentContent !== 'No content available for this document.';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground truncate">
                {template.name}
              </h2>
              <p className="text-sm text-muted-foreground">Document Viewer</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!hasContent || isLoading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Info */}
        <div className="p-6 border-b bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", getStatusColor(template.status))}>
                {template.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>{formatFileSize(template.file_size)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{template.file_type || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(template.uploaded_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {template.tags && template.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Document Content</CardTitle>
                <CardDescription>
                  {hasContent 
                    ? "Extracted text content from the uploaded document" 
                    : "Content is not available for this document"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full overflow-auto">
                {hasContent ? (
                  <div className="bg-muted/30 rounded-lg p-4 h-full overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {documentContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Content Available</h3>
                    <p className="text-muted-foreground max-w-md">
                      This document may not have been processed yet, or the content extraction failed. 
                      Try uploading the document again or check if it's a supported file format.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};