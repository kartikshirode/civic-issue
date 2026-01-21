import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { statusOptions, priorityOptions, categoryOptions } from "@/data/mockData";
import PageLayout from "@/components/Layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { MapPin, Clock, ThumbsUp, ArrowLeft, Calendar, Share2 } from "lucide-react";
import { Issue } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { onValue, ref, get, update } from "firebase/database"; // Import Firebase operations
import { db } from "@/lib/utils"; // Import Firebase database instance

const IssueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSupported, setHasSupported] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage to see if user has already supported this issue
    const supportedIssues = JSON.parse(localStorage.getItem('supportedIssues') || '[]');
    setHasSupported(supportedIssues.includes(id));
    
    const fetchIssue = async () => {
      if (!id) {
        setError("Issue ID is missing");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Fetch directly from Firebase
      try {
        if (!db) {
          throw new Error("Firebase database is not initialized");
        }
        
        // Use Firebase SDK instead of fetch
        const issueRef = ref(db, `issues/${id}`);
        const snapshot = await get(issueRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Convert Firebase format to our app format
          const formattedIssue: Issue = {
            id: id || '',
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'other',
            status: data.status || 'reported',
            priority: data.priority || 'medium',
            location: {
              lat: 0,
              lng: 0,
              address: data.location || '',
              state: data.location?.includes("Maharashtra") ? "Maharashtra" : "Unknown",
              district: data.location?.includes("Baramati") ? "Pune" : 
                      data.location?.includes("Pune") ? "Pune" : 
                      data.location?.includes("Mumbai") ? "Mumbai" : "",
              city: data.location?.includes("Baramati") ? "Baramati" : 
                   data.location?.includes("Pune") ? "Pune" : 
                   data.location?.includes("Mumbai") ? "Mumbai" : "",
              village: ""
            },
            reportedBy: 'user1',
            reportedAt: new Date(data.timestamp || Date.now()),
            images: data.image ? [data.image] : [],
            duration: data.duration || '',
            upvotes: data.upvotes || 0,
            comments: []
          };
          
          setIssue(formattedIssue);
        } else {
          setError("Issue not found");
          navigate('/issues/not-found', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching issue:', error);
        setError(error instanceof Error ? error.message : "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id, navigate]);

  // Set up real-time listener for upvotes
  useEffect(() => {
    if (!id || !db || !issue || issue.id !== id) return;
    
    const upvotesRef = ref(db, `issues/${id}/upvotes`);
    const unsubscribe = onValue(upvotesRef, (snapshot) => {
      const upvotes = snapshot.val() || 0;
      setIssue(currentIssue => 
        currentIssue ? { ...currentIssue, upvotes } : null
      );
    }, (error) => {
      console.error('Error listening to upvotes:', error);
    });
    
    return () => unsubscribe();
  }, [id, issue, db]);

  const handleSupport = async () => {
    if (hasSupported || !issue || !id) return;
    
    try {
      // Update the database for all issues
      if (!db) {
        throw new Error("Firebase database is not initialized");
      }
      
      const upvotesRef = ref(db, `issues/${id}/upvotes`);
      await update(upvotesRef.parent, {
        upvotes: (issue.upvotes || 0) + 1
      });
      
      // Store in localStorage to prevent multiple upvotes
      const supportedIssues = JSON.parse(localStorage.getItem('supportedIssues') || '[]');
      supportedIssues.push(id);
      localStorage.setItem('supportedIssues', JSON.stringify(supportedIssues));
      setHasSupported(true);
      
      toast({
        title: "Thanks for your support!",
        description: "Your vote has been counted.",
      });
    } catch (error) {
      console.error('Error supporting issue:', error);
      toast({
        title: "Failed to support",
        description: "There was an error recording your support. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: issue?.title,
        text: `Check out this community issue: ${issue?.title}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copied to clipboard",
          description: "You can now share it with others.",
        });
      }).catch(err => {
        console.error('Error copying link:', err);
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !issue) {
    return (
      <PageLayout>
        <div className="container py-10">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Issue Not Found</h1>
            <p className="text-muted-foreground">
              {error || "The issue you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link to="/issues">Back to Issues</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-6">
        <div className="space-y-8">
          {/* Back button */}
          <Button variant="ghost" asChild className="pl-0">
            <Link to="/issues" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Issues
            </Link>
          </Button>
          
          {/* Issue title and metadata */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{issue.title}</h1>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{issue.location.address || "Unknown location"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Reported on {format(issue.reportedAt, 'PPP')}</span>
              </div>
              {issue.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Expected resolution: {issue.duration}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Category badge */}
              <Badge variant="outline" className="font-normal">
                {categoryOptions.find(c => c.value === issue.category)?.label || "Other"}
              </Badge>
              
              {/* Status badge */}
              <Badge 
                className={`${statusOptions.find(s => s.value === issue.status)?.color || "bg-gray-500"} text-white`}
              >
                {statusOptions.find(s => s.value === issue.status)?.label || "Unknown Status"}
              </Badge>
              
              {/* Priority badge */}
              <Badge variant="outline" className={`
                ${issue.priority === 'high' ? 'text-red-600 border-red-300' : 
                 issue.priority === 'medium' ? 'text-amber-600 border-amber-300' : 
                 'text-blue-600 border-blue-300'}
              `}>
                {priorityOptions.find(p => p.value === issue.priority)?.label || "Medium Priority"}
              </Badge>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Issue details and images */}
            <div className="col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-line">{issue.description}</p>
                </CardContent>
              </Card>
              
              {/* Images gallery */}
              {issue.images && issue.images.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {issue.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-video rounded-md overflow-hidden bg-gray-100"
                      >
                        <img 
                          src={image} 
                          alt={`Issue ${index + 1}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Handle image load errors
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar with actions */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">{issue.upvotes || 0} supporters</span>
                    </div>
                    <Button 
                      variant={hasSupported ? "outline" : "default"}
                      size="sm" 
                      onClick={handleSupport}
                      disabled={hasSupported}
                    >
                      {hasSupported ? "Supported" : "Support"}
                    </Button>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default IssueDetail;
