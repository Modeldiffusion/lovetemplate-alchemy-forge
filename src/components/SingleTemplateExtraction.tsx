import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Zap, CheckCircle2, AlertCircle, RefreshCw, Target, Plus, Trash2 } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const SingleTemplateExtraction = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { extractTags, extractedTags, loading, createManualTag, deleteExtractedTag } = useExtractedTags(templateId);
  const { toast } = useToast();
  
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [extractionResults, setExtractionResults] = useState<any>(null);
  
  // Dialog state for manual tag addition
  const [isManualTagDialogOpen, setIsManualTagDialogOpen] = useState(false);
  const [manualTagData, setManualTagData] = useState({
    text: '',
    context: '',
    confidence: 100
  });

  // Delimiter configuration state
  const [delimiterPairs, setDelimiterPairs] = useState<Array<{start: string, end: string}>>([
    { start: '[', end: ']' }
  ]);
  const [includeDelimiters, setIncludeDelimiters] = useState(true);
  const [extractionMethod, setExtractionMethod] = useState<"regex" | "delimiters">("delimiters");
  const [regexPattern, setRegexPattern] = useState("");

  const template = templates.find(t => t.id === templateId);

  useEffect(() => {
    if (extractedTags.length > 0) {
      setExtractionStatus('completed');
      setProgress(100);
    }
  }, [extractedTags]);

  const handleStartExtraction = async () => {
    if (!templateId) return;
    
    console.log('Starting tag extraction for template:', templateId);
    console.log('Delimiter pairs:', delimiterPairs);
    console.log('Extraction method:', extractionMethod);
    
    setExtractionStatus('extracting');
    setProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const extractionConfig = {
        method: extractionMethod,
        delimiterPairs,
        includeDelimiters,
        regexPattern: extractionMethod === 'regex' ? regexPattern : undefined,
        caseSensitive: false
      };

      const results = await extractTags(templateId, extractionConfig);
      
      clearInterval(progressInterval);
      setProgress(100);
      setExtractionStatus('completed');
      setExtractionResults(results);
      
      const totalExtracted = results?.totalTags || extractedTags.length;
      toast({
        title: "Extraction completed",
        description: `Total ${totalExtracted} Extracted. Please check the tag library for Extracted Tag details`,
      });
      
    } catch (error) {
      console.error('Tag extraction failed:', error);
      setExtractionStatus('error');
      setProgress(0);
      
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract tags",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (extractionStatus) {
      case 'extracting':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (extractionStatus) {
      case 'extracting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (extractionStatus) {
      case 'extracting':
        return 'Extracting...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  const handleManualTagAdd = async () => {
    if (!templateId || !manualTagData.text.trim()) return;
    
    try {
      await createManualTag({
        template_id: templateId,
        text: manualTagData.text.trim(),
        context: manualTagData.context.trim(),
        confidence: manualTagData.confidence
      });
      
      setManualTagData({ text: '', context: '', confidence: 100 });
      setIsManualTagDialogOpen(false);
      
      toast({
        title: "Tag added successfully",
        description: `Manual tag "${manualTagData.text}" has been added and will appear in the results below`,
      });
    } catch (error) {
      toast({
        title: "Failed to add tag",
        description: error instanceof Error ? error.message : "Failed to add manual tag",
        variant: "destructive"
      });
    }
  };

  if (!template) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/extraction')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Template not found</h3>
            <p className="text-muted-foreground">The requested template could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/extraction')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
        </div>
      </div>

      {/* Template Info */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-primary" />
            <span>{template.name}</span>
          </CardTitle>
          <CardDescription>
            Extract tags and data fields from this document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">File Size</p>
              <p className="font-medium">
                {template.file_size ? `${(template.file_size / 1024).toFixed(1)} KB` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Type</p>
              <p className="font-medium">{template.file_type || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uploaded</p>
              <p className="font-medium">{format(new Date(template.uploaded_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Configuration */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Extraction Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure how tags should be extracted from the document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={extractionMethod} onValueChange={(value) => setExtractionMethod(value as "regex" | "delimiters")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="delimiters">Delimiter-based</TabsTrigger>
              <TabsTrigger value="regex">Regex Pattern</TabsTrigger>
            </TabsList>

            <TabsContent value="delimiters" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Custom Delimiter Pairs</Label>
                  <div className="space-y-3">
                    {delimiterPairs.map((pair, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            placeholder="Start delimiter (e.g., [, <<, @)"
                            value={pair.start}
                            onChange={(e) => {
                              const newPairs = [...delimiterPairs];
                              newPairs[index].start = e.target.value;
                              setDelimiterPairs(newPairs);
                            }}
                            className="w-32"
                          />
                          <span className="text-muted-foreground text-sm">...</span>
                          <Input
                            placeholder="End delimiter (e.g., ], >>, ,)"
                            value={pair.end}
                            onChange={(e) => {
                              const newPairs = [...delimiterPairs];
                              newPairs[index].end = e.target.value;
                              setDelimiterPairs(newPairs);
                            }}
                            className="w-32"
                          />
                        </div>
                        <Badge variant="outline" className="bg-background">
                          {pair.start}TAG{pair.end}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDelimiterPairs(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDelimiterPairs(prev => [...prev, { start: '', end: '' }]);
                    }}
                    className="mt-2"
                  >
                    + Add Delimiter Pair
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Add custom delimiter pairs to extract tags. Examples: [tag], {'<<tag>>'}, {'{tag}'}, @tag (with comma/space)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
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
                <p className="text-sm font-medium mb-1">Current delimiter pairs will extract:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {delimiterPairs.filter(pair => pair.start && pair.end).map((pair, index) => (
                    <code key={index} className="bg-muted px-2 py-1 rounded text-xs">
                      {pair.start}TAG_NAME{pair.end}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tags can be in tables, paragraphs, or footers. Use @ with comma/space for special tags.
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
        </CardContent>
      </Card>

      {/* Extraction Controls */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Tag Extraction</CardTitle>
          <CardDescription>
            Extract structured data and tags from the document content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {extractionStatus === 'extracting' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleStartExtraction}
              disabled={extractionStatus === 'extracting' || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
            >
              {extractionStatus === 'extracting' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Extracting Tags...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {extractedTags.length > 0 ? 'Re-extract Tags' : 'Extract Tags'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Results */}
      {(extractedTags.length > 0 || extractionResults) && (
        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Extraction Results</span>
            </CardTitle>
            <CardDescription>
              Tags and data fields extracted from the document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{extractedTags.length}</div>
                <div className="text-sm text-muted-foreground">Tags Found</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {extractedTags.filter(tag => tag.confidence > 80).length}
                </div>
                <div className="text-sm text-muted-foreground">High Confidence</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(extractedTags.map(tag => tag.text.toLowerCase())).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Tags</div>
              </div>
            </div>

            {extractedTags.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Extracted Tags:</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   {extractedTags.slice(0, 20).map((tag, index) => (
                     <div key={tag.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="font-medium">{tag.text}</span>
                       <div className="flex items-center space-x-2">
                         <Badge variant={tag.confidence > 80 ? "default" : "secondary"} className="text-xs">
                           {tag.confidence}%
                         </Badge>
                         <span className="text-xs text-muted-foreground">pos: {tag.position}</span>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={async () => {
                             try {
                               await deleteExtractedTag(tag.id);
                               toast({
                                 title: "Tag deleted",
                                 description: `Tag "${tag.text}" has been removed`,
                               });
                             } catch (error) {
                               toast({
                                 title: "Delete failed",
                                 description: error instanceof Error ? error.message : "Failed to delete tag",
                                 variant: "destructive"
                               });
                             }
                           }}
                           className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                         >
                           <Trash2 className="w-3 h-3" />
                         </Button>
                       </div>
                     </div>
                   ))}
                </div>
                {extractedTags.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center">
                    And {extractedTags.length - 20} more tags...
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center mt-6 space-x-4">
              <Button
                onClick={() => navigate('/tag-library')}
                variant="outline"
              >
                View in Tag Library
              </Button>
              
              <Dialog open={isManualTagDialogOpen} onOpenChange={setIsManualTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Manual Tag
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Manual Tag</DialogTitle>
                    <DialogDescription>
                      Add a tag that the system might have missed during extraction
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tag-text">Tag Text</Label>
                      <Input
                        id="tag-text"
                        value={manualTagData.text}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Enter tag text (e.g., [COMPANY_NAME])"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tag-context">Context (Optional)</Label>
                      <Textarea
                        id="tag-context"
                        value={manualTagData.context}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, context: e.target.value }))}
                        placeholder="Describe where this tag should be used..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tag-confidence">Confidence (%)</Label>
                      <Input
                        id="tag-confidence"
                        type="number"
                        min="1"
                        max="100"
                        value={manualTagData.confidence}
                        onChange={(e) => setManualTagData(prev => ({ ...prev, confidence: parseInt(e.target.value) || 100 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsManualTagDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleManualTagAdd}
                      disabled={!manualTagData.text.trim()}
                    >
                      Add Tag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};