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
  const { templates } = useTemplates();

  // Preview tags as user types
  const handleContentChange = (content: string) => {
    setTemplateContent(content);
    
    // Extract tags for preview
    const tagRegex = /\[([A-Z_][A-Z0-9_]*)\]/g;
    const foundTags = new Set<string>();
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      foundTags.add(match[1]);
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

      // Now call the extraction function
      const { data, error } = await supabase.functions.invoke('extract-tags', {
        body: { templateId: selectedTemplateId }
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

      {/* Content Input */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>2. Paste Template Content</CardTitle>
          <CardDescription>
            Copy your template content and paste it below. The system will extract all [TAG_NAME] placeholders.
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
                    [{tag}]
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