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
      case '/ai-config':
        return <AIConfiguration />;
      case '/tags':
        return <TagManager />;
      case '/tag-mapping':
        return <TagMappingInterface />;
      case '/conversion':
        return <ConversionDashboard />;
      case '/compare':
        return <DocumentComparison />;
      case '/review':
        return <ReviewWorkflow />;
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