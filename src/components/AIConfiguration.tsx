import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Zap, Brain, Key, TestTube, BarChart3, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LLMProvider {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  rateLimitRPM: number;
  rateLimitTPM: number;
  costPer1KTokens: number;
  health: 'excellent' | 'good' | 'poor';
  lastTested: string;
  responseTime: number;
}

interface TestResult {
  id: string;
  provider: string;
  testCase: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  success: boolean;
  responseTime: number;
  timestamp: string;
}

export const AIConfiguration = () => {
  const [providers, setProviders] = useState<LLMProvider[]>([
    {
      id: "1",
      name: "OpenAI GPT-4",
      status: "active",
      model: "gpt-4-turbo-preview",
      apiKey: "sk-*********************",
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: "You are an expert at analyzing and extracting tags from documents. Focus on identifying key themes, categories, and metadata.",
      rateLimitRPM: 500,
      rateLimitTPM: 30000,
      costPer1KTokens: 0.03,
      health: "excellent",
      lastTested: "5 minutes ago",
      responseTime: 1.2
    },
    {
      id: "2", 
      name: "Claude 3.5 Sonnet",
      status: "active",
      model: "claude-3-5-sonnet-20241022",
      apiKey: "sk-ant-*********************",
      maxTokens: 4096,
      temperature: 0.5,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: "You are an expert document analyzer. Extract relevant tags and metadata with high accuracy and consistency.",
      rateLimitRPM: 1000,
      rateLimitTPM: 40000,
      costPer1KTokens: 0.015,
      health: "good",
      lastTested: "12 minutes ago",
      responseTime: 0.8
    },
    {
      id: "3",
      name: "Google Gemini Pro",
      status: "inactive",
      model: "gemini-pro",
      apiKey: "AIza*********************",
      maxTokens: 2048,
      temperature: 0.6,
      topP: 0.95,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: "Analyze documents and extract meaningful tags and categories. Provide detailed and accurate results.",
      rateLimitRPM: 60,
      rateLimitTPM: 32000,
      costPer1KTokens: 0.001,
      health: "good",
      lastTested: "2 hours ago",
      responseTime: 2.1
    }
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: "1",
      provider: "OpenAI GPT-4",
      testCase: "Contract Analysis",
      input: "Legal contract for software licensing agreement...",
      expectedOutput: "contract, legal, software, licensing",
      actualOutput: "contract, legal, software, licensing, terms",
      success: true,
      responseTime: 1.1,
      timestamp: "2 minutes ago"
    }
  ]);

  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<LLMProvider>>({
    name: "",
    model: "",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: ""
  });

  const getStatusColor = (status: LLMProvider['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthColor = (health: LLMProvider['health']) => {
    switch (health) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      default:
        return 'text-warning';
    }
  };

  const handleProviderUpdate = (providerId: string, updates: Partial<LLMProvider>) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, ...updates } : provider
    ));
  };

  const handleTestProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    // Simulate API test
    const testInput = "This is a sample contract document for testing AI tag extraction capabilities.";
    
    setTimeout(() => {
      const newTest: TestResult = {
        id: Date.now().toString(),
        provider: provider.name,
        testCase: "API Connection Test",
        input: testInput,
        expectedOutput: "contract, document, legal",
        actualOutput: "contract, document, legal, testing",
        success: Math.random() > 0.2, // 80% success rate
        responseTime: Math.random() * 3 + 0.5,
        timestamp: "Just now"
      };
      
      setTestResults(prev => [newTest, ...prev]);
      
      // Update provider health
      handleProviderUpdate(providerId, {
        health: newTest.success ? 'excellent' : 'poor',
        lastTested: 'Just now',
        responseTime: newTest.responseTime
      });
    }, 2000);
  };

  const addProvider = () => {
    if (newProvider.name && newProvider.model && newProvider.apiKey) {
      const provider: LLMProvider = {
        id: Date.now().toString(),
        name: newProvider.name,
        status: 'inactive',
        model: newProvider.model,
        apiKey: newProvider.apiKey,
        maxTokens: newProvider.maxTokens || 4096,
        temperature: newProvider.temperature || 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        systemPrompt: newProvider.systemPrompt || "You are an expert document analyzer.",
        rateLimitRPM: 100,
        rateLimitTPM: 10000,
        costPer1KTokens: 0.01,
        health: 'good',
        lastTested: 'Never',
        responseTime: 0
      };
      
      setProviders(prev => [...prev, provider]);
      setNewProvider({});
      setIsAddingProvider(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Configuration</h2>
          <p className="text-muted-foreground">Configure and manage AI language models for tag extraction</p>
        </div>
        <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add AI Provider</DialogTitle>
              <DialogDescription>Configure a new AI language model provider</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={newProvider.name || ""}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., OpenAI GPT-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-model">Model</Label>
                  <Input
                    id="provider-model"
                    value={newProvider.model || ""}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., gpt-4-turbo-preview"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-api-key">API Key</Label>
                <Input
                  id="provider-api-key"
                  type="password"
                  value={newProvider.apiKey || ""}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-tokens">Max Tokens</Label>
                  <Input
                    id="provider-tokens"
                    type="number"
                    value={newProvider.maxTokens || ""}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    placeholder="4096"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-temperature">Temperature</Label>
                  <Input
                    id="provider-temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={newProvider.temperature || ""}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    placeholder="0.7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-prompt">System Prompt</Label>
                <Textarea
                  id="provider-prompt"
                  value={newProvider.systemPrompt || ""}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Enter system prompt for the AI model..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingProvider(false)}>Cancel</Button>
              <Button onClick={addProvider}>Add Provider</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="bg-gradient-card shadow-custom-md hover:shadow-custom-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge className={cn("text-xs", getStatusColor(provider.status))}>
                        {provider.status}
                      </Badge>
                      <Switch 
                        checked={provider.status === 'active'} 
                        onCheckedChange={(checked) => 
                          handleProviderUpdate(provider.id, { status: checked ? 'active' : 'inactive' })
                        }
                      />
                    </div>
                  </div>
                  <CardDescription className="font-mono text-xs">{provider.model}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Health:</span>
                        <span className={cn("font-medium capitalize", getHealthColor(provider.health))}>
                          {provider.health}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response:</span>
                        <span className="font-medium">{provider.responseTime.toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost/1K:</span>
                        <span className="font-medium">${provider.costPer1KTokens}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Tokens:</span>
                        <span className="font-medium">{provider.maxTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-medium">{provider.temperature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate Limit:</span>
                        <span className="font-medium">{provider.rateLimitRPM}/min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last tested: {provider.lastTested}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleTestProvider(provider.id)}
                    >
                      <TestTube className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          {selectedProvider ? (
            <Card className="bg-gradient-card shadow-custom-md">
              <CardHeader>
                <CardTitle>Configure {selectedProvider.name}</CardTitle>
                <CardDescription>Adjust model parameters and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input 
                        id="model"
                        value={selectedProvider.model}
                        onChange={(e) => handleProviderUpdate(selectedProvider.id, { model: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input 
                        id="api-key"
                        type="password"
                        value={selectedProvider.apiKey}
                        onChange={(e) => handleProviderUpdate(selectedProvider.id, { apiKey: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-tokens">Max Tokens: {selectedProvider.maxTokens}</Label>
                      <Slider
                        id="max-tokens"
                        min={1024}
                        max={8192}
                        step={256}
                        value={[selectedProvider.maxTokens]}
                        onValueChange={([value]) => handleProviderUpdate(selectedProvider.id, { maxTokens: value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature: {selectedProvider.temperature}</Label>
                      <Slider
                        id="temperature"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[selectedProvider.temperature]}
                        onValueChange={([value]) => handleProviderUpdate(selectedProvider.id, { temperature: value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="top-p">Top P: {selectedProvider.topP}</Label>
                      <Slider
                        id="top-p"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[selectedProvider.topP]}
                        onValueChange={([value]) => handleProviderUpdate(selectedProvider.id, { topP: value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequency-penalty">Frequency Penalty: {selectedProvider.frequencyPenalty}</Label>
                      <Slider
                        id="frequency-penalty"
                        min={-2}
                        max={2}
                        step={0.1}
                        value={[selectedProvider.frequencyPenalty]}
                        onValueChange={([value]) => handleProviderUpdate(selectedProvider.id, { frequencyPenalty: value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={selectedProvider.systemPrompt}
                    onChange={(e) => handleProviderUpdate(selectedProvider.id, { systemPrompt: e.target.value })}
                    rows={4}
                    placeholder="Enter the system prompt for this AI model..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                    Cancel
                  </Button>
                  <Button>
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-card shadow-custom-md">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a provider to configure its settings</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Recent API tests and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{result.provider}</p>
                          <p className="text-sm text-muted-foreground">{result.testCase}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn(
                          "mb-1",
                          result.success ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                        )}>
                          {result.success ? "Passed" : "Failed"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{result.timestamp}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Expected Output:</p>
                        <p className="font-mono text-xs bg-muted/20 p-2 rounded">{result.expectedOutput}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Actual Output:</p>
                        <p className="font-mono text-xs bg-muted/20 p-2 rounded">{result.actualOutput}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Response Time: {result.responseTime.toFixed(2)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">
                      {providers.filter(p => p.status === 'active').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Active Providers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-success" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(testResults.filter(r => r.success).length / testResults.length * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-warning" />
                  <div>
                    <div className="text-2xl font-bold">
                      {(providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length).toFixed(1)}s
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">{testResults.length}</div>
                    <p className="text-xs text-muted-foreground">Total Tests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Provider Health Overview</CardTitle>
              <CardDescription>Real-time status and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        provider.status === 'active' ? 'bg-success' : 
                        provider.status === 'error' ? 'bg-destructive' : 'bg-muted'
                      )} />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{provider.responseTime.toFixed(1)}s</p>
                        <p className="text-xs text-muted-foreground">Response</p>
                      </div>
                      <div className="text-center">
                        <p className={cn("font-medium", getHealthColor(provider.health))}>
                          {provider.health}
                        </p>
                        <p className="text-xs text-muted-foreground">Health</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">${provider.costPer1KTokens}</p>
                        <p className="text-xs text-muted-foreground">Cost/1K</p>
                      </div>
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