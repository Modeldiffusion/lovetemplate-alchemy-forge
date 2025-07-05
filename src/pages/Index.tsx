import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHome } from "@/components/DashboardHome";
import { TemplateUpload } from "@/components/TemplateUpload";
import { AIConfiguration } from "@/components/AIConfiguration";
import { TagManager } from "@/components/TagManager";
import { TagMappingInterface } from "@/components/TagMappingInterface";
import { ConversionDashboard } from "@/components/ConversionDashboard";
import { DocumentComparison } from "@/components/DocumentComparison";
import { ReviewWorkflow } from "@/components/ReviewWorkflow";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const renderContent = () => {
    switch (location.pathname) {
      case '/upload':
        return <TemplateUpload />;
      case '/library':
        return <TemplateUpload />; // Reuse for now
      case '/versions':
        return <DashboardHome />; // Placeholder
      case '/ai-config':
        return <AIConfiguration />;
      case '/tag-extraction':
        return <AIConfiguration />; // Related functionality
      case '/batch-processing':
        return <ConversionDashboard />; // Related functionality
      case '/tags':
        return <TagManager />;
      case '/tag-mapping':
        return <TagMappingInterface />;
      case '/tag-analytics':
        return <DashboardHome />; // Placeholder
      case '/conversion':
        return <ConversionDashboard />;
      case '/compare':
        return <DocumentComparison />;
      case '/conversion-templates':
        return <TemplateUpload />; // Related functionality
      case '/review':
        return <ReviewWorkflow />;
      case '/review-history':
        return <ReviewWorkflow />; // Related functionality
      case '/workflow-config':
        return <ReviewWorkflow />; // Related functionality
      case '/change-requests':
        return <DashboardHome />; // Placeholder
      case '/impact-analysis':
        return <DashboardHome />; // Placeholder
      case '/deployment':
        return <DashboardHome />; // Placeholder
      case '/analytics':
        return <DashboardHome />; // Already has analytics
      case '/usage-stats':
        return <DashboardHome />; // Related functionality
      case '/ai-performance':
        return <AIConfiguration />; // Related functionality
      case '/users':
        return <DashboardHome />; // Placeholder
      case '/permissions':
        return <DashboardHome />; // Placeholder
      case '/audit-logs':
        return <DashboardHome />; // Placeholder
      case '/settings':
        return <AIConfiguration />; // Related functionality
      case '/notifications':
        return <DashboardHome />; // Placeholder
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm h-16">
          <div className="container mx-auto px-6 py-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">AI-powered document transformation platform</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">U</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;