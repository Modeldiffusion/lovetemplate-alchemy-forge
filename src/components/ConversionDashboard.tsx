import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Play, Pause, RefreshCw, Download, Eye, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionJob {
  id: string;
  templateName: string;
  sourceFormat: string;
  targetFormat: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: string;
  estimatedTime?: string;
  completedTime?: string;
  inputTags: string[];
  outputTags: string[];
  errorMessage?: string;
  previewAvailable: boolean;
}

interface ConversionTemplate {
  id: string;
  name: string;
  description: string;
  sourceFormat: string;
  targetFormat: string;
  rules: string[];
  successRate: number;
  avgProcessingTime: string;
}

export const ConversionDashboard = () => {
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const templates: ConversionTemplate[] = [];

  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'processing':
        return 'bg-status-processing text-white';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      case 'paused':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <FileText className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleJobAction = (jobId: string, action: 'pause' | 'resume' | 'retry' | 'cancel') => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        switch (action) {
          case 'pause':
            return { ...job, status: 'paused' as const };
          case 'resume':
            return { ...job, status: 'processing' as const };
          case 'retry':
            return { ...job, status: 'processing' as const, progress: 0, errorMessage: undefined };
          case 'cancel':
            return { ...job, status: 'failed' as const };
          default:
            return job;
        }
      }
      return job;
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const formatMatch = selectedFormat === "all" || 
                       job.sourceFormat.toLowerCase() === selectedFormat.toLowerCase() ||
                       job.targetFormat.toLowerCase() === selectedFormat.toLowerCase();
    const statusMatch = selectedStatus === "all" || job.status === selectedStatus;
    return formatMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Conversion Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage template conversion processes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? "List View" : "Grid View"}
          </Button>
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Play className="w-4 h-4 mr-2" />
            Start Batch
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="templates">Conversion Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gradient-card shadow-custom-md">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1">
                  <Input placeholder="Search jobs..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Display */}
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
              : "space-y-4"
          )}>
            {filteredJobs.map((job) => (
              <Card key={job.id} className="bg-gradient-card shadow-custom-md hover:shadow-custom-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-lg">{job.templateName}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {job.sourceFormat}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {job.targetFormat}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getStatusColor(job.status))}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                      {job.estimatedTime && (
                        <p className="text-xs text-muted-foreground">{job.estimatedTime}</p>
                      )}
                    </div>
                  )}

                  {/* Time Information */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Started: {job.startTime}</span>
                    {job.completedTime && <span>Completed: {job.completedTime}</span>}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    {job.inputTags.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Input Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.inputTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {job.outputTags.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Output Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.outputTags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {job.errorMessage && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">{job.errorMessage}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      {job.status === 'processing' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'pause')}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'resume')}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {job.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleJobAction(job.id, 'retry')}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {job.previewAvailable && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                      )}
                      
                      {job.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gradient-card shadow-custom-md hover:shadow-custom-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <Badge className="bg-success text-success-foreground">
                      {template.successRate}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{template.sourceFormat}</Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge variant="outline" className="text-xs">{template.targetFormat}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Time:</span>
                    <span className="font-medium">{template.avgProcessingTime}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Conversion Rules:</p>
                    <ul className="text-xs space-y-1">
                      {template.rules.map((rule, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button className="w-full mt-4">
                    <Play className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>Complete log of all conversion activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {jobs.filter(job => job.status === 'completed' || job.status === 'failed').map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.templateName}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.sourceFormat} → {job.targetFormat}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn("mb-2", getStatusColor(job.status))}>
                          {job.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {job.completedTime || job.startTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};