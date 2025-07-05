import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Eye, MessageSquare, User, ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  templateName: string;
  submissionDate: string;
  submitter: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'revision-requested';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reviewer?: string;
  reviewDate?: string;
  changes: ChangeItem[];
  comments: Comment[];
  originalTags: string[];
  proposedTags: string[];
  confidence: number;
}

interface ChangeItem {
  id: string;
  type: 'tag-addition' | 'tag-removal' | 'tag-modification' | 'format-change';
  before: string;
  after: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

interface Comment {
  id: string;
  author: string;
  date: string;
  message: string;
  type: 'comment' | 'approval' | 'rejection';
}

export const ReviewWorkflow = () => {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [reviewComment, setReviewComment] = useState("");
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  // Mock data for review items
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([
    {
      id: "1",
      templateName: "Updated Contract Template v3.0",
      submissionDate: "2 hours ago",
      submitter: "John Smith",
      status: "pending",
      priority: "high",
      changes: [
        {
          id: "1",
          type: "tag-addition",
          before: "",
          after: "compliance-2024",
          reason: "New regulatory requirements",
          impact: "high"
        },
        {
          id: "2", 
          type: "tag-modification",
          before: "contract",
          after: "legal-contract",
          reason: "More specific categorization",
          impact: "medium"
        }
      ],
      comments: [
        {
          id: "1",
          author: "John Smith",
          date: "2 hours ago",
          message: "Updated template to include new compliance requirements for 2024",
          type: "comment"
        }
      ],
      originalTags: ["contract", "legal", "template"],
      proposedTags: ["legal-contract", "compliance-2024", "template"],
      confidence: 94
    },
    {
      id: "2",
      templateName: "Invoice Processing Update",
      submissionDate: "5 hours ago",
      submitter: "Sarah Johnson",
      status: "in-review",
      priority: "medium",
      reviewer: "Mike Chen",
      reviewDate: "1 hour ago",
      changes: [
        {
          id: "3",
          type: "tag-removal",
          before: "old-format",
          after: "",
          reason: "Deprecated tag no longer needed",
          impact: "low"
        }
      ],
      comments: [
        {
          id: "2",
          author: "Sarah Johnson",
          date: "5 hours ago",
          message: "Removed deprecated tags and updated format",
          type: "comment"
        },
        {
          id: "3",
          author: "Mike Chen",
          date: "1 hour ago", 
          message: "Reviewing changes, looks good so far",
          type: "comment"
        }
      ],
      originalTags: ["invoice", "financial", "old-format"],
      proposedTags: ["invoice", "financial"],
      confidence: 98
    }
  ]);

  const getStatusColor = (status: ReviewItem['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      case 'in-review':
        return 'bg-status-processing text-white';
      case 'revision-requested':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: ReviewItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getChangeTypeIcon = (type: ChangeItem['type']) => {
    switch (type) {
      case 'tag-addition':
        return <div className="w-2 h-2 bg-success rounded-full" />;
      case 'tag-removal':
        return <div className="w-2 h-2 bg-destructive rounded-full" />;
      case 'tag-modification':
        return <div className="w-2 h-2 bg-warning rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-primary rounded-full" />;
    }
  };

  const handleReviewAction = (itemId: string, action: 'approve' | 'reject' | 'request-revision') => {
    setReviewItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStatus = action === 'approve' ? 'approved' : 
                         action === 'reject' ? 'rejected' : 'revision-requested';
        
        const newComment: Comment = {
          id: Date.now().toString(),
          author: "Current Reviewer",
          date: "Just now",
          message: reviewComment || `Item ${action}d`,
          type: action === 'approve' ? 'approval' : action === 'reject' ? 'rejection' : 'comment'
        };

        return {
          ...item,
          status: newStatus,
          reviewer: "Current Reviewer",
          reviewDate: "Just now",
          comments: [...item.comments, newComment]
        };
      }
      return item;
    }));
    
