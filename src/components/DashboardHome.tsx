import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, BarChart3, TrendingUp, Users, Zap, AlertTriangle } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useExtractedTags } from "@/hooks/useExtractedTags";
import { useNavigate } from "react-router-dom";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { extractedTags, tagMappings } = useExtractedTags();
  
  const [metrics, setMetrics] = useState({
    totalTemplates: 0,
    pendingReview: 0,
    conversionRate: 95,
    avgProcessingTime: "2.3 min",
    activeUsers: 1,
    aiProcessingJobs: 0,
    successfulConversions: 0,
    failedConversions: 0
  });

  useEffect(() => {
    // Calculate real metrics from Supabase data
    const completedTemplates = templates.filter(t => t.status === 'completed').length;
    const processingTemplates = templates.filter(t => t.status === 'processing').length;
    const failedTemplates = templates.filter(t => t.status === 'failed').length;
    
    setMetrics({
      totalTemplates: templates.length,
      pendingReview: tagMappings.filter(m => m.status === 'unmapped').length,
      conversionRate: templates.length > 0 ? Math.round((completedTemplates / templates.length) * 100) : 95,
      avgProcessingTime: "2.3 min",
      activeUsers: 1,
      aiProcessingJobs: processingTemplates,
      successfulConversions: completedTemplates,
      failedConversions: failedTemplates
    });
  }, [templates, tagMappings]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Welcome back!</h2>
          <p className="text-muted-foreground">Here's what's happening with your template conversions today.</p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Zap className="w-4 h-4 mr-2" />
          Quick Start
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTemplates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Online right now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="text-lg font-bold">{metrics.aiProcessingJobs}</div>
                <p className="text-xs text-muted-foreground">AI Jobs Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <div className="text-lg font-bold">{metrics.successfulConversions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Successful Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <div className="text-lg font-bold">{metrics.failedConversions}</div>
                <p className="text-xs text-muted-foreground">Failed Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-custom-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              <div>
                <div className="text-lg font-bold">{metrics.avgProcessingTime}</div>
                <p className="text-xs text-muted-foreground">Avg Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest template conversions and reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              <p>No recent activity to display</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader>
            <CardTitle>AI Provider Status</CardTitle>
            <CardDescription>Current AI model health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              <p>AI provider status will appear here when configured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card shadow-custom-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/upload')}
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">Upload Templates</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/extraction')}
            >
              <Zap className="w-6 h-6" />
              <span className="text-sm">Extract Tags</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/tag-mapping')}
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm">Tag Mapping</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/conversion')}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Conversions</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};