import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Target, AlertCircle } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { toast } from "sonner";

export const TemplateExtractionForm = () => {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { extractTags, loading } = useExtractedTags();

  const [regexPattern, setRegexPattern] = useState("");
  const [startChar, setStartChar] = useState("[");
  const [endChar, setEndChar] = useState("]");
  const [extractionMethod, setExtractionMethod] = useState<"regex" | "delimiters">("delimiters");

  // Handle bulk extraction
  const templateIds = searchParams.get('templates')?.split(',') || [];
  const isBulkExtraction = templateIds.length > 0;
  
  // Get template(s) info
  const currentTemplate = templates.find(t => t.id === templateId);
  const bulkTemplates = templates.filter(t => templateIds.includes(t.id));
  const targetTemplates = isBulkExtraction ? bulkTemplates : (currentTemplate ? [currentTemplate] : []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (targetTemplates.length === 0) {
      toast.error("No templates selected for extraction");
      return;
    }

    try {
      for (const template of targetTemplates) {
        await extractTags(template.id);
        toast.success(`Tags extracted from ${template.name}`);
      }
      
      if (isBulkExtraction) {
        toast.success(`Successfully extracted tags from ${targetTemplates.length} templates`);
      }
      
      navigate('/tag-mapping');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Extraction failed');
    }
  };

  if (targetTemplates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/extraction')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        
        <Card className="bg-gradient-card shadow-custom-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Template not found</h3>
            <p className="text-muted-foreground">The selected template could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/extraction')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            {isBulkExtraction ? 'Bulk Tag Extraction' : 'Tag Extraction'}
          </h3>
          <p className="text-muted-foreground">
            {isBulkExtraction 
              ? `Extract tags from ${targetTemplates.length} selected templates`
              : `Extract tags from ${currentTemplate?.name}`
            }
          </p>
        </div>
      </div>

      {/* Template Info */}
      <Card className="bg-gradient-card shadow-custom-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isBulkExtraction ? 'Selected Templates' : 'Template Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {targetTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.file_type} • {template.file_size ? `${Math.round(template.file_size / 1024)} KB` : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{template.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extraction Configuration */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Extraction Configuration
          </CardTitle>
          <CardDescription>
            Configure how tags should be extracted from the template(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={extractionMethod} onValueChange={(value) => setExtractionMethod(value as "regex" | "delimiters")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="delimiters">Delimiter-based</TabsTrigger>
                <TabsTrigger value="regex">Regex Pattern</TabsTrigger>
              </TabsList>

              <TabsContent value="delimiters" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startChar">Start Character</Label>
                    <Input
                      id="startChar"
                      value={startChar}
                      onChange={(e) => setStartChar(e.target.value)}
                      placeholder="["
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Character(s) that mark the beginning of a tag
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endChar">End Character</Label>
                    <Input
                      id="endChar"
                      value={endChar}
                      onChange={(e) => setEndChar(e.target.value)}
                      placeholder="]"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Character(s) that mark the end of a tag
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Example:</p>
                  <p className="text-sm text-muted-foreground">
                    With start "{startChar}" and end "{endChar}", tags like{" "}
                    <code className="bg-muted px-1 rounded">{startChar}COMPANY_NAME{endChar}</code> will be extracted.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="regex" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regexPattern">Regular Expression Pattern</Label>
                  <Textarea
                    id="regexPattern"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="\\[([A-Z_]+)\\]"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a regex pattern to match tags. Use capturing groups to extract the tag content.
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Example Pattern:</p>
                  <code className="text-sm bg-muted px-1 rounded">\\[([A-Z_]+)\\]</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    This pattern matches tags like [COMPANY_NAME], [DATE], etc.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/extraction')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-primary">
                {loading ? 'Extracting...' : `Extract Tags${isBulkExtraction ? ` (${targetTemplates.length})` : ''}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};