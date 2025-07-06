import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  Upload,
  FileText,
  Tags,
  Settings,
  Users,
  BarChart3,
  GitBranch,
  CheckCircle2,
  Brain,
  ArrowLeftRight,
  Database,
  Bell,
  Shield,
  Archive,
  Workflow,
  Target,
  TrendingUp,
  FileSearch,
  UserCheck,
  Clock,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "templates",
    label: "Processing",
    icon: FileText,
    children: [
      { id: "upload", label: "Upload Templates", icon: Upload, path: "/upload" },
      { id: "extraction", label: "Extract Tags", icon: Target, path: "/extraction" },
      { id: "tag-library", label: "Tag Library", icon: Database, path: "/tag-library" },
      { id: "library", label: "Template Library", icon: Archive, path: "/library" },
      { id: "versions", label: "Version Control", icon: GitBranch, path: "/versions" },
    ]
  },
  {
    id: "administration",
    label: "Administration",
    icon: Shield,
    children: [
      { id: "user-management", label: "User Management", icon: Users, path: "/users" },
      { id: "role-permissions", label: "Roles & Permissions", icon: Shield, path: "/permissions" },
      { id: "audit-logs", label: "Audit Logs", icon: Archive, path: "/audit-logs" },
      { id: "system-settings", label: "System Settings", icon: Settings, path: "/settings" },
    ]
  }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(["templates"]);
  const location = useLocation();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded && !collapsed}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-3 py-2.5 text-left font-normal",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
                collapsed && "px-2 justify-center"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  </>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.id} to={item.path || "/"}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start px-3 py-2.5 text-left font-normal",
            level > 0 && "ml-4 w-[calc(100%-1rem)]",
            collapsed && "px-2 justify-center",
            isActive(item.path) && "bg-accent text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-sm">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </div>
        </Button>
      </Link>
    );
  };

  return (
    <div className={cn(
      "relative bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">TCV Tool</h2>
              <p className="text-xs text-muted-foreground">Template Converter</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronRight className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </div>
  );
};