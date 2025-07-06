import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, FileSpreadsheet, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useUploadedFields } from "@/hooks/useUploadedFields";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const UploadFields = () => {
  const { uploadedFiles, loading, createUploadedFile, createFieldNames, deleteUploadedFile } = useUploadedFields();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Please upload only Excel (.xls, .xlsx) or CSV files");
      return;
    }

    setUploading(true);
    
    try {
      // Parse file to extract field names
      let fieldNames: string[] = [];
      
      if (file.type.includes('sheet') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Assume first column contains field names, skip header row
        fieldNames = (jsonData as any[][])
          .slice(1)
          .map(row => row[0])
          .filter(name => name && typeof name === 'string' && name.trim().length > 0)
          .map(name => String(name).trim());
      } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files
        const text = await file.text();
        const result = Papa.parse(text, { header: false, skipEmptyLines: true });
        
        // Assume first column contains field names, skip header row
        fieldNames = (result.data as any[][])
          .slice(1)
          .map(row => row[0])
          .filter(name => name && typeof name === 'string' && name.trim().length > 0)
          .map(name => String(name).trim());
      }

      if (fieldNames.length === 0) {
        toast.error("No valid field names found in the file. Please ensure the first column contains field names.");
        return;
      }

      // Create file record in database
      const uploadedFile = await createUploadedFile({
        name: file.name,
        file_type: file.type,
        file_size: file.size
      });

      // Save extracted field names
      await createFieldNames(uploadedFile.id, fieldNames);

      toast.success(`Successfully uploaded ${file.name} with ${fieldNames.length} field names`);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      await deleteUploadedFile(fileId);
      toast.success(`Deleted ${fileName} successfully`);
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Upload Field Definition File</h3>
            <p className="text-sm text-muted-foreground">
              Supports Excel (.xls, .xlsx) and CSV files. The first column should contain field names.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-file-upload" className="sr-only">
              Choose file
            </Label>
            <Input
              id="field-file-upload"
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="max-w-sm mx-auto"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {uploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Uploaded Field Files</h4>
          <div className="grid gap-4">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="bg-gradient-card shadow-custom-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="w-8 h-8 text-primary" />
                      <div>
                        <h5 className="font-medium">{file.name}</h5>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{file.file_type}</span>
                          {file.file_size && (
                            <>
                              <span>•</span>
                              <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Field File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name}"? This will remove all associated field names and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No field files uploaded yet. Upload your first file to get started.
          </p>
        </div>
      )}
    </div>
  );
};