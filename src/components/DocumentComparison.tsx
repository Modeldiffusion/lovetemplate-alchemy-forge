import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Maximize2, 
  ArrowUpDown, 
  Eye, 
  MessageSquare,
  RotateCcw,
  Check,
  X,
  Plus,
  Minus,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: 'original' | 'converted';
  lastModified: string;
  size: string;
  path: string;
}

interface DocumentChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  content: string;
  oldContent?: string;
  severity: 'low' | 'medium' | 'high';
}

interface Comment {
  id: string;
  lineNumber: number;
  author: string;
  content: string;
  timestamp: string;
  resolved: boolean;
}

export const DocumentComparison = () => {
  const [selectedOriginal, setSelectedOriginal] = useState<string>("");
  const [selectedConverted, setSelectedConverted] = useState<string>("");
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [syncScroll, setSyncScroll] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [activeTab, setActiveTab] = useState("comparison");
  const [newComment, setNewComment] = useState("");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [documents] = useState<Document[]>([]);
  const [changes] = useState<DocumentChange[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const originalContent = "";
  const convertedContent = "";

  const getChangeTypeColor = (type: DocumentChange['type']) => {
    switch (type) {
      case 'addition': return 'text-success bg-success/10';
      case 'deletion': return 'text-destructive bg-destructive/10';
      case 'modification': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: DocumentChange['severity']) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getChangeIcon = (type: DocumentChange['type']) => {
    switch (type) {
      case 'addition': return <Plus className="w-3 h-3" />;
      case 'deletion': return <Minus className="w-3 h-3" />;
      case 'modification': return <Edit className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, isLeft: boolean) => {
    if (!syncScroll) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    const targetRef = isLeft ? rightPanelRef : leftPanelRef;
    
    if (targetRef.current) {
      targetRef.current.scrollTop = scrollTop;
    }
  };

  const addComment = () => {
    if (newComment.trim() && selectedLine !== null) {
      const comment: Comment = {
        id: Date.now().toString(),
        lineNumber: selectedLine,
        author: "Current User",
        content: newComment.trim(),
        timestamp: "Just now",
        resolved: false
      };
      
      setComments(prev => [...prev, comment]);
      setNewComment("");
      setSelectedLine(null);
    }
  };

  const toggleCommentResolved = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
    ));
  };

  const exportComparison = () => {
    // In a real app, this would generate and download a comparison report
    console.log("Exporting comparison report...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Document Comparison</h2>
          <p className="text-muted-foreground">Side-by-side comparison with change tracking and annotations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportComparison}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Document Selection */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Original Document</label>
              <Select value={selectedOriginal} onValueChange={setSelectedOriginal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select original..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.filter(doc => doc.type === 'original').map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex flex-col">
                        <span>{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.size} • {doc.lastModified}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Converted Document</label>
              <Select value={selectedConverted} onValueChange={setSelectedConverted}>
                <SelectTrigger>
                  <SelectValue placeholder="Select converted..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.filter(doc => doc.type === 'converted').map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex flex-col">
                        <span>{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.size} • {doc.lastModified}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={(value: "side-by-side" | "unified") => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">Side by Side</SelectItem>
                  <SelectItem value="unified">Unified View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              <div className="flex space-x-2">
                <Button 
                  variant={syncScroll ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSyncScroll(!syncScroll)}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  Sync
                </Button>
                <Button 
                  variant={showComments ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Comments
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Document Comparison</TabsTrigger>
          <TabsTrigger value="changes">Change Summary</TabsTrigger>
          <TabsTrigger value="comments">Comments & Annotations</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          {selectedOriginal && selectedConverted ? (
            <Card className="bg-gradient-card shadow-custom-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Document Comparison</CardTitle>
                  <div className="flex items-center space-x-4 text-sm">
                    <Badge variant="outline" className="text-success">
                      <Plus className="w-3 h-3 mr-1" />
                      {changes.filter(c => c.type === 'addition').length} Added
                    </Badge>
                    <Badge variant="outline" className="text-destructive">
                      <Minus className="w-3 h-3 mr-1" />
                      {changes.filter(c => c.type === 'deletion').length} Deleted
                    </Badge>
                    <Badge variant="outline" className="text-primary">
                      <Edit className="w-3 h-3 mr-1" />
                      {changes.filter(c => c.type === 'modification').length} Modified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {viewMode === "side-by-side" ? (
                  <div className="grid grid-cols-2 gap-0 border-t">
                    {/* Original Document */}
                    <div className="border-r">
                      <div className="p-3 bg-muted/50 border-b">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Original</span>
                        </div>
                      </div>
                      <div 
                        ref={leftPanelRef}
                        className="h-96 overflow-auto p-4 font-mono text-sm"
                        onScroll={(e) => handleScroll(e, true)}
                      >
                        <pre className="whitespace-pre-wrap">{originalContent}</pre>
                      </div>
                    </div>
                    
                    {/* Converted Document */}
                    <div>
                      <div className="p-3 bg-muted/50 border-b">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Converted</span>
                        </div>
                      </div>
                      <div 
                        ref={rightPanelRef}
                        className="h-96 overflow-auto p-4 font-mono text-sm"
                        onScroll={(e) => handleScroll(e, false)}
                      >
                        <pre className="whitespace-pre-wrap">{convertedContent}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t">
                    <div className="h-96 overflow-auto p-4 font-mono text-sm">
                      <div className="space-y-2">
                        {/* Unified diff view would be implemented here */}
                        <div className="text-muted-foreground">Unified view implementation would show inline differences</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-card shadow-custom-md">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Documents to Compare</h3>
                <p className="text-muted-foreground">Choose an original and converted document to see the comparison</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="changes" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Change Summary</CardTitle>
              <CardDescription>Detailed breakdown of all changes between documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {changes.map((change) => (
                  <div key={change.id} className="border rounded-lg p-4 bg-card/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-1 rounded", getChangeTypeColor(change.type))}>
                          {getChangeIcon(change.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Line {change.lineNumber}</span>
                            <Badge className={cn("text-xs", getSeverityColor(change.severity))}>
                              {change.severity} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{change.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-9 space-y-2">
                      {change.oldContent && (
                        <div className="p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                          <div className="text-xs text-muted-foreground mb-1">Previous:</div>
                          <code className="text-sm text-destructive">{change.oldContent}</code>
                        </div>
                      )}
                      <div className={cn("p-2 rounded border-l-2", 
                        change.type === 'addition' ? 'bg-success/10 border-success' :
                        change.type === 'modification' ? 'bg-primary/10 border-primary' :
                        'bg-muted/50 border-muted'
                      )}>
                        <div className="text-xs text-muted-foreground mb-1">
                          {change.type === 'deletion' ? 'Removed:' : 'Current:'}
                        </div>
                        <code className={cn("text-sm", 
                          change.type === 'addition' ? 'text-success' :
                          change.type === 'modification' ? 'text-primary' :
                          'text-muted-foreground'
                        )}>{change.content}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-gradient-card shadow-custom-md">
                <CardHeader>
                  <CardTitle>Comments & Annotations</CardTitle>
                  <CardDescription>Discussion and feedback on document changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className={cn("border rounded-lg p-4", 
                        comment.resolved ? "bg-success/5 border-success/20" : "bg-card/50"
                      )}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">Line {comment.lineNumber}</Badge>
                            <span className="text-sm font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleCommentResolved(comment.id)}
                            className={cn("h-6 w-6 p-0", comment.resolved && "text-success")}
                          >
                            {comment.resolved ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </Button>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        {comment.resolved && (
                          <Badge variant="secondary" className="mt-2 text-xs bg-success/20 text-success">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="bg-gradient-card shadow-custom-md">
                <CardHeader>
                  <CardTitle>Add Comment</CardTitle>
                  <CardDescription>Annotate specific lines or sections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Line Number</label>
                    <Select value={selectedLine?.toString() || ""} onValueChange={(value) => setSelectedLine(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select line..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 20}, (_, i) => i + 1).map(line => (
                          <SelectItem key={line} value={line.toString()}>
                            Line {line}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comment</label>
                    <Textarea
                      placeholder="Add your comment or feedback..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    onClick={addComment} 
                    disabled={!newComment.trim() || selectedLine === null}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};