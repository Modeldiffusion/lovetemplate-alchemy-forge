import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Tags, Settings, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { TemplateUpload } from "@/components/TemplateUpload";
import { TagManager } from "@/components/TagManager";
import { ConversionDashboard } from "@/components/ConversionDashboard";
import { AIConfiguration } from "@/components/AIConfiguration";
import { ReviewWorkflow } from "@/components/ReviewWorkflow";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data for dashboard metrics
  const metrics = {
    totalTemplates: 1247,
    pendingReview: 23,
    conversionRate: 94.5,
    avgProcessingTime: "2.3 min"
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Template Conversion Tool</h1>
                <p className="text-sm text-muted-foreground">AI-powered document transformation platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                Pro Plan
              </Badge>
              <Button variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mx-auto">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center space-x-2">
              <Tags className="w-4 h-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Convert</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Review</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-card shadow-custom-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTemplates.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
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
                    +2.1% from last week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-custom-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{metrics.avgProcessingTime}</div>
                  <p className="text-xs text-muted-foreground">
                    -0.5 min improvement
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card shadow-custom-md">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest template conversions and reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Contract Template v2.1", status: "approved", time: "2 min ago" },
                      { name: "Invoice Format Update", status: "processing", time: "5 min ago" },
                      { name: "Policy Document Rev", status: "pending", time: "12 min ago" },
                      { name: "User Manual Template", status: "approved", time: "1 hour ago" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <Badge 
                          variant={item.status === "approved" ? "default" : "secondary"}
                          className={
                            item.status === "approved" ? "bg-success text-success-foreground" :
                            item.status === "processing" ? "bg-status-processing text-white" :
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
                  <CardTitle>AI Configuration Status</CardTitle>
                  <CardDescription>Current LLM provider settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { provider: "OpenAI GPT-4", status: "active", health: "excellent" },
                      { provider: "Claude 3.5 Sonnet", status: "active", health: "good" },
                      { provider: "Gemini Pro", status: "standby", health: "good" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{item.provider}</p>
                          <p className="text-xs text-muted-foreground">Health: {item.health}</p>
                        </div>
                        <Badge 
                          variant={item.status === "active" ? "default" : "secondary"}
                          className={item.status === "active" ? "bg-success text-success-foreground" : ""}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <TemplateUpload />
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags">
            <TagManager />
          </TabsContent>

          {/* Conversion Tab */}
          <TabsContent value="conversion">
            <ConversionDashboard />
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review">
            <ReviewWorkflow />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;