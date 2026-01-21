
import PageLayout from "@/components/Layout/PageLayout";
import IssuesList from "@/components/Issues/IssuesList";
import { useIssues } from "@/hooks/useApi";
import { Megaphone, Filter, Search, Loader2 } from "lucide-react";
import { Issue } from "@/types";
import { IssueRecord } from "@/services/database";
import { IndianState } from "@/types/location";

// Helper to convert IssueRecord to Issue type
const convertToIssue = (record: IssueRecord): Issue => {
  const id = record.id || '';
  let state: IndianState = "Unknown";
  const location = record.location || '';
  
  if (location.includes("Maharashtra") || location.includes("Mumbai") || location.includes("Pune") || location.includes("Baramati")) {
    state = "Maharashtra";
  } else if (location.includes("Delhi")) {
    state = "Delhi";
  } else if (location.includes("Karnataka") || location.includes("Bangalore") || location.includes("Bengaluru")) {
    state = "Karnataka";
  }
  
  return {
    id,
    title: record.title,
    description: record.description,
    category: record.category,
    status: record.status,
    priority: record.priority,
    location: record.locationData ? {
      lat: record.locationData.lat,
      lng: record.locationData.lng,
      address: record.locationData.address,
      state: (record.locationData.state as IndianState) || state,
      district: record.locationData.district || '',
      city: record.locationData.city || '',
      village: ''
    } : {
      lat: 0,
      lng: 0,
      address: record.location,
      state,
      district: '',
      city: '',
      village: ''
    },
    reportedBy: record.reportedBy,
    reportedAt: new Date(record.timestamp),
    images: record.images.length > 0 ? record.images : ['/placeholder.svg'],
    duration: record.duration,
    upvotes: record.upvotes,
    comments: []
  };
};

const IssuesPage = () => {
  const { issues: issueRecords, loading, error } = useIssues({ realtime: true });
  
  // Convert IssueRecords to Issues for the component
  const issues = issueRecords.map(convertToIssue);
  
  return (
    <PageLayout>
      <div className="civic-container py-8">
        {/* Hero Header */}
        <div className="mb-10 bg-gradient-to-br from-[#FF7722] via-[#FF8844] to-[#FF9F5A] p-8 md:p-12 rounded-2xl text-white relative overflow-hidden shadow-xl">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <img 
                src="/uploads/logo.png" 
                alt="BOL BHARAT Logo" 
                className="h-20 w-20" 
              />
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                <Megaphone className="h-4 w-4" />
                <span className="text-sm font-medium">Community Issues</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">BOL BHARAT Issues</h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Browse and filter reported issues across India. Use the filters below to find issues in your area.
              </p>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7722]" />
            <span className="ml-3 text-gray-600">Loading issues...</span>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-[#FF7722] underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Quick Stats */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Issues', value: issues.length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Reported', value: issues.filter(i => i.status === 'reported').length, color: 'bg-amber-50 text-amber-600' },
                { label: 'In Progress', value: issues.filter(i => i.status === 'in-progress').length, color: 'bg-purple-50 text-purple-600' },
                { label: 'Resolved', value: issues.filter(i => i.status === 'resolved').length, color: 'bg-green-50 text-green-600' },
              ].map((stat, index) => (
                <div key={index} className={`${stat.color} rounded-xl p-4 text-center transition-transform hover:scale-105 cursor-default`}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <IssuesList issues={issues} />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default IssuesPage;
