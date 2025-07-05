import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, BarChart3, TrendingUp, Users, Zap, AlertTriangle } from "lucide-react";

export const DashboardHome = () => {
  // Mock data for dashboard metrics
  const metrics = {
    totalTemplates: 1247,
    pendingReview: 23,
    conversionRate: 94.5,
    avgProcessingTime: "2.3 min",
    activeUsers: 156,
    aiProcessingJobs: 8,
    successfulConversions: 1174,
    failedConversions: 73
  };

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
            <div className="space-y-4">
              {[
                { name: "Contract Template v2.1", status: "approved", time: "2 min ago", user: "John Smith" },
                { name: "Invoice Format Update", status: "processing", time: "5 min ago", user: "Sarah Wilson" },
                { name: "Policy Document Rev", status: "pending", time: "12 min ago", user: "Mike Johnson" },
                { name: "User Manual Template", status: "approved", time: "1 hour ago", user: "Lisa Chen" },
                { name: "Terms of Service Update", status: "failed", time: "2 hours ago", user: "David Brown" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      by {item.user} • {item.time}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      item.status === "approved" ? "bg-success text-success-foreground" :
                      item.status === "processing" ? "bg-status-processing text-white" :
                      item.status === "failed" ? "bg-destructive text-destructive-foreground" :
                      "bg-warning text-warning-foreground"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-custom-md">
          <CardHeader>
            <CardTitle>AI Provider Status</CardTitle>
            <CardDescription>Current AI model health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { provider: "OpenAI GPT-4", status: "active", health: "excellent", responseTime: "1.2s", usage: "89%" },
                { provider: "Claude 3.5 Sonnet", status: "active", health: "good", responseTime: "0.8s", usage: "67%" },
                { provider: "Gemini Pro", status: "standby", health: "good", responseTime: "2.1s", usage: "12%" },
                { provider: "Custom Model", status: "maintenance", health: "poor", responseTime: "N/A", usage: "0%" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'active' ? 'bg-success' :
                      item.status === 'standby' ? 'bg-warning' :
                      'bg-destructive'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{item.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        Health: {item.health} • Response: {item.responseTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        item.status === 'active' ? 'border-success text-success' :
                        item.status === 'standby' ? 'border-warning text-warning' :
                        'border-destructive text-destructive'
                      }`}
                    >
                      {item.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Usage: {item.usage}
                    </p>
                  </div>
                </div>
              ))}
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
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <FileText className="w-6 h-6" />
              <span className="text-sm">Upload Templates</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Zap className="w-6 h-6" />
              <span className="text-sm">Start Batch Job</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm">Review Pending</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};