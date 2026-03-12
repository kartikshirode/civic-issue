import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/Layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGetIssues, IssueRecord } from "@/services/api";
import { Issue, IssueCategory } from "@/types";
import { IndianState } from "@/types/location";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const categoryColors: Record<IssueCategory, string> = {
  'roads': '#f97316',
  'water': '#3b82f6',
  'electricity': '#eab308',
  'sanitation': '#22c55e',
  'public-spaces': '#a855f7',
  'transportation': '#6366f1',
  'other': '#6b7280'
};

interface IssueWithCoords extends Issue {
  lat: number;
  lng: number;
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const MapPage = () => {
  const [issues, setIssues] = useState<IssueWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueWithCoords | null>(null);

  useEffect(() => {
    const getIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedIssues = await apiGetIssues();
        
        const formattedIssues: IssueWithCoords[] = fetchedIssues
          .map((issue: IssueRecord, index: number) => {
            const id = issue.id || `issue-${index}`;
            
            let state: IndianState = "Unknown";
            const location = issue.location || '';
            
            if (location.includes("Maharashtra") || location.includes("Mumbai") || location.includes("Pune")) {
              state = "Maharashtra";
            } else if (location.includes("Delhi")) {
              state = "Delhi";
            } else if (location.includes("Karnataka") || location.includes("Bangalore")) {
              state = "Karnataka";
            }

            let lat = 20.5937;
            let lng = 78.9629;
            
            if (issue.locationData?.lat && issue.locationData?.lng) {
              lat = issue.locationData.lat;
              lng = issue.locationData.lng;
            } else {
              lat = 19.0760 + (Math.random() - 0.5) * 2;
              lng = 72.8777 + (Math.random() - 0.5) * 2;
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
                lat,
                lng,
                address: issue.location || "Unknown",
                state,
                district: '',
                city: '',
                village: ''
              },
              reportedBy: issue.reportedBy || "anonymous",
              reportedAt: new Date(issue.timestamp || Date.now()),
              images: issue.images?.length > 0 ? issue.images : [],
              duration: issue.duration || "Unknown",
              upvotes: issue.upvotes || 0,
              comments: [],
              lat,
              lng
            };
          })
          .filter(issue => issue.lat !== 0 && issue.lng !== 0);
        
        setIssues(formattedIssues);
      } catch (err) {
        console.error("Error fetching issues:", err);
        setError("Failed to load issues. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    getIssues();
  }, []);

  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const mapCenter = issues.length > 0 
    ? [issues[0].lat, issues[0].lng] as [number, number]
    : defaultCenter;

  return (
    <PageLayout>
      <div className="civic-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issue Map</h1>
          <p className="text-gray-600">
            View all reported issues on the map. Click on markers to see details.
          </p>
        </div>
        
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF7722] mr-3" />
              <span className="text-gray-600">Loading map...</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-center py-8">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-600">{error}</span>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Card className="overflow-hidden">
              <div className="h-[600px] w-full">
                <MapContainer 
                  center={mapCenter} 
                  zoom={10} 
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenter center={mapCenter} />
                  
                  {issues.map((issue) => (
                    <Marker 
                      key={issue.id} 
                      position={[issue.lat, issue.lng]}
                      eventHandlers={{
                        click: () => setSelectedIssue(issue),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-semibold text-sm mb-1">{issue.title}</h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: categoryColors[issue.category] }}
                            >
                              {issue.category}
                            </span>
                            <span className="text-xs text-gray-500">{issue.upvotes} votes</span>
                          </div>
                          <Link to={`/issues/${issue.id}`}>
                            <Button size="sm" className="w-full bg-[#FF7722] hover:bg-[#E56610]">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card>

            {issues.length === 0 && (
              <Card className="mt-4">
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Reported Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to report an issue in your community.
                  </p>
                  <Button asChild className="bg-[#FF7722] hover:bg-[#E56610]">
                    <Link to="/report">Report an Issue</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {issues.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Issues by Category</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(categoryColors).map(([cat, color]) => {
                    const count = issues.filter(i => i.category === cat).length;
                    return (
                      <div 
                        key={cat} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border"
                      >
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm capitalize">{cat.replace('-', ' ')}</span>
                        <span className="text-sm font-medium text-gray-600">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default MapPage;
