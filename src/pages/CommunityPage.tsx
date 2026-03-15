/**
 * Community Page
 * Displays trending issues, allows users to upvote/like complaints
 * to increase visibility to government departments
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/Layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ThumbsUp, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Building2, 
  Users, 
  Search,
  ArrowUp,
  MessageCircle,
  Share2,
  Filter,
  Flame,
  Star
} from "lucide-react";
import { Issue, IssueCategory } from "@/types";
import { subscribeToIssues, upvoteIssue, IssueRecord } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { normalizeIssueImages } from "@/lib/images";

// Convert IssueRecord to Issue
const convertToIssue = (record: IssueRecord): Issue => ({
  id: record.id || '',
  title: record.title,
  description: record.description,
  category: record.category,
  status: record.status,
  priority: record.priority,
  location: record.locationData || {
    lat: 0,
    lng: 0,
    address: typeof record.location === 'string' ? record.location : ''
  },
  reportedBy: record.reportedBy,
  reportedAt: new Date(record.timestamp),
  images: normalizeIssueImages(record.images, ""),
  duration: record.duration,
  upvotes: record.upvotes || 0,
  comments: [],
  department: record.department,
  departmentShortName: record.departmentShortName,
  departmentStatus: record.departmentStatus
});

// Category colors for badges
const categoryColors: Record<IssueCategory, string> = {
  'roads': 'bg-orange-100 text-orange-700 border-orange-200',
  'water': 'bg-blue-100 text-blue-700 border-blue-200',
  'electricity': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'sanitation': 'bg-green-100 text-green-700 border-green-200',
  'public-spaces': 'bg-purple-100 text-purple-700 border-purple-200',
  'transportation': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'other': 'bg-gray-100 text-gray-700 border-gray-200'
};

const CommunityPage = () => {
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [votedIssues, setVotedIssues] = useState<Set<string>>(new Set());
  
  // Load voted issues from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('bol-bharat-voted-issues');
    if (stored) {
      setVotedIssues(new Set(JSON.parse(stored)));
    }
  }, []);
  
  // Subscribe to real-time issues
  useEffect(() => {
    const unsubscribe = subscribeToIssues((fetchedIssues) => {
      setIssues(fetchedIssues.map(convertToIssue));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Handle upvote
  const handleUpvote = async (issueId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (votedIssues.has(issueId)) {
      toast({
        title: "Already Voted",
        description: "You have already supported this issue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await upvoteIssue(issueId);
      
      // Update local state
      const newVoted = new Set(votedIssues);
      newVoted.add(issueId);
      setVotedIssues(newVoted);
      localStorage.setItem('bol-bharat-voted-issues', JSON.stringify([...newVoted]));
      
      toast({
        title: "Vote Recorded!",
        description: "Your support helps this issue get more attention.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Filter and sort issues
  const getFilteredIssues = (sortBy: 'trending' | 'recent' | 'urgent') => {
    let filtered = [...issues];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.location.address?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }
    
    // Sort
    switch (sortBy) {
      case 'trending':
        return filtered.sort((a, b) => b.upvotes - a.upvotes);
      case 'recent':
        return filtered.sort((a, b) => 
          new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        );
      case 'urgent':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      default:
        return filtered;
    }
  };
  
  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };
  
  // Issue Card Component
  const IssueCard = ({ issue, rank }: { issue: Issue; rank?: number }) => (
    <Link to={`/issues/${issue.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 hover:border-[#FF7722]/50 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Rank Badge (for trending) */}
            {rank && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                rank === 1 ? 'bg-yellow-500' : 
                rank === 2 ? 'bg-gray-400' : 
                rank === 3 ? 'bg-amber-600' : 'bg-gray-300'
              }`}>
                {rank}
              </div>
            )}
            
            {/* Image */}
            {issue.images[0] && (
              <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={issue.images[0]} 
                  alt={issue.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#FF7722] transition-colors line-clamp-1">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {issue.description}
                  </p>
                </div>
                
                {/* Upvote Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleUpvote(issue.id, e)}
                  className={`flex-shrink-0 flex items-center sm:flex-col gap-1 h-9 sm:h-auto py-1.5 sm:py-2 px-2.5 sm:px-3 ${
                    votedIssues.has(issue.id) 
                      ? 'bg-[#FF7722] text-white border-[#FF7722] hover:bg-[#E56610]' 
                      : 'hover:border-[#FF7722] hover:text-[#FF7722]'
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-xs font-bold">{issue.upvotes}</span>
                </Button>
              </div>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className={categoryColors[issue.category]}>
                  {issue.category.replace('-', ' ')}
                </Badge>
                
                {issue.departmentShortName && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-600 bg-green-50">
                    <Building2 className="h-3 w-3 mr-1" />
                    {issue.departmentShortName}
                  </Badge>
                )}
                
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {issue.location.address?.split(',')[0]}
                </span>
                
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(issue.reportedAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
  
  // Stats Section
  const stats = {
    totalIssues: issues.length,
    totalVotes: issues.reduce((sum, i) => sum + i.upvotes, 0),
    activeUsers: new Set(issues.map(i => i.reportedBy)).size,
    resolvedToday: issues.filter(i => i.status === 'resolved').length
  };
  
  return (
    <PageLayout>
      <div className="civic-container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-[#FF7722]" />
            Community Voice
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Support issues that matter to you. More votes = More visibility to government departments.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-[#FF7722]/10 to-[#FF9F5A]/10 border-[#FF7722]/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-[#FF7722]">{stats.totalIssues}</div>
              <div className="text-sm text-gray-600">Total Issues</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalVotes}</div>
              <div className="text-sm text-gray-600">Community Votes</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Citizens</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.resolvedToday}</div>
              <div className="text-sm text-gray-600">Issues Resolved</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title, issue, or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 ${selectedCategory === 'all' ? 'bg-[#FF7722] hover:bg-[#E56610]' : ''}`}
            >
              All
            </Button>
            {Object.keys(categoryColors).slice(0, 4).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat as IssueCategory)}
                className={`shrink-0 ${selectedCategory === cat ? 'bg-[#FF7722] hover:bg-[#E56610]' : ''}`}
              >
                {cat.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Trending</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="urgent" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Urgent</span>
              <span className="sm:hidden">SOS</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Trending Issues */}
          <TabsContent value="trending">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading issues...</div>
            ) : (
              <div className="space-y-4">
                {getFilteredIssues('trending').slice(0, 20).map((issue, index) => (
                  <IssueCard key={issue.id} issue={issue} rank={index < 3 ? index + 1 : undefined} />
                ))}
                {getFilteredIssues('trending').length === 0 && (
                  <div className="text-center py-12 text-gray-500">No issues found matching your criteria.</div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Recent Issues */}
          <TabsContent value="recent">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading issues...</div>
            ) : (
              <div className="space-y-4">
                {getFilteredIssues('recent').slice(0, 20).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
                {getFilteredIssues('recent').length === 0 && (
                  <div className="text-center py-12 text-gray-500">No issues found matching your criteria.</div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Urgent Issues */}
          <TabsContent value="urgent">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading issues...</div>
            ) : (
              <div className="space-y-4">
                {getFilteredIssues('urgent').slice(0, 20).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
                {getFilteredIssues('urgent').length === 0 && (
                  <div className="text-center py-12 text-gray-500">No issues found matching your criteria.</div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* How it works */}
        <Card className="mt-12 bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">How Community Voting Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FF7722] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-medium">Browse Issues</h4>
                  <p className="text-sm text-gray-500">View civic issues reported by citizens in your area</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FF7722] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-medium">Vote to Support</h4>
                  <p className="text-sm text-gray-500">Click the upvote button on issues that affect you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FF7722] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-medium">Increase Visibility</h4>
                  <p className="text-sm text-gray-500">More votes = Higher priority for government action</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CommunityPage;