    setReviewComment("");
    setSelectedItem(null);
  };

  const filteredItems = reviewItems.filter(item => {
    const statusMatch = selectedStatus === "all" || item.status === selectedStatus;
    const priorityMatch = selectedPriority === "all" || item.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Review Workflow</h2>
          <p className="text-muted-foreground">Multi-stage review process for template changes and conversions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {reviewItems.filter(item => item.status === 'pending').length} Pending
          </Badge>
          <Button className="bg-gradient-primary hover:shadow-glow">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Bulk Approve
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gradient-card shadow-custom-md">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Review Items */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-gradient-card shadow-custom-md hover:shadow-custom-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{item.templateName}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={cn("text-xs", getStatusColor(item.status))}>
                            {item.status.replace('-', ' ')}
                          </Badge>
                          <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>{item.templateName}</DialogTitle>
                          <DialogDescription>
                            Submitted by {item.submitter} • {item.submissionDate}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-6 pr-4">
                            {/* Tag Changes */}
                            <div className="space-y-4">
                              <h4 className="font-semibold">Tag Changes</h4>
                              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium mb-2">Original Tags</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.originalTags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium mb-2">Proposed Tags</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.proposedTags.map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Changes */}
                            <div className="space-y-4">
                              <h4 className="font-semibold">Change Details</h4>
                              <div className="space-y-3">
                                {item.changes.map((change) => (
                                  <div key={change.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                    {getChangeTypeIcon(change.type)}
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium capitalize">
                                          {change.type.replace('-', ' ')}
                                        </span>
                                        <Badge 
                                          variant="outline" 
                                          className={cn(
                                            "text-xs",
                                            change.impact === 'high' ? 'border-destructive text-destructive' :
                                            change.impact === 'medium' ? 'border-warning text-warning' :
                                            'border-muted-foreground text-muted-foreground'
                                          )}
                                        >
                                          {change.impact} impact
                                        </Badge>
                                      </div>
                                      {change.before && (
                                        <p className="text-sm text-muted-foreground">
                                          From: <span className="font-mono">{change.before}</span>
                                        </p>
                                      )}
                                      {change.after && (
                                        <p className="text-sm text-muted-foreground">
                                          To: <span className="font-mono">{change.after}</span>
                                        </p>
                                      )}
                                      <p className="text-sm">{change.reason}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4">
                              <h4 className="font-semibold">Comments & History</h4>
                              <div className="space-y-3">
                                {item.comments.map((comment) => (
                                  <div key={comment.id} className="flex items-start space-x-3 p-3 bg-muted/10 rounded-lg">
                                    <User className="w-4 h-4 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium">{comment.author}</span>
                                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                                        {comment.type !== 'comment' && (
                                          <Badge 
                                            variant="outline" 
                                            className={cn(
                                              "text-xs",
                                              comment.type === 'approval' ? 'border-success text-success' :
                                              'border-destructive text-destructive'
                                            )}
                                          >
                                            {comment.type}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm">{comment.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Review Actions */}
                            {item.status === 'pending' || item.status === 'in-review' ? (
                              <div className="space-y-4 border-t pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="review-comment">Review Comment</Label>
                                  <Textarea
                                    id="review-comment"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Add your review comments..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleReviewAction(item.id, 'request-revision')}
                                  >
                                    Request Revision
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleReviewAction(item.id, 'reject')}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button 
                                    className="bg-success hover:bg-success/90 text-success-foreground"
                                    onClick={() => handleReviewAction(item.id, 'approve')}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{item.submitter}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{item.submissionDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">
                        {item.changes.length} changes
                      </span>
                      <span className="text-muted-foreground">
                        {item.comments.length} comments
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Confidence: </span>
                      <span className="font-medium text-success">{item.confidence}%</span>
                    </div>
                    {item.reviewer && (
                      <div className="text-sm text-muted-foreground">
                        Reviewer: {item.reviewer}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Items In Review</CardTitle>
              <CardDescription>Currently being reviewed by team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewItems.filter(item => item.status === 'in-review').map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.templateName}</p>
                      <p className="text-sm text-muted-foreground">
                        Reviewing by {item.reviewer} • Started {item.reviewDate}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle>Completed Reviews</CardTitle>
              <CardDescription>Recently approved, rejected, or revised items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewItems.filter(item => 
                  item.status === 'approved' || 
                  item.status === 'rejected' || 
                  item.status === 'revision-requested'
                ).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.templateName}</p>
                      <p className="text-sm text-muted-foreground">
                        By {item.reviewer} • {item.reviewDate}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", getStatusColor(item.status))}>
                      {item.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {reviewItems.filter(item => item.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-success">
                  {reviewItems.filter(item => item.status === 'approved').length}
                </div>
                <p className="text-xs text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-destructive">
                  {reviewItems.filter(item => item.status === 'rejected').length}
                </div>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-custom-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-warning">
                  {Math.round(
                    (reviewItems.filter(item => item.status === 'approved').length / 
                     reviewItems.length) * 100
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">Approval Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};