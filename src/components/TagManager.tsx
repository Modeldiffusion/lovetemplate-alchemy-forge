import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Link, BarChart3, Tag, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagItem {
  id: string;
  name: string;
  category: string;
  frequency: number;
  mappedTo?: string[];
  description?: string;
  confidence: number;
  lastUsed: string;
}

interface TagMapping {
  id: string;
  sourceTag: string;
  targetTags: string[];
  confidence: number;
  rules: string;
}

export const TagManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", category: "", description: "" });

  const [tags, setTags] = useState<TagItem[]>([]);
  const [mappings, setMappings] = useState<TagMapping[]>([]);

  const categories = ["all", "legal", "financial", "hr", "business", "general"];

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tag.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddTag = () => {
    if (newTag.name.trim()) {
      const tag: TagItem = {
        id: Date.now().toString(),
        name: newTag.name.toLowerCase(),
        category: newTag.category || "general",
        frequency: 0,
        confidence: 100,
        lastUsed: "Never",
        description: newTag.description
      };
      
      setTags(prev => [...prev, tag]);
      setNewTag({ name: "", category: "", description: "" });
      setIsAddingTag(false);
    }
  };

  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-success";
    if (confidence >= 85) return "text-primary";
    if (confidence >= 70) return "text-warning";
    return "text-destructive";
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      legal: "bg-blue-100 text-blue-800",
      financial: "bg-green-100 text-green-800",
      hr: "bg-purple-100 text-purple-800",
      business: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800"
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tag Management</h2>
          <p className="text-muted-foreground">Manage your tag library and intelligent mapping rules</p>
        </div>
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
              <DialogDescription>Create a new tag for your template library</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tag name..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tag-category">Category</Label>
                <Select value={newTag.category} onValueChange={(value) => setNewTag(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tag-description">Description</Label>
                <Textarea
                  id="tag-description"
                  value={newTag.description}
                  onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingTag(false)}>Cancel</Button>
              <Button onClick={handleAddTag}>Add Tag</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Tag Library</TabsTrigger>
          <TabsTrigger value="mappings">Smart Mappings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          {/* Search and Filter */}
          <Card className="bg-gradient-card shadow-custom-md">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag) => (
              <Card key={tag.id} className="bg-gradient-card shadow-custom-sm hover:shadow-custom-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={cn("w-fit text-xs", getCategoryColor(tag.category))}>
                    {tag.category}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tag.description && (
                    <p className="text-sm text-muted-foreground">{tag.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{tag.frequency}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className={cn("font-medium", getConfidenceColor(tag.confidence))}>
                      {tag.confidence}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last used:</span>
                    <span className="font-medium">{tag.lastUsed}</span>
                  </div>
                  
                  {tag.mappedTo && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1">
                        <Link className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Mapped to:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tag.mappedTo.map((mapped, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {mapped}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Smart Tag Mappings</CardTitle>
              <CardDescription>Intelligent rules that automatically map similar tags during processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="border rounded-lg p-4 bg-card/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="font-mono">
                          {mapping.sourceTag}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex space-x-1">
                          {mapping.targetTags.map((target, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {target}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn("text-sm font-medium", getConfidenceColor(mapping.confidence))}>
                          {mapping.confidence}%
                        </span>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{mapping.rules}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{tags.length}</div>
                    <p className="text-xs text-muted-foreground">Total Tags</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Link className="w-5 h-5 text-success" />
                  <div>
                    <div className="text-2xl font-bold">{mappings.length}</div>
                    <p className="text-xs text-muted-foreground">Active Mappings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-warning" />
                  <div>
                    <div className="text-2xl font-bold">94.5%</div>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Copy className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">1,294</div>
                    <p className="text-xs text-muted-foreground">Total Usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Most Used Tags</CardTitle>
              <CardDescription>Top performing tags by frequency and confidence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tags
                  .sort((a, b) => b.frequency - a.frequency)
                  .slice(0, 5)
                  .map((tag, index) => (
                    <div key={tag.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{tag.name}</p>
                          <Badge className={cn("text-xs", getCategoryColor(tag.category))}>
                            {tag.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{tag.frequency}</p>
                        <p className={cn("text-xs", getConfidenceColor(tag.confidence))}>
                          {tag.confidence}% confidence
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};