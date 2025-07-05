import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  tags?: string[];
  error?: string;
}

export const TemplateUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const { templates, uploadTemplate, loading, error } = useTemplates();
  const { toast } = useToast();

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

        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? {
            ...f,
            status: 'completed',
            progress: 100,
            tags: ['uploaded', 'processed']
          } : f
        ));
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded and saved.`
        });

      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? {
            ...f,
            status: 'error',
            progress: 100,
            error: 'Upload temporarily unavailable'
          } : f
        ));
        
        toast({
          title: "Upload failed",
          description: `Failed to process ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }
  }, [uploadMode, toast]);

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
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'processing':
        return 'bg-status-processing text-white';
      default:
        return 'bg-warning text-warning-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Template Upload</h2>
          <p className="text-muted-foreground">
            Upload templates for AI-powered tag extraction and conversion
            {uploadMode === 'single' ? ' (Single file mode)' : ' (Bulk upload mode)'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
            <Button
              variant={uploadMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('single')}
              className="h-8"
            >
              Single
            </Button>
            <Button
              variant={uploadMode === 'bulk' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('bulk')}
              className="h-8"
            >
              Bulk
            </Button>
          </div>
          <Button 
            className="bg-gradient-primary hover:shadow-glow"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMode === 'single' ? 'Upload File' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-8">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
              isDragging 
                ? "border-primary bg-primary/5 shadow-glow" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Drop {uploadMode === 'single' ? 'file' : 'files'} here or click to browse
            </h3>
            <p className="text-muted-foreground mb-4">
              Supports PDF, DOCX, TXT files up to 10MB each
              {uploadMode === 'single' ? ' (single file)' : ' (multiple files allowed)'}
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
              <Button variant="secondary" className="cursor-pointer">
                <File className="w-4 h-4 mr-2" />
                Choose {uploadMode === 'single' ? 'File' : 'Files'}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
            <CardDescription>Processing status and extracted information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg bg-card/50">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getStatusColor(file.status))}
                        >
                          {file.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.progress}%</span>
                    </div>
                    
                    <Progress value={file.progress} className="h-2 mb-2" />
                    
                    {file.tags && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{files.filter(f => f.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">Successfully Processed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{files.filter(f => f.status === 'processing' || f.status === 'uploading').length}</div>
            <p className="text-xs text-muted-foreground">Currently Processing</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{files.filter(f => f.status === 'error').length}</div>
            <p className="text-xs text-muted-foreground">Failed Uploads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};