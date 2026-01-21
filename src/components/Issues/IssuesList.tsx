import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Issue, IssueCategory, IssueStatus, IssuePriority } from "@/types";
import IssueCard from "./IssueCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryOptions, statusOptions, priorityOptions } from "@/data/mockData";
import { indianStates, districtsByState, citiesByDistrict, villagesByDistrict } from "@/data/indiaLocations";
import { IndianState } from "@/types/location";
import { MapPin, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { onValue, ref, get } from "firebase/database"; // Add Firebase imports
import { db } from "@/lib/utils"; // Import Firebase db

const IssuesList = ({ issues: propIssues }: { issues?: Issue[] }) => {
  const [issues, setIssues] = useState<Issue[]>(propIssues || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | IssueCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | IssuePriority>("all");
  const [stateFilter, setStateFilter] = useState<"all" | IndianState>("all");
  const [districtFilter, setDistrictFilter] = useState<"all" | string>("all");
  const [cityFilter, setCityFilter] = useState<"all" | string>("all");
  const [villageFilter, setVillageFilter] = useState<"all" | string>("all");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableVillages, setAvailableVillages] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Fetch issues from Firebase on component mount
  useEffect(() => {
    if (!propIssues) {
      const fetchIssues = async () => {
        setLoading(true);
        
        try {
          // Get the Firebase issues
          const issuesRef = ref(db, "issues");
          
          if (!db) {
            throw new Error("Firebase database is not initialized");
          }
          
          const snapshot = await get(issuesRef);
          let formattedIssues: Issue[] = [];
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            
            formattedIssues = Object.entries(data).map(([id, issueData]: [string, any]) => {
              // Extract location data
              const location = issueData.location || '';
              
              // Convert to valid IndianState type
              let state: IndianState = "Unknown";
              if (location.includes("Maharashtra") || location.toLowerCase().includes("maharashtra")) {
                state = "Maharashtra";
              }
              
              // Convert Firebase format to our app format
              return {
                id,
                title: issueData.title || '',
                description: issueData.description || '',
                category: issueData.category || 'other',
                status: issueData.status || 'reported',
                priority: issueData.priority || 'medium',
                location: {
                  lat: 0,
                  lng: 0,
                  address: location,
                  state: state,
                  district: location.includes("Baramati") ? "Pune" : 
                           location.includes("Pune") ? "Pune" : 
                           location.includes("Mumbai") ? "Mumbai" : "",
                  city: location.includes("Baramati") ? "Baramati" : 
                        location.includes("Pune") ? "Pune" : 
                        location.includes("Mumbai") ? "Mumbai" : "",
                  village: ""
                },
                reportedBy: 'user1',
                reportedAt: new Date(issueData.timestamp || Date.now()),
                images: issueData.image ? [issueData.image] : [],
                duration: issueData.duration || '',
                upvotes: issueData.upvotes || 0,
                comments: []
              };
            });
          }
          
          // Only set real data from Firebase, don't include mock data
          setIssues(formattedIssues);
        } catch (error) {
          console.error('Error fetching issues:', error);
          // Show an empty list if there's an error
          setIssues([]);
        } finally {
          setLoading(false);
        }
      };

      fetchIssues();
    }
  }, [propIssues]);

  // Add a real-time listener for upvotes changes in Firebase
  useEffect(() => {
    // Only set up listeners if issues are loaded and db is initialized
    if (issues.length === 0 || loading || !db) return;
    
    // Get all Firebase issue IDs
    const firebaseIssueIds = issues.map(issue => issue.id);
    
    // Set up listeners for each Firebase issue
    const unsubscribers = firebaseIssueIds.map(issueId => {
      const upvotesRef = ref(db, `issues/${issueId}/upvotes`);
      
      return onValue(upvotesRef, (snapshot) => {
        const newUpvotes = snapshot.val() || 0;
        
        // Update the specific issue's upvotes
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === issueId ? { ...issue, upvotes: newUpvotes } : issue
          )
        );
      }, (error) => {
        console.error(`Error listening to upvotes for issue ${issueId}:`, error);
      });
    });
    
    // Clean up listeners on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [issues, loading]);

  // Update available districts when state changes
  useEffect(() => {
    if (stateFilter !== "all") {
      setAvailableDistricts(districtsByState[stateFilter] || []);
      setDistrictFilter("all");
      setCityFilter("all");
      setVillageFilter("all");
    } else {
      setAvailableDistricts([]);
      setDistrictFilter("all");
    }
  }, [stateFilter]);

  // Update available cities when district changes
  useEffect(() => {
    if (districtFilter !== "all") {
      setAvailableCities(citiesByDistrict[districtFilter] || []);
      setCityFilter("all");
      setVillageFilter("all");
    } else {
      setAvailableCities([]);
      setCityFilter("all");
    }
  }, [districtFilter]);

  // Update available villages when district changes
  useEffect(() => {
    if (districtFilter !== "all") {
      setAvailableVillages(villagesByDistrict[districtFilter] || []);
      setVillageFilter("all");
    } else {
      setAvailableVillages([]);
      setVillageFilter("all");
    }
  }, [districtFilter]);

  // Apply all filters
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    const matchesState = stateFilter === "all" || issue.location.state === stateFilter;
    const matchesDistrict = districtFilter === "all" || issue.location.district === districtFilter;
    const matchesCity = cityFilter === "all" || issue.location.city === cityFilter;
    const matchesVillage = villageFilter === "all" || issue.location.village === villageFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority &&
           matchesState && matchesDistrict && matchesCity && matchesVillage;
  });

  // Navigate to issue details
  const handleIssueClick = (issueId: string) => {
    navigate(`/issues/${issueId}`);
  };

  // Count active filters
  const activeFiltersCount = [
    searchTerm !== "",
    categoryFilter !== "all",
    statusFilter !== "all",
    priorityFilter !== "all",
    stateFilter !== "all",
    districtFilter !== "all",
    cityFilter !== "all",
    villageFilter !== "all"
  ].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setStateFilter("all");
    setDistrictFilter("all");
    setCityFilter("all");
    setVillageFilter("all");
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Filter Header */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-gradient-to-r from-gray-50 to-white px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between md:cursor-default"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-[#FF7722]/10 rounded-lg">
              <Filter className="h-4 w-4 md:h-5 md:w-5 text-[#FF7722]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Filter Issues</h3>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Narrow down to find specific issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                className="text-xs md:text-sm text-[#FF7722] hover:text-[#FF7722]/80 font-medium transition-colors"
              >
                Clear ({activeFiltersCount})
              </button>
            )}
            <div className="md:hidden">
              {showFilters ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </button>

        {/* Collapsible filter content - always visible on desktop, toggle on mobile */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          {/* Search Bar */}
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="relative">
              <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                id="search"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Category & Status Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="category" className="text-xs md:text-sm font-medium text-gray-700">Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as "all" | IssueCategory)}
              >
                <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="status" className="text-xs md:text-sm font-medium text-gray-700">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "all" | IssueStatus)}
              >
                <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="priority" className="text-xs md:text-sm font-medium text-gray-700">Priority</Label>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as "all" | IssuePriority)}
              >
                <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                        {priority.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                State
              </Label>
              <Select
                value={stateFilter}
                onValueChange={(value) => setStateFilter(value as "all" | IndianState)}
              >
                <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {indianStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Location filters - only show when state is selected */}
          {stateFilter !== "all" && (
            <div className="grid grid-cols-3 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-100">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">District</Label>
                <Select
                  value={districtFilter}
                  onValueChange={setDistrictFilter}
                >
                  <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {availableDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">City</Label>
                <Select
                  value={cityFilter}
                  onValueChange={setCityFilter}
                  disabled={districtFilter === "all"}
                >
                  <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors disabled:opacity-50">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">Village</Label>
                <Select
                  value={villageFilter}
                  onValueChange={setVillageFilter}
                  disabled={districtFilter === "all"}
                >
                  <SelectTrigger className="h-9 md:h-11 text-sm bg-gray-50 border-gray-200 hover:bg-white transition-colors disabled:opacity-50">
                    <SelectValue placeholder="All Villages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Villages</SelectItem>
                    {availableVillages.map((village) => (
                      <SelectItem key={village} value={village}>
                        {village}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            {loading ? 'Loading...' : `${filteredIssues.length} Issues Found`}
          </h3>
          {activeFiltersCount > 0 && (
            <span className="bg-[#FF7722]/10 text-[#FF7722] text-xs font-medium px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                <div className="h-4 bg-gray-100 rounded-md w-full" />
                <div className="h-4 bg-gray-100 rounded-md w-4/5" />
              </div>
            </div>
          ))
        ) : filteredIssues.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Issues Found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                No issues match your current filters. Try adjusting your search criteria or clearing filters.
              </p>
              <button 
                onClick={resetFilters}
                className="text-[#FF7722] hover:text-[#FF7722]/80 font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          filteredIssues.map((issue, index) => (
            <div 
              key={issue.id} 
              onClick={() => handleIssueClick(issue.id)}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <IssueCard issue={issue} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IssuesList;
