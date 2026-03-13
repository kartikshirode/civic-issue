import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/Layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscribeToIssues, IssueRecord } from "@/services/database";
import { Issue, IssueCategory, IssueStatus } from "@/types";
import { IndianState } from "@/types/location";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Clock, Filter, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  roads:           { color: '#f97316', label: 'Roads' },
  water:           { color: '#3b82f6', label: 'Water' },
  electricity:     { color: '#eab308', label: 'Electricity' },
  sanitation:      { color: '#22c55e', label: 'Sanitation' },
  'public-spaces': { color: '#a855f7', label: 'Public Spaces' },
  transportation:  { color: '#6366f1', label: 'Transport' },
  drainage:        { color: '#06b6d4', label: 'Drainage' },
  encroachment:    { color: '#ec4899', label: 'Encroachment' },
  animals:         { color: '#84cc16', label: 'Animals' },
  other:           { color: '#6b7280', label: 'Other' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  reported:    { color: '#f59e0b', label: 'Reported' },
  'in-progress': { color: '#3b82f6', label: 'In Progress' },
  in_progress: { color: '#3b82f6', label: 'In Progress' },
  resolved:    { color: '#22c55e', label: 'Resolved' },
  closed:      { color: '#6b7280', label: 'Closed' },
};

// ── Colored SVG marker factory ───────────────────────────────────────────────
function makeMarkerIcon(color: string, isSelected = false) {
  const size = isSelected ? 40 : 32;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="14" r="10" fill="${color}" stroke="white" stroke-width="2.5" opacity="${isSelected ? 1 : 0.92}"/>
    <polygon points="11,21 21,21 16,30" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="16" cy="14" r="4" fill="white" opacity="0.85"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// ── Normalize an IssueRecord → Issue ────────────────────────────────────────
function normalizeRecord(record: IssueRecord): (Issue & { lat: number; lng: number }) | null {
  // Extract lat/lng – must be real (non-zero) coordinates
  const lat = record.locationData?.lat;
  const lng = record.locationData?.lng;
  if (!lat || !lng) return null;

  // Normalize status (Firebase may use "in_progress")
  const rawStatus = (record.status || 'reported') as string;
  const status = (rawStatus === 'in_progress' ? 'in-progress' : rawStatus) as IssueStatus;

  // Normalize images (may be plain URLs or {url, uploadedAt} objects)
  const images: string[] = (record.images || []).map((img: any) =>
    typeof img === 'string' ? img : img?.url ?? ''
  ).filter(Boolean);

  return {
    id: record.id || '',
    title: record.title,
    description: record.description,
    category: record.category,
    status,
    priority: record.priority || 'medium',
    location: {
      lat,
      lng,
      address: record.locationData?.address || record.location || '',
      state: (record.locationData?.state as IndianState) || 'Unknown',
      district: record.locationData?.district || '',
      city: record.locationData?.city || '',
      village: '',
    },
    reportedBy: record.reportedBy || 'anonymous',
    reportedAt: new Date(record.timestamp || Date.now()),
    images,
    duration: record.duration || '',
    upvotes: record.upvotes || 0,
    comments: [],
    department: record.department,
    departmentShortName: record.departmentShortName,
    departmentStatus: record.departmentStatus,
    lat,
    lng,
  };
}

// ── Main component ───────────────────────────────────────────────────────────
const MapPage = () => {
  const [allIssues, setAllIssues] = useState<(Issue & { lat: number; lng: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToIssues((records: IssueRecord[]) => {
      const normalized = records
        .map(normalizeRecord)
        .filter((i): i is Issue & { lat: number; lng: number } => i !== null);
      setAllIssues(normalized);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filtered issues
  const issues = useMemo(() => {
    return allIssues.filter(i => {
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      const normStatus = (i.status as string) === 'in_progress' ? 'in-progress' : i.status;
      if (statusFilter !== 'all' && normStatus !== statusFilter) return false;
      return true;
    });
  }, [allIssues, categoryFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: allIssues.length,
    reported: allIssues.filter(i => i.status === 'reported').length,
    inProgress: allIssues.filter(i => ['in-progress', 'in_progress'].includes(i.status as string)).length,
    resolved: allIssues.filter(i => i.status === 'resolved').length,
  }), [allIssues]);

  // Present categories (only those that have issues)
  const presentCategories = useMemo(() => {
    const cats = new Set(allIssues.map(i => i.category));
    return Array.from(cats);
  }, [allIssues]);

  const selectedIssue = issues.find(i => i.id === selectedId) ?? null;
  const indiaCenter: [number, number] = [22.5, 82.5];

  return (
    <PageLayout>
      <div className="civic-container py-8">
        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-br from-[#FF7722] via-[#FF8844] to-[#FF9F5A] p-8 rounded-2xl text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Live Issue Map</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Issues Across India</h1>
            <p className="text-white/90 text-lg">
              See all reported civic issues on the map. Click a pin for details.
            </p>
            {/* Stats row */}
            {!loading && (
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { label: 'Total', value: stats.total, bg: 'bg-white/20' },
                  { label: 'Reported', value: stats.reported, bg: 'bg-amber-500/40' },
                  { label: 'In Progress', value: stats.inProgress, bg: 'bg-blue-500/40' },
                  { label: 'Resolved', value: stats.resolved, bg: 'bg-green-500/40' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[80px]`}>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-white/80">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {!loading && allIssues.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
              <Filter className="h-4 w-4" />
              <span>Filter:</span>
            </div>

            {/* Category chips */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              All Categories
            </button>
            {presentCategories.map(cat => {
              const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.other;
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(active ? 'all' : cat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                  style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? 'white' : cfg.color }} />
                  {cfg.label}
                </button>
              );
            })}

            <span className="w-px h-5 bg-gray-200 mx-1" />

            {/* Status chips */}
            {(['all', 'reported', 'in-progress', 'resolved'] as const).map(s => {
              const cfg = s === 'all' ? null : STATUS_CONFIG[s];
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(active && s !== 'all' ? 'all' : s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                  style={active && cfg ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                >
                  {s === 'all' ? 'All Statuses' : cfg?.label}
                </button>
              );
            })}

            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}

            <span className="ml-auto text-sm text-gray-500">
              Showing {issues.length} of {allIssues.length} issues
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF7722] mr-3" />
              <span className="text-gray-600">Loading map...</span>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-lg">
                <div className="h-[500px] md:h-[600px] w-full">
                  {allIssues.length > 0 ? (
                    <MapContainer
                      center={indiaCenter}
                      zoom={5}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {issues.map(issue => {
                        const cfg = CATEGORY_CONFIG[issue.category] ?? CATEGORY_CONFIG.other;
                        const isSelected = issue.id === selectedId;
                        return (
                          <Marker
                            key={issue.id}
                            position={[issue.lat, issue.lng]}
                            icon={makeMarkerIcon(cfg.color, isSelected)}
                            eventHandlers={{ click: () => setSelectedId(issue.id) }}
                          >
                            <Popup>
                              <div className="min-w-[200px] max-w-[260px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full text-white capitalize font-medium"
                                    style={{ backgroundColor: cfg.color }}
                                  >
                                    {cfg.label}
                                  </span>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full text-white capitalize font-medium"
                                    style={{ backgroundColor: STATUS_CONFIG[issue.status as string]?.color ?? '#6b7280' }}
                                  >
                                    {STATUS_CONFIG[issue.status as string]?.label ?? issue.status}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-sm mb-1 text-gray-900">{issue.title}</h3>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{issue.upvotes}</span>
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{issue.location.city || issue.location.address}</span>
                                </div>
                                <Link to={`/issues/${issue.id}`}>
                                  <button className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-[#FF7722] hover:bg-[#E56610] transition-colors">
                                    View Details →
                                  </button>
                                </Link>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col gap-3 text-gray-400">
                      <MapPin className="h-12 w-12" />
                      <p className="text-sm">No issues to display</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(CATEGORY_CONFIG)
                  .filter(([cat]) => presentCategories.includes(cat))
                  .map(([cat, cfg]) => (
                    <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </div>
                  ))}
              </div>
            </div>

            {/* Sidebar issue list */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  {issues.length} Issue{issues.length !== 1 ? 's' : ''} Found
                </h3>
                {selectedId && (
                  <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear selection
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {issues.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500 text-sm">
                      No issues match the current filters.
                    </CardContent>
                  </Card>
                ) : (
                  issues.map(issue => {
                    const cfg = CATEGORY_CONFIG[issue.category] ?? CATEGORY_CONFIG.other;
                    const scfg = STATUS_CONFIG[issue.status as string] ?? STATUS_CONFIG.reported;
                    const isSelected = issue.id === selectedId;
                    return (
                      <Card
                        key={issue.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-[#FF7722] shadow-md' : ''
                        }`}
                        onClick={() => setSelectedId(isSelected ? null : issue.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                              style={{ backgroundColor: cfg.color }}
                            />
                            <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{issue.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap ml-4">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: scfg.color }}
                            >
                              {scfg.label}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {issue.location.city || issue.location.address?.split(',')[0]}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto">
                              <ThumbsUp className="h-2.5 w-2.5" />{issue.upvotes}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
              {allIssues.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Issues Yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Be the first to report a civic issue.</p>
                    <Button asChild className="bg-[#FF7722] hover:bg-[#E56610]">
                      <Link to="/report">Report an Issue</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MapPage;
