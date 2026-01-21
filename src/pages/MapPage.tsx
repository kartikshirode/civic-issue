import PageLayout from "@/components/Layout/PageLayout";
import { Card } from "@/components/ui/card";
import { apiGetIssues, IssueRecord } from "@/services/api";
import { useEffect, useState } from "react";
import { Issue } from "@/types";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { IndianState } from "@/types/location";

const MapPage = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getIssues = async () => {
      try {
        setLoading(true);
        const fetchedIssues = await apiGetIssues();
        
        // Convert fetched issues to match our Issue type
        const formattedIssues = fetchedIssues.map((issue: IssueRecord, index: number) => {
          const id = issue.id || `issue-${index}`;
          
          // Determine state from location
          let state: IndianState = "Unknown";
          const location = issue.location || '';
          if (location.includes("Maharashtra") || location.includes("Mumbai") || location.includes("Pune")) {
            state = "Maharashtra";
          } else if (location.includes("Delhi")) {
            state = "Delhi";
          } else if (location.includes("Karnataka") || location.includes("Bangalore")) {
            state = "Karnataka";
          }
          
          return {
            id: id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            status: issue.status || "reported",
            priority: issue.priority || "medium",
            location: issue.locationData ? {
              lat: issue.locationData.lat,
              lng: issue.locationData.lng,
              address: issue.locationData.address,
              state: (issue.locationData.state as IndianState) || state,
              district: issue.locationData.district || '',
              city: issue.locationData.city || '',
              village: ''
            } : {
              lat: 0,
              lng: 0,
              address: issue.location || "Unknown",
              state,
              district: '',
              city: '',
              village: ''
            },
            reportedBy: issue.reportedBy || "anonymous",
            reportedAt: new Date(issue.timestamp || Date.now()),
            images: issue.images?.length > 0 ? issue.images : ["/placeholder.svg"],
            duration: issue.duration || "Unknown",
            upvotes: issue.upvotes || 0,
            comments: []
          };
        });
        
        setIssues(formattedIssues);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getIssues();
  }, []);

  return (
    <PageLayout>
      <div className="civic-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issue Map</h1>
          <p className="text-gray-600">
            View all reported issues on the map to see what's happening in your area.
          </p>
        </div>
        
        <Card className="p-4 rounded-lg shadow-md border border-gray-200">
          <div className="bg-gray-100 w-full h-[600px] rounded relative">
            {/* Simple map representation */}
            <div className="absolute inset-0 bg-gray-200 opacity-50 rounded"></div>
            
            {/* Map issue markers */}
            {!loading && issues.map((issue, index) => (
              <div 
                key={issue.id}
                className="absolute cursor-pointer"
                style={{ 
                  left: `${20 + index * 15}%`, 
                  top: `${30 + (index % 3) * 20}%` 
                }}
              >
                <div className="relative group">
                  <div className="flex flex-col items-center">
                    <MapPin className="h-8 w-8 text-civic-blue fill-current" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 w-64 bg-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <h3 className="font-semibold text-lg truncate">{issue.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 truncate">{issue.location.address}</p>
                      <p className="text-xs text-gray-500">Reported: {issue.reportedAt.toLocaleDateString()}</p>
                      <Button asChild size="sm" className="mt-2 w-full">
                        <Link to={`/issues/${issue.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civic-blue"></div>
              </div>
            )}
            
            {!loading && issues.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <h3 className="text-xl font-semibold mb-2">No Issues Reported Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to report an issue in your community.
                  </p>
                  <Button asChild className="bg-civic-blue hover:bg-civic-blue/90">
                    <Link to="/report">Report an Issue</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Note:</span> This is a simplified map view. In a future update, 
              this will be replaced with an interactive geographic map showing precise locations.
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MapPage;
