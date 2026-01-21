
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageLayout from "@/components/Layout/PageLayout";
import IssueCard from "@/components/Issues/IssueCard";
import { apiGetIssues, IssueRecord } from "@/services/api";
import { MapPin, Camera, Clock, ArrowRight, Map, AlertCircle, Users, CheckCircle, TrendingUp, Shield, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Issue } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianState } from "@/types/location";

const Index = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedIssues = await apiGetIssues();
        
        // Convert fetched issues to match our Issue type
        const formattedIssues = fetchedIssues.map((issue: IssueRecord, index: number) => {
          const id = issue.id || `issue-${index}`;
          
          // Properly handle image paths
          let imagePaths: string[] = [];
          if (issue.images && issue.images.length > 0) {
            imagePaths = issue.images;
          } else {
            imagePaths = ["/placeholder.svg"];
          }
          
          // Determine the state from location or default to "Unknown" (which is a valid IndianState)
          let state: IndianState = "Unknown";
          const location = issue.location || '';
          if (location.includes("Mumbai") || location.includes("Pune") || location.includes("Baramati") || location.includes("Maharashtra")) {
            state = "Maharashtra";
          } else if (location.includes("Delhi")) {
            state = "Delhi";
          } else if (location.includes("Bangalore") || location.includes("Bengaluru") || location.includes("Karnataka")) {
            state = "Karnataka";
          }
          
          return {
            id: id,
            title: issue.title || "Untitled Issue",
            description: issue.description || "No description provided",
            category: issue.category || "other",
            status: issue.status || "reported",
            priority: issue.priority || "medium",
            location: issue.locationData ? {
              lat: issue.locationData.lat,
              lng: issue.locationData.lng,
              address: issue.locationData.address,
              state: (issue.locationData.state as IndianState) || state,
              district: issue.locationData.district || "Unknown",
              city: issue.locationData.city || "Unknown",
              village: ""
            } : {
              lat: 0,
              lng: 0,
              address: issue.location || "Unknown location",
              state: state,
              district: "Unknown",
              city: "Unknown",
              village: ""
            },
            reportedBy: issue.reportedBy || "anonymous",
            reportedAt: new Date(issue.timestamp || Date.now()),
            images: imagePaths,
            duration: issue.duration || "Unknown",
            upvotes: issue.upvotes || 0,
            comments: []
          };
        });
        
        console.log("Formatted issues:", formattedIssues); // For debugging
        setIssues(formattedIssues);
      } catch (error) {
        console.error("Error fetching issues:", error);
        setError("Failed to load issues. Please try again later.");
        // Set empty array to prevent undefined issues
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };
    
    getIssues();
  }, []);

  // Get 3 recent issues for the preview section
  const recentIssues = [...issues].sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
  ).slice(0, 3);

  // Stats (mock data for now)
  const stats = [
    { label: 'Issues Reported', value: issues.length > 0 ? issues.length * 47 : '500+', icon: Megaphone },
    { label: 'Issues Resolved', value: issues.length > 0 ? Math.floor(issues.length * 32) : '350+', icon: CheckCircle },
    { label: 'Active Users', value: '2.5K+', icon: Users },
    { label: 'Cities Covered', value: '25+', icon: MapPin },
  ];

  return (
    <PageLayout className="pb-0">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF7722] via-[#FF8844] to-[#FF9F5A] text-white py-20 md:py-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full" />
        </div>
        
        <div className="civic-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Empowering Citizens Across India</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                Report Civic Issues &
                <span className="block mt-1 md:mt-2 text-white/90">Transform Your Community</span>
              </h1>
              <p className="text-base md:text-xl mb-6 md:mb-8 text-white/80 max-w-xl mx-auto lg:mx-0">
                Join thousands of citizens making their voices heard. Report issues, track progress, and build better neighborhoods together.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-[#FF7722] hover:bg-white/90 shadow-xl hover:shadow-2xl font-bold text-sm md:text-base h-12 md:h-14 px-6 md:px-8 transition-all duration-300 hover:-translate-y-1"
                >
                  <Link to="/report" className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 md:h-5 md:w-5" />
                    Report an Issue
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold text-sm md:text-base h-12 md:h-14 px-6 md:px-8 transition-all duration-300 hidden sm:flex"
                >
                  <Link to="/issues" className="flex items-center gap-2">
                    View All Issues
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl transform rotate-3" />
                <img 
                  src="/logo-hindi.png" 
                  alt="BOL BHARAT - Speak for Change" 
                  className="relative w-full max-w-md mx-auto rounded-2xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 bg-white relative z-20 -mt-8">
        <div className="civic-container">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group cursor-default"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FF7722]/10 rounded-xl mb-3 group-hover:bg-[#FF7722] transition-colors duration-300">
                  <stat.icon className="h-6 w-6 text-[#FF7722] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="civic-container">
          <div className="text-center mb-8 md:mb-14">
            <span className="inline-block text-[#FF7722] font-semibold text-sm uppercase tracking-wider mb-2 md:mb-3">Simple Process</span>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg px-4">
              Report civic issues in three simple steps and help make your community better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: "Take a Photo",
                description: "Capture the issue with your device's camera to provide visual context and evidence.",
                color: "bg-[#FF7722]",
                step: 1
              },
              {
                icon: MapPin,
                title: "Add Location",
                description: "Provide the location details so officials can find and fix the issue quickly.",
                color: "bg-civic-teal",
                step: 2
              },
              {
                icon: Clock,
                title: "Track Progress",
                description: "Submit your report and track its progress as it's reviewed and addressed.",
                color: "bg-civic-green",
                step: 3
              }
            ].map((item, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`absolute top-0 left-0 w-full h-1 ${item.color}`} />
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="relative inline-block mb-6">
                    <div className={`${item.color}/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`h-10 w-10 ${item.color === 'bg-[#FF7722]' ? 'text-[#FF7722]' : item.color === 'bg-civic-teal' ? 'text-civic-teal' : 'text-civic-green'}`} />
                    </div>
                    <div className={`absolute -top-2 -right-2 w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hide duplicate CTA button on mobile - users already saw it in hero */}
          <div className="text-center mt-8 md:mt-14 hidden md:block">
            <Button 
              asChild 
              size="lg" 
              className="bg-[#FF7722] hover:bg-[#FF7722]/90 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-14 px-8"
            >
              <Link to="/report" className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Report an Issue Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="civic-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-6 md:mb-10">
            <div>
              <span className="inline-block text-[#FF7722] font-semibold text-sm uppercase tracking-wider mb-1 md:mb-2">Explore</span>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Issue Map</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="group border-2 border-[#FF7722] text-[#FF7722] hover:bg-[#FF7722] hover:text-white transition-all duration-300 hidden md:flex">
              <Link to="/map" className="flex items-center gap-2">
                View Full Map
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
            <Link to="/map" className="relative group block">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-[200px] md:h-[350px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-cover bg-center" />
                <div className="text-center z-10">
                  <div className="w-20 h-20 bg-[#FF7722]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Map className="h-10 w-10 text-[#FF7722]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Explore reported issues across your community</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button asChild size="lg" className="bg-white text-[#FF7722] hover:bg-white/90 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Link to="/map" className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      View Interactive Map
                    </Link>
                  </Button>
                </div>
              </div>
            </Link>
            <CardContent className="p-4 md:p-6 bg-gray-50">
              <p className="text-gray-600 flex items-start gap-2 md:gap-3 text-sm md:text-base">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-[#FF7722] flex-shrink-0 mt-0.5" />
                <span className="hidden md:inline">Explore reported issues across your community. The interactive map helps you see problem areas and track resolution progress in real-time.</span>
                <span className="md:hidden">Tap to explore issues on the interactive map.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="civic-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-6 md:mb-10">
            <div>
              <span className="inline-block text-[#FF7722] font-semibold text-sm uppercase tracking-wider mb-1 md:mb-2">Latest Updates</span>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Recent Reports</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="group border-2 border-[#FF7722] text-[#FF7722] hover:bg-[#FF7722] hover:text-white transition-all duration-300 hidden md:flex">
              <Link to="/issues" className="flex items-center gap-2">
                View All Issues
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {error && (
            <div className="text-center p-8 bg-red-50 rounded-2xl mb-8 border border-red-100">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden rounded-xl border-0 shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-md w-full" />
                    <div className="h-4 bg-gray-100 rounded-md w-4/5" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-6 bg-gray-100 rounded-md w-20" />
                      <div className="h-6 bg-gray-100 rounded-md w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentIssues.length > 0 ? (
              recentIssues.map((issue, index) => (
                <div 
                  key={issue.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <IssueCard issue={issue} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Issues Reported Yet</h3>
                <p className="text-gray-500 mb-6">Be the first to report an issue in your community!</p>
                <Button asChild className="bg-[#FF7722] hover:bg-[#FF7722]/90">
                  <Link to="/report" className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Report an Issue
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative bg-gradient-to-br from-civic-dark via-[#1a2a38] to-civic-dark py-12 md:py-24 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF7722]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-civic-teal/10 rounded-full blur-3xl" />
        </div>
        <div className="civic-container text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Join the Movement</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">Make Your Voice Heard</h2>
          <p className="text-base md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto text-gray-300 px-4">
            Together we can build better communities. Every report brings us one step closer to a cleaner, safer India.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-[#FF7722] hover:bg-[#FF7722]/90 shadow-xl hover:shadow-2xl h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-semibold transition-all duration-300 hover:-translate-y-1"
            >
              <Link to="/report" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 md:h-5 md:w-5" />
                Report an Issue
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-semibold transition-all duration-300 hidden sm:flex"
            >
              <Link to="/about" className="flex items-center gap-2">
                Learn More
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
