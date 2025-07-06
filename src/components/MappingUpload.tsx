import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useExtractedTags } from "@/hooks/useExtractedTags";

interface MappingData {
  tagName: string;
  mappingField: string;
  customMapping?: string;
  applicableDocuments: string;
  status: string;
  active: string;
}

interface ParsedMapping extends MappingData {
  isValid: boolean;
  errors: string[];
}

export const MappingUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMapping[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { extractedTags, internalTags, tagMappings, createTagMapping, updateTagMapping, createInternalTag, refetch } = useExtractedTags();

  const downloadTemplate = () => {
    const templateData = [
      {
        'Tag Name': '[EXAMPLE_TAG]',
        'Mapping Field': 'client_name',
        'Custom Mapping': 'Optional custom logic here',
        'Applicable Documents': 'Document 1; Document 2',
        'Status': 'mapped',
        'Active': 'Yes'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'mapping-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded successfully");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    setUploadedFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header names to match our expected format
        const normalized = header.trim().toLowerCase();
        if (normalized.includes('tag') && normalized.includes('name')) return 'tagName';
        if (normalized.includes('mapping') && normalized.includes('field')) return 'mappingField';
        if (normalized.includes('custom') && normalized.includes('mapping')) return 'customMapping';
        if (normalized.includes('applicable') && normalized.includes('document')) return 'applicableDocuments';
        if (normalized.includes('status')) return 'status';
        if (normalized.includes('active')) return 'active';
        return header; // Keep original if no match
      },
      complete: (results) => {
        console.log('CSV parse results:', results);
        
        if (results.errors && results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          toast.error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }
        
        const parsed = results.data as MappingData[];
        console.log('Parsed CSV data:', parsed);
        
        if (parsed.length === 0) {
          toast.error("No valid data found in CSV file");
          return;
        }
        
        const validatedData = parsed.map(row => validateMappingRow(row));
        console.log('Validated data:', validatedData);
        setParsedData(validatedData);
        
        const validCount = validatedData.filter(row => row.isValid).length;
        const invalidCount = validatedData.filter(row => !row.isValid).length;
        
        toast.success(`Parsed ${parsed.length} rows: ${validCount} valid, ${invalidCount} invalid`);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const validateMappingRow = (row: MappingData): ParsedMapping => {
    const errors: string[] = [];
    
    console.log('Validating row:', row);
    
    // Check if tagName exists and is not empty
    if (!row.tagName || typeof row.tagName !== 'string' || row.tagName.trim() === '') {
      errors.push('Tag Name is required and cannot be empty');
    }
    
    // Check if either mappingField or customMapping is provided
    const hasMappingField = row.mappingField && typeof row.mappingField === 'string' && row.mappingField.trim() !== '';
    const hasCustomMapping = row.customMapping && typeof row.customMapping === 'string' && row.customMapping.trim() !== '';
    
    if (!hasMappingField && !hasCustomMapping) {
      errors.push('Either Mapping Field or Custom Mapping is required');
    }
    
    // Make status validation more flexible - accept empty/undefined status
    if (row.status && typeof row.status === 'string' && row.status.trim() !== '') {
      const validStatuses = ['mapped', 'unmapped', 'validated', 'error', 'logic'];
      if (!validStatuses.includes(row.status.toLowerCase().trim())) {
        errors.push(`Invalid status value: "${row.status}". Valid options: ${validStatuses.join(', ')}`);
      }
    }
    
    // Make active validation more flexible - accept empty/undefined active
    if (row.active && typeof row.active === 'string' && row.active.trim() !== '') {
      const validActiveValues = ['yes', 'no', 'true', 'false', '1', '0'];
      if (!validActiveValues.includes(row.active.toLowerCase().trim())) {
        errors.push(`Invalid active value: "${row.active}". Valid options: ${validActiveValues.join(', ')}`);
      }
    }

    const result = {
      ...row,
      // Set defaults for missing values
      tagName: row.tagName || '',
      mappingField: row.mappingField || '',
      customMapping: row.customMapping || '',
      applicableDocuments: row.applicableDocuments || '',
      status: row.status || 'mapped',
      active: row.active || 'yes',
      isValid: errors.length === 0,
      errors
    };
    
    console.log('Validation result:', result);
    return result;
  };

  const applyMappings = async () => {
    if (!parsedData.length) return;
    
    setIsProcessing(true);
    try {
      const validMappings = parsedData.filter(row => row.isValid);
      let successCount = 0;
      let errorCount = 0;

      for (const mapping of validMappings) {
        try {
          // Find extracted tags that match this tag name
          const matchingExtractedTags = extractedTags.filter(tag => 
            tag.text.toLowerCase().trim() === mapping.tagName.toLowerCase().trim()
          );

          if (matchingExtractedTags.length === 0) {
            console.log(`No extracted tags found for: ${mapping.tagName}`);
            errorCount++;
            continue;
          }

          // Determine mapping approach based on available fields
          const hasMappingField = mapping.mappingField && mapping.mappingField.trim() !== '';
          const hasCustomMapping = mapping.customMapping && mapping.customMapping.trim() !== '';
          
          let internalTag = null;
          let mappingLogic = '';
          let mappingStatus = 'logic'; // Default for custom mapping only

          if (hasMappingField) {
            // Create or find the internal tag
            try {
              internalTag = await createInternalTag({
                name: mapping.mappingField.trim(),
                category: 'uploaded_mapping',
                description: `Field uploaded from mapping file for tag: ${mapping.tagName}`,
                data_type: 'string'
              });
              mappingStatus = 'mapped';
              mappingLogic = `Mapped to field: ${mapping.mappingField}`;
            } catch (error) {
              // Tag might already exist - try to find it
              const existingTag = internalTags.find(tag => 
                tag.name.toLowerCase() === mapping.mappingField.toLowerCase().trim()
              );
              if (existingTag) {
                internalTag = existingTag;
                mappingStatus = 'mapped';
                mappingLogic = `Mapped to field: ${mapping.mappingField}`;
              } else {
                console.error('Failed to create or find internal tag:', error);
                errorCount++;
                continue;
              }
            }
          }

          if (hasCustomMapping) {
            if (mappingLogic) {
              mappingLogic += ` | Custom logic: ${mapping.customMapping.trim()}`;
            } else {
              mappingLogic = `Custom logic: ${mapping.customMapping.trim()}`;
            }
          }

          // Create mappings for each matching extracted tag
          for (const extractedTag of matchingExtractedTags) {
            try {
              // Check if mapping already exists
              const existingMapping = tagMappings.find(m => m.extracted_tag_id === extractedTag.id);

              if (existingMapping) {
                // Update existing mapping
                await updateTagMapping(existingMapping.id, {
                  internal_tag_id: internalTag?.id || null,
                  mapping_logic: mappingLogic,
                  status: mappingStatus,
                  confidence: 95
                });
              } else {
                // Create new mapping
                await createTagMapping({
                  extracted_tag_id: extractedTag.id,
                  internal_tag_id: internalTag?.id || null,
                  mapping_logic: mappingLogic,
                  confidence: 95
                });
              }
              
              console.log(`Successfully mapped: ${extractedTag.text} -> ${mappingLogic}`);
            } catch (error) {
              console.error(`Failed to create/update mapping for ${extractedTag.text}:`, error);
              errorCount++;
            }
          }
          
          successCount++;
        } catch (error) {
          console.error('Error processing mapping:', error);
          errorCount++;
        }
      }

      await refetch(); // Refresh data to show updated mappings
      setShowConfirmDialog(false);
      setParsedData([]);
      setUploadedFile(null);
      
      if (successCount > 0) {
        toast.success(`Successfully applied ${successCount} mappings. Check the Tag Library and Mapping sections to see your updates.`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} mappings failed. Some tag names might not match existing extracted tags.`);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error("Failed to apply mappings");
      console.error('Mapping application error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'mapped': return 'bg-green-100 text-green-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Mapping Details
          </CardTitle>
          <CardDescription>
            Upload your mapping configuration using our CSV template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-medium">Download Template</h4>
                <p className="text-sm text-muted-foreground">
                  Get the CSV template with proper format and examples
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapping-file">Upload Mapping File (CSV)</Label>
            <Input
              id="mapping-file"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>

          {uploadedFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Uploaded: {uploadedFile.name} ({parsedData.length} rows)
              </AlertDescription>
            </Alert>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview Mapping Data</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {parsedData.filter(row => row.isValid).length} Valid
                  </Badge>
                  <Badge variant="destructive">
                    {parsedData.filter(row => !row.isValid).length} Invalid
                  </Badge>
                </div>
              </div>

              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Tag Name</TableHead>
                      <TableHead>Mapping Field</TableHead>
                      <TableHead>Custom Mapping</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} className={row.isValid ? '' : 'bg-red-50'}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.tagName}</TableCell>
                        <TableCell>{row.mappingField}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.customMapping || 'None'}
                        </TableCell>
                        <TableCell className="text-sm">{row.applicableDocuments}</TableCell>
                        <TableCell className="text-sm">
                          {row.errors.length > 0 && (
                            <div className="text-red-600">
                              {row.errors.map((error, i) => (
                                <div key={i} className="text-xs">{error}</div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedData.some(row => !row.isValid) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some rows have validation errors. Please fix them before applying mappings.
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    The system will match tag names from your CSV with existing extracted tags. 
                    Make sure the "Tag Name" column exactly matches your extracted tag names.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setParsedData([]);
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!parsedData.some(row => row.isValid)}
                >
                  Apply Mappings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Mapping Updates</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply these mapping changes? This will update your tag mappings across the application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Changes Summary:</h4>
              <ul className="text-sm space-y-1">
                <li>• {parsedData.filter(row => row.isValid).length} mappings will be processed</li>
                <li>• {new Set(parsedData.filter(row => row.isValid).map(row => row.mappingField)).size} internal tags will be created/updated</li>
                <li>• Custom mapping logic will be preserved</li>
                <li>• Fields from your upload will be added to the internal tag library</li>
                <li>• All uploaded fields are considered valid and will be accepted</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={applyMappings} disabled={isProcessing}>
                {isProcessing ? "Applying..." : "Confirm & Apply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};