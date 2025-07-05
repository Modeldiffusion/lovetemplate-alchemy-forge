import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Wand2, 
  Copy,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ManualTagExtraction = () => {
  const [templateContent, setTemplateContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [previewTags, setPreviewTags] = useState<string[]>([]);
  const [startDelimiters, setStartDelimiters] = useState<string[]>(['[']);
  const [endDelimiters, setEndDelimiters] = useState<string[]>([']']);
  const [includeDelimiters, setIncludeDelimiters] = useState(true);
  const { templates } = useTemplates();

  // Build preview regex based on current delimiter settings
  const buildPreviewRegex = () => {
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const startPattern = startDelimiters.map(escapeRegex).join('|');
    const endPattern = endDelimiters.map(delim => {
      if (delim === ' ') return '\\s+';
      return escapeRegex(delim);
    }).join('|');
    
    return new RegExp(`(${startPattern})([A-Z_][A-Z0-9_]*)(${endPattern})`, 'gi');
  };

  // Preview tags as user types
  const handleContentChange = (content: string) => {
    setTemplateContent(content);
    
    // Extract tags for preview using current delimiter configuration
    const tagRegex = buildPreviewRegex();
    const foundTags = new Set<string>();
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const tagContent = match[2];
      const tagToAdd = includeDelimiters ? fullMatch : tagContent;
      foundTags.add(tagToAdd);
    }
    
    setPreviewTags(Array.from(foundTags));
  };

  const handleExtract = async () => {
    if (!templateContent.trim()) {
      toast.error("Please paste your template content first");
      return;
    }

    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    setExtracting(true);

    try {
      // First, save the content to the template metadata
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          metadata: { content: templateContent } 
        })
        .eq('id', selectedTemplateId);

      if (updateError) {
        console.error('Failed to save content:', updateError);
        // Continue anyway, the extraction might still work
      }

      // Now call the extraction function with delimiter configuration
      const { data, error } = await supabase.functions.invoke('extract-tags', {
        body: { 
          templateId: selectedTemplateId,
          extractionConfig: {
            startDelimiters,
            endDelimiters,
            includeDelimiters,
            caseSensitive: false
          }
        }
      });

      if (error) {
        console.error('Extraction error:', error);
        toast.error(`Extraction failed: ${error.message}`);
        return;
      }

      if (data.success) {
        toast.success(`Successfully extracted ${data.data.totalTags} tags!`);
        
        // Clear the form
        setTemplateContent("");
        setSelectedTemplateId("");
        setPreviewTags([]);
        
        // Redirect to tag library to see results
        setTimeout(() => {
          window.location.href = '/tag-library';
        }, 1500);
      } else {
        toast.error(data.error || 'Extraction failed');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract tags');
    } finally {
      setExtracting(false);
    }
  };

  const sampleContent = `CONTRACT AGREEMENT

Dear [CLIENT_NAME],

This agreement is entered into on [CONTRACT_DATE] between [COMPANY_NAME] and [CLIENT_COMPANY].

Contract Details:
- Contract Number: [CONTRACT_NUMBER]
- Project: [PROJECT_NAME]
- Value: [CONTRACT_VALUE]
- Start Date: [START_DATE]
- End Date: [END_DATE]

Contact Information:
- Client Contact: [CLIENT_CONTACT_NAME]
- Email: [CLIENT_EMAIL]
- Phone: [CLIENT_PHONE]

Authorized by: [AUTHORIZED_BY]
Date: [SIGNATURE_DATE]`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">Manual Tag Extraction</h3>
          <p className="text-muted-foreground">
            Paste your template content to extract tags in [TAG_NAME] format
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-card shadow-custom-sm border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <AlertTriangle className="w-5 h-5" />
            How to Extract Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="mb-2"><strong>Step 1:</strong> Select a template from the dropdown below</p>
            <p className="mb-2"><strong>Step 2:</strong> Copy and paste your template content (Word doc, etc.)</p>
            <p className="mb-2"><strong>Step 3:</strong> Make sure your placeholders are in [TAG_NAME] format</p>
            <p><strong>Step 4:</strong> Click "Extract Tags" to process</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Example Format:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">[CLIENT_NAME]</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">[CONTRACT_DATE]</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">[COMPANY_NAME]</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">[PROJECT_VALUE]</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card className="bg-gradient-card shadow-custom-sm">
        <CardHeader>
          <CardTitle>1. Select Template</CardTitle>
          <CardDescription>Choose which template you want to extract tags for</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="">-- Select a template --</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Delimiter Configuration */}
      <Card className="bg-gradient-card shadow-custom-sm">
        <CardHeader>
          <CardTitle>2. Configure Delimiters</CardTitle>
          <CardDescription>
            Set up the start and end characters that wrap your placeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Delimiters</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {startDelimiters.map((delim, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {delim === ' ' ? 'SPACE' : delim}
                    <button
                      onClick={() => setStartDelimiters(prev => prev.filter((_, i) => i !== index))}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add delimiter"
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !startDelimiters.includes(value)) {
                        setStartDelimiters(prev => [...prev, value]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!startDelimiters.includes(' ')) {
                      setStartDelimiters(prev => [...prev, ' ']);
                    }
                  }}
                >
                  + Space
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Delimiters</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {endDelimiters.map((delim, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {delim === ' ' ? 'SPACE' : delim}
                    <button
                      onClick={() => setEndDelimiters(prev => prev.filter((_, i) => i !== index))}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add delimiter"
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !endDelimiters.includes(value)) {
                        setEndDelimiters(prev => [...prev, value]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!endDelimiters.includes(' ')) {
                      setEndDelimiters(prev => [...prev, ' ']);
                    }
                  }}
                >
                  + Space
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeDelimiters"
              checked={includeDelimiters}
              onChange={(e) => setIncludeDelimiters(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="includeDelimiters">Include delimiters in extracted tags</Label>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Current Pattern Examples:</p>
            <div className="flex flex-wrap gap-2">
              {startDelimiters.slice(0, 2).map((start, i) => (
                endDelimiters.slice(0, 2).map((end, j) => (
                  <Badge key={`${i}-${j}`} variant="outline" className="bg-blue-100 text-blue-800">
                    {start === ' ' ? '' : start}TAG_NAME{end === ' ' ? ' ' : end}
                  </Badge>
                ))
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Input */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>3. Paste Template Content</CardTitle>
          <CardDescription>
            Copy your template content and paste it below. The system will extract placeholders using your delimiter configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleContentChange(sampleContent)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Use Sample
              </Button>
            </div>
            <Textarea
              id="content"
              placeholder="Paste your template content here..."
              value={templateContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Preview Tags */}
          {previewTags.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">
                  Preview: {previewTags.length} tags found
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {previewTags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-green-100 text-green-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Extract Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExtract}
              disabled={extracting || !templateContent.trim() || !selectedTemplateId}
              className="bg-gradient-primary"
            >
              {extracting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Extracting...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Extract Tags ({previewTags.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};