import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, CheckCircle2, AlertCircle, FileText, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  tags?: string[];
  error?: string;
  templateId?: string;
}

export const TemplateUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const { uploadTemplate, deleteTemplate } = useTemplates();
  const { toast } = useToast();

  // Helper function to read file content as base64
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (fileList: File[]) => {
    // Validate file count based on mode
    if (uploadMode === 'single' && fileList.length > 1) {
      toast({
        title: "Single upload mode",
        description: "Switch to bulk mode to upload multiple files at once.",
        variant: "destructive"
      });
      return;
    }

    // Validate file types
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const invalidFiles = Array.from(fileList).filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF, DOCX, or TXT files.",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (10MB limit)
    const oversizedFiles = Array.from(fileList).filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process files with better error handling
    for (const [index, file] of fileList.entries()) {
      const uploadedFile = newFiles[index];
      
      try {
        // Update progress to uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 30 } : f
        ));

        // Save template to database
        const result = await uploadTemplate({
          name: file.name,
          file_size: file.size,
          file_type: file.type,
          tags: ['uploaded']
        });

        if (result.error) {
          throw new Error(result.error);
        }

        // Update to processing
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 60 } : f
        ));

        // Read file content and process it
        const fileContent = await readFileContent(file);
        
        // Process file content through edge function
        const { data: processData, error: processError } = await supabase.functions.invoke('process-file', {
          body: { 
            templateId: result.data.id,
            fileContent: fileContent,
            fileType: file.type
          }
        });

        if (processError || !processData?.success) {
          throw new Error(processData?.error || 'File processing failed');
        }

        // Store the template ID for potential deletion
        const updatedFile = {
          ...uploadedFile,
          status: 'completed' as const,
          progress: 100,
          tags: ['uploaded', 'processed', 'ready-for-extraction'],
          templateId: result.data.id
        };

        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? updatedFile : f
        ));
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded and processed.`
        });

      } catch (err) {
        console.error('Upload error:', err);
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? {
            ...f,
            status: 'error',
            progress: 100,
            error: err instanceof Error ? err.message : 'Upload failed'
          } : f
        ));
        
        toast({
          title: "Upload failed",
          description: `Failed to process ${file.name}. ${err instanceof Error ? err.message : 'Please try again.'}`,
          variant: "destructive"
        });
      }
    }
  }, [uploadMode, uploadTemplate, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const downloadTemplate = async (file: UploadedFile) => {
    try {
      if (file.templateId) {
        // Get template data from Supabase
        const { data: template, error } = await supabase
          .from('templates')
          .select('metadata, name')
          .eq('id', file.templateId)
          .single();

        if (error) {
          throw new Error('Template not found');
        }

        // Extract content from metadata
        const metadata = template.metadata as any;
        let content = '';
        
        if (metadata?.extractedText) {
          content = metadata.extractedText;
        } else if (metadata?.content) {
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
        // For files without template ID, create a simple text file
        const content = `File: ${file.name}\nSize: ${formatFileSize(file.size)}\nType: ${file.type}\nStatus: ${file.status}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name}_info.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download successful",
          description: `Downloaded info for ${file.name}`,
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

  const deleteUploadedFile = async (fileId: string, templateId?: string) => {
    try {
      if (templateId) {
        const { error } = await supabase
          .from('templates')
          .delete()
          .eq('id', templateId);
          
        if (error) {
          throw new Error(error.message);
        }
        
        toast({
          title: "File deleted",
          description: "Template has been deleted successfully",
        });
      }
      
      // Remove from local state
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Template Upload</h2>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Upload templates for AI-powered tag extraction and conversion
            <span className="block lg:inline">
              {uploadMode === 'single' ? ' (Single file mode)' : ' (Bulk upload mode)'}
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-1 p-1 bg-muted rounded-lg">
            <Button
              variant={uploadMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('single')}
              className="h-8 flex-1 sm:flex-none"
            >
              Single
            </Button>
            <Button
              variant={uploadMode === 'bulk' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('bulk')}
              className="h-8 flex-1 sm:flex-none"
            >
              Bulk
            </Button>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMode === 'single' ? 'Upload File' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-200",
              isDragging 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg" 
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Drop {uploadMode === 'single' ? 'file' : 'files'} here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOCX, TXT files up to 10MB each
              <br />
              <span className="text-xs">
                {uploadMode === 'single' ? 'Single file mode' : 'Multiple files allowed'}
              </span>
            </p>
            <input
              type="file"
              multiple={uploadMode === 'bulk'}
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="secondary" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <File className="w-4 h-4 mr-2" />
                Choose {uploadMode === 'single' ? 'File' : 'Files'}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Uploaded Files ({files.length})
            </CardTitle>
            <CardDescription>Processing status and file information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getStatusColor(file.status))}
                        >
                          {file.status}
                        </Badge>
                        {file.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadTemplate(file)}
                            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                            title="Download extracted content"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUploadedFile(file.id, file.templateId)}
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.progress}%</span>
                    </div>
                    
                    <Progress value={file.progress} className="h-2 mb-2" />
                    
                    {file.tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {file.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">{file.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{files.filter(f => f.status === 'completed').length}</div>
            <p className="text-xs text-green-700 dark:text-green-300">Successfully Processed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{files.filter(f => f.status === 'processing' || f.status === 'uploading').length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Currently Processing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{files.filter(f => f.status === 'error').length}</div>
            <p className="text-xs text-red-700 dark:text-red-300">Failed Uploads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};