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
import { supabase } from "@/integrations/supabase/client";

export const TemplateExtractionForm = () => {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { extractTags, loading } = useExtractedTags();

  const [regexPattern, setRegexPattern] = useState("");
  const [startDelimiters, setStartDelimiters] = useState<string[]>(["["]);
  const [endDelimiters, setEndDelimiters] = useState<string[]>(["]"]);
  const [includeDelimiters, setIncludeDelimiters] = useState(true);
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
      // Test the connection first
      console.log('Testing edge function connection...');
      const { data: testData, error: testError } = await supabase.functions.invoke('test-extract', {
        body: { test: true, templateId: targetTemplates[0].id }
      });

      if (testError) {
        console.error('Test function error:', testError);
        toast.error(`Connection test failed: ${testError.message}`);
        return;
      }

      console.log('Test function response:', testData);
      toast.success('Connection test successful! Now trying actual extraction...');

      // Now try the actual extraction
      for (const template of targetTemplates) {
        const extractionConfig = {
          startDelimiters,
          endDelimiters,
          includeDelimiters,
          caseSensitive: false
        };
        
        const { data, error } = await supabase.functions.invoke('extract-tags', {
          body: { 
            templateId: template.id,
            extractionConfig
          }
        });
        
        if (error || !data?.success) {
          throw new Error(data?.error || `Extraction failed for ${template.name}`);
        }
        
        toast.success(`Tags extracted from ${template.name}`);
      }
      
      if (isBulkExtraction) {
        toast.success(`Successfully extracted tags from ${targetTemplates.length} templates`);
      }
      
      navigate('/tag-mapping');
    } catch (error) {
      console.error('Extraction error:', error);
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
                      <Input
                        placeholder="Add delimiter"
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
                    <p className="text-xs text-muted-foreground">
                      Characters that mark the beginning of tags
                    </p>
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
                      <Input
                        placeholder="Add delimiter"
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
                    <p className="text-xs text-muted-foreground">
                      Characters that mark the end of tags
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="includeDelimitersForm"
                    checked={includeDelimiters}
                    onChange={(e) => setIncludeDelimiters(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="includeDelimitersForm">Include delimiters in extracted tags</Label>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {startDelimiters.slice(0, 2).map((start, i) => (
                      endDelimiters.slice(0, 2).map((end, j) => (
                        <code key={`${i}-${j}`} className="bg-muted px-1 rounded text-xs">
                          {start === ' ' ? '' : start}TAG_NAME{end === ' ' ? ' ' : end}
                        </code>
                      ))
                    ))}
                  </div>
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