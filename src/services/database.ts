/**
 * Database Service - Firebase Realtime Database Operations
 * Handles all CRUD operations for issues, ML results, hotspots, and analytics
 */

import { ref, push, set, get, update, remove, query, orderByChild, equalTo, limitToLast, onValue, off } from "firebase/database";
import { db, isFirebaseConfigured } from "@/lib/utils";
import { Issue, IssueCategory, IssueStatus, IssuePriority, GeoLocation } from "@/types";
import { MLAnalysisResult, HotspotPrediction } from "./mlService";
import { mockIssues } from "@/data/mockData";

// =============================================================================
// Mock data helper – used as fallback when Firebase is unavailable
// =============================================================================

function getMockIssueRecords(options?: {
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
}): IssueRecord[] {
  let records: IssueRecord[] = mockIssues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    status: issue.status,
    priority: issue.priority,
    location: issue.location?.address || "",
    pincode: issue.location?.pincode,
    locationData: issue.location,
    images: issue.images,
    duration: issue.duration,
    reportedBy: issue.reportedBy,
    timestamp: issue.reportedAt.toISOString(),
    upvotes: issue.upvotes,
    department: issue.department,
    departmentShortName: issue.departmentShortName,
    departmentStatus: "pending" as const,
  }));

  if (options?.category) records = records.filter((r) => r.category === options.category);
  if (options?.status) records = records.filter((r) => r.status === options.status);
  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (options?.limit) records = records.slice(0, options.limit);
  return records;
}

// =============================================================================
// Types
// =============================================================================

export interface IssueRecord {
  id?: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: string;
  pincode?: string;
  locationData?: GeoLocation;
  images: string[];
  duration: string;
  reportedBy: string;
  timestamp: string;
  upvotes: number;
  
  // Department routing
  department?: string;
  departmentShortName?: string;
  departmentEmail?: string;
  departmentPhone?: string;
  departmentStatus?: 'pending' | 'acknowledged' | 'assigned' | 'working';
  state?: string;
  
  // ML-related fields
  mlAnalysis?: MLAnalysisResult;
  mlAnalyzedAt?: string;
  isVerified?: boolean;
  duplicateOf?: string;
  flaggedAsSpam?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface MLAnalysisRecord {
  issueId: string;
  result: MLAnalysisResult;
  analyzedAt: string;
  processingTimeMs: number;
  modelVersion: string;
}

export interface HotspotRecord extends HotspotPrediction {
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  actualIssuesCount: number;
  accuracy?: number;
}

export interface AnalyticsEvent {
  type: 'issue_created' | 'issue_resolved' | 'ml_analysis' | 'duplicate_detected' | 'spam_detected' | 'hotspot_predicted';
  timestamp: string;
  data: Record<string, any>;
}

// =============================================================================
// Database Seeding (Load dummy data on initialization)
// =============================================================================

/**
 * Seed the database with mock issues if empty
 * This ensures test data is available without manual setup
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    if (!db || !isFirebaseConfigured) {
      console.warn("Firebase not configured – skipping database seed (mock data will be used instead)");
      return;
    }

    const issuesRef = ref(db, "issues");
    const snapshot = await get(issuesRef);

    // Only seed if database is empty
    if (snapshot.exists()) {
      console.log("Database already has data, skipping seed");
      return;
    }

    console.log("Seeding database with mock issues...");
    
    // Insert all mock issues
    for (const issue of mockIssues) {
      const newIssueRef = push(issuesRef);
      
      const issueRecord: IssueRecord = {
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: "reported",
        priority: issue.priority,
        location: issue.location.address || "",
        pincode: issue.location.pincode,
        locationData: issue.location,
        images: issue.images,
        duration: issue.duration,
        reportedBy: issue.reportedBy,
        timestamp: issue.reportedAt.toISOString(),
        upvotes: issue.upvotes,
        department: issue.department,
        departmentShortName: issue.departmentShortName,
        departmentStatus: "pending"
      };

      await set(newIssueRef, issueRecord);
    }

    console.log(`✅ Seeded ${mockIssues.length} mock issues successfully`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// =============================================================================
// Issue Operations
// =============================================================================

/**
 * Create a new issue in the database
 */
export async function createIssue(issue: Omit<IssueRecord, 'id'>): Promise<string> {
  if (!db) throw new Error("Database not initialized");
  
  const issuesRef = ref(db, "issues");
  const newIssueRef = push(issuesRef);
  
  const issueData = {
    ...issue,
    timestamp: issue.timestamp || new Date().toISOString(),
    status: issue.status || 'reported',
    priority: issue.priority || 'medium',
    upvotes: issue.upvotes || 0,
    moderationStatus: 'pending',
  };
  
  await set(newIssueRef, issueData);
  
  // Log analytics event
  await logAnalyticsEvent({
    type: 'issue_created',
    timestamp: new Date().toISOString(),
    data: { issueId: newIssueRef.key, category: issue.category }
  });
  
  return newIssueRef.key!;
}

/**
 * Get a single issue by ID
 */
export async function getIssueById(issueId: string): Promise<IssueRecord | null> {
  if (!db) throw new Error("Database not initialized");
  
  const issueRef = ref(db, `issues/${issueId}`);
  const snapshot = await get(issueRef);
  
  if (snapshot.exists()) {
    return { id: issueId, ...snapshot.val() };
  }
  return null;
}

/**
 * Get all issues with optional filters
 */
export async function getIssues(options?: {
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
}): Promise<IssueRecord[]> {
  if (!db || !isFirebaseConfigured) {
    console.warn("Firebase not configured – returning mock data");
    return getMockIssueRecords(options);
  }
  
  try {
    const issuesRef = ref(db, "issues");
    const snapshot = await get(issuesRef);
    
    if (!snapshot.exists()) {
      console.log("No issues in Firebase, returning mock data");
      return getMockIssueRecords(options);
    }
    
    let issues: IssueRecord[] = [];
    snapshot.forEach((child) => {
      issues.push({ id: child.key!, ...child.val() });
    });
    
    if (options?.category) issues = issues.filter(i => i.category === options.category);
    if (options?.status) issues = issues.filter(i => i.status === options.status);
    issues.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (options?.limit) issues = issues.slice(0, options.limit);
    
    return issues;
  } catch (error) {
    console.error("Firebase getIssues failed, using mock data:", error);
    return getMockIssueRecords(options);
  }
}

/**
 * Update an existing issue
 */
export async function updateIssue(issueId: string, updates: Partial<IssueRecord>): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  
  const issueRef = ref(db, `issues/${issueId}`);
  await update(issueRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  // Log status change if applicable
  if (updates.status === 'resolved') {
    await logAnalyticsEvent({
      type: 'issue_resolved',
      timestamp: new Date().toISOString(),
      data: { issueId }
    });
  }
}

/**
 * Delete an issue
 */
export async function deleteIssue(issueId: string): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  
  const issueRef = ref(db, `issues/${issueId}`);
  await remove(issueRef);
}

/**
 * Increment upvotes for an issue
 */
export async function upvoteIssue(issueId: string): Promise<number> {
  if (!db) throw new Error("Database not initialized");
  
  const issueRef = ref(db, `issues/${issueId}`);
  const snapshot = await get(issueRef);
  
  if (!snapshot.exists()) throw new Error("Issue not found");
  
  const currentUpvotes = snapshot.val().upvotes || 0;
  const newUpvotes = currentUpvotes + 1;
  
  await update(issueRef, { upvotes: newUpvotes });
  
  return newUpvotes;
}

/**
 * Subscribe to real-time issue updates
 */
export function subscribeToIssues(
  callback: (issues: IssueRecord[]) => void
): () => void {
  if (!db || !isFirebaseConfigured) {
    console.warn("Firebase not configured – serving mock data via subscribeToIssues");
    callback(getMockIssueRecords());
    return () => {};
  }
  
  const issuesRef = ref(db, "issues");
  
  const unsubscribe = onValue(
    issuesRef,
    (snapshot) => {
      const issues: IssueRecord[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          issues.push({ id: child.key!, ...child.val() });
        });
      }
      // If Firebase returned nothing, fall back to mock data
      callback(issues.length > 0 ? issues : getMockIssueRecords());
    },
    (error) => {
      console.error("Firebase realtime subscription error, using mock data:", error);
      callback(getMockIssueRecords());
    }
  );
  
  return () => off(issuesRef, 'value', unsubscribe);
}

// =============================================================================
// ML Analysis Operations
// =============================================================================

/**
 * Store ML analysis result for an issue
 */
export async function storeMLAnalysis(
  issueId: string,
  result: MLAnalysisResult,
  processingTimeMs: number
): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  
  const analysisRecord: MLAnalysisRecord = {
    issueId,
    result,
    analyzedAt: new Date().toISOString(),
    processingTimeMs,
    modelVersion: '1.0.0'
  };
  
  // Store in ml_analyses collection
  const analysesRef = ref(db, "ml_analyses");
  const newAnalysisRef = push(analysesRef);
  await set(newAnalysisRef, analysisRecord);
  
  // Update the issue with ML data
  await update(ref(db, `issues/${issueId}`), {
    mlAnalysis: result,
    mlAnalyzedAt: analysisRecord.analyzedAt,
    flaggedAsSpam: result.isSpam,
    duplicateOf: result.duplicateIssueId || null
  });
  
  // Log analytics
  await logAnalyticsEvent({
    type: 'ml_analysis',
    timestamp: analysisRecord.analyzedAt,
    data: {
      issueId,
      category: result.predictedCategory,
      confidence: result.categoryConfidence,
      processingTimeMs
    }
  });
  
  // Log duplicate detection if found
  if (result.isDuplicate) {
    await logAnalyticsEvent({
      type: 'duplicate_detected',
      timestamp: analysisRecord.analyzedAt,
      data: {
        issueId,
        duplicateOf: result.duplicateIssueId,
        similarity: result.duplicateSimilarity
      }
    });
  }
  
  // Log spam detection if flagged
  if (result.isSpam) {
    await logAnalyticsEvent({
      type: 'spam_detected',
      timestamp: analysisRecord.analyzedAt,
      data: {
        issueId,
        spamScore: result.spamScore,
        reasons: result.spamReasons
      }
    });
  }
}

/**
 * Get ML analysis history for an issue
 */
export async function getMLAnalysisHistory(issueId: string): Promise<MLAnalysisRecord[]> {
  if (!db) throw new Error("Database not initialized");
  
  const analysesRef = ref(db, "ml_analyses");
  const snapshot = await get(analysesRef);
  
  if (!snapshot.exists()) return [];
  
  const records: MLAnalysisRecord[] = [];
  snapshot.forEach((child) => {
    const record = child.val();
    if (record.issueId === issueId) {
      records.push(record);
    }
  });
  
  return records.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
}

/**
 * Get issues flagged as potential duplicates
 */
export async function getDuplicateIssues(): Promise<IssueRecord[]> {
  const issues = await getIssues();
  return issues.filter(issue => issue.duplicateOf);
}

/**
 * Get issues flagged as spam
 */
export async function getSpamFlaggedIssues(): Promise<IssueRecord[]> {
  const issues = await getIssues();
  return issues.filter(issue => issue.flaggedAsSpam);
}

// =============================================================================
// Hotspot Operations
// =============================================================================

/**
 * Store a hotspot prediction
 */
export async function storeHotspotPrediction(hotspot: HotspotPrediction): Promise<string> {
  if (!db) throw new Error("Database not initialized");
  
  const hotspotsRef = ref(db, "hotspots");
  const newHotspotRef = push(hotspotsRef);
  
  const record: HotspotRecord = {
    ...hotspot,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    actualIssuesCount: 0
  };
  
  await set(newHotspotRef, record);
  
  await logAnalyticsEvent({
    type: 'hotspot_predicted',
    timestamp: record.createdAt,
    data: {
      hotspotId: newHotspotRef.key,
      location: hotspot.location,
      riskLevel: hotspot.riskLevel,
      predictedIssueType: hotspot.predictedIssueType
    }
  });
  
  return newHotspotRef.key!;
}

/**
 * Get all active hotspots
 */
export async function getActiveHotspots(): Promise<HotspotRecord[]> {
  if (!db) throw new Error("Database not initialized");
  
  const hotspotsRef = ref(db, "hotspots");
  const snapshot = await get(hotspotsRef);
  
  if (!snapshot.exists()) return [];
  
  const hotspots: HotspotRecord[] = [];
  snapshot.forEach((child) => {
    const record = child.val();
    if (record.isActive) {
      hotspots.push({ id: child.key, ...record });
    }
  });
  
  return hotspots.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
  });
}

/**
 * Update hotspot with actual issue count (for accuracy tracking)
 */
export async function updateHotspotAccuracy(hotspotId: string, actualIssuesCount: number): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  
  const hotspotRef = ref(db, `hotspots/${hotspotId}`);
  const snapshot = await get(hotspotRef);
  
  if (!snapshot.exists()) throw new Error("Hotspot not found");
  
  const hotspot = snapshot.val();
  const accuracy = Math.min(actualIssuesCount / (hotspot.probability * 10), 1); // Simplified accuracy calc
  
  await update(hotspotRef, {
    actualIssuesCount,
    accuracy,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Deactivate old hotspots
 */
export async function deactivateExpiredHotspots(): Promise<number> {
  if (!db) throw new Error("Database not initialized");
  
  const hotspotsRef = ref(db, "hotspots");
  const snapshot = await get(hotspotsRef);
  
  if (!snapshot.exists()) return 0;
  
  let deactivatedCount = 0;
  const now = new Date();
  
  for (const child of Object.entries(snapshot.val())) {
    const [id, record] = child as [string, HotspotRecord];
    if (record.isActive) {
      const createdAt = new Date(record.createdAt);
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Deactivate hotspots older than 30 days
      if (daysSinceCreation > 30) {
        await update(ref(db, `hotspots/${id}`), {
          isActive: false,
          updatedAt: now.toISOString()
        });
        deactivatedCount++;
      }
    }
  }
  
  return deactivatedCount;
}

// =============================================================================
// Analytics Operations
// =============================================================================

/**
 * Log an analytics event
 */
export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  
  const analyticsRef = ref(db, "analytics");
  const newEventRef = push(analyticsRef);
  await set(newEventRef, event);
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<{
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  spamDetected: number;
  duplicatesDetected: number;
  avgProcessingTime: number;
  categoryDistribution: Record<IssueCategory, number>;
  statusDistribution: Record<IssueStatus, number>;
  hotspotAccuracy: number;
}> {
  if (!db) throw new Error("Database not initialized");
  
  const issues = await getIssues();
  const analyses = await get(ref(db, "ml_analyses"));
  const hotspots = await getActiveHotspots();
  
  // Calculate category distribution
  const categoryDistribution: Record<IssueCategory, number> = {
    roads: 0, water: 0, electricity: 0, sanitation: 0,
    'public-spaces': 0, transportation: 0, other: 0
  };
  
  // Calculate status distribution
  const statusDistribution: Record<IssueStatus, number> = {
    reported: 0, 'in-progress': 0, resolved: 0, closed: 0
  };
  
  let spamDetected = 0;
  let duplicatesDetected = 0;
  
  for (const issue of issues) {
    categoryDistribution[issue.category]++;
    statusDistribution[issue.status]++;
    if (issue.flaggedAsSpam) spamDetected++;
    if (issue.duplicateOf) duplicatesDetected++;
  }
  
  // Calculate average processing time
  let totalProcessingTime = 0;
  let analysisCount = 0;
  if (analyses.exists()) {
    analyses.forEach((child) => {
      totalProcessingTime += child.val().processingTimeMs || 0;
      analysisCount++;
    });
  }
  
  // Calculate hotspot accuracy
  let totalAccuracy = 0;
  let hotspotsWithAccuracy = 0;
  for (const hotspot of hotspots) {
    if (hotspot.accuracy !== undefined) {
      totalAccuracy += hotspot.accuracy;
      hotspotsWithAccuracy++;
    }
  }
  
  return {
    totalIssues: issues.length,
    resolvedIssues: statusDistribution.resolved + statusDistribution.closed,
    pendingIssues: statusDistribution.reported + statusDistribution['in-progress'],
    spamDetected,
    duplicatesDetected,
    avgProcessingTime: analysisCount > 0 ? totalProcessingTime / analysisCount : 0,
    categoryDistribution,
    statusDistribution,
    hotspotAccuracy: hotspotsWithAccuracy > 0 ? totalAccuracy / hotspotsWithAccuracy : 0
  };
}

/**
 * Get recent analytics events
 */
export async function getRecentAnalytics(limit: number = 50): Promise<AnalyticsEvent[]> {
  if (!db) throw new Error("Database not initialized");
  
  const analyticsRef = ref(db, "analytics");
  const snapshot = await get(analyticsRef);
  
  if (!snapshot.exists()) return [];
  
  const events: AnalyticsEvent[] = [];
  snapshot.forEach((child) => {
    events.push(child.val());
  });
  
  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// =============================================================================
// Search Operations
// =============================================================================

/**
 * Search issues by text
 */
export async function searchIssues(searchTerm: string): Promise<IssueRecord[]> {
  const issues = await getIssues();
  const term = searchTerm.toLowerCase();
  
  return issues.filter(issue =>
    issue.title.toLowerCase().includes(term) ||
    issue.description.toLowerCase().includes(term) ||
    issue.location.toLowerCase().includes(term)
  );
}

/**
 * Find similar issues (for duplicate detection)
 */
export async function findSimilarIssues(
  title: string,
  description: string,
  location: string
): Promise<Array<{ issue: IssueRecord; similarity: number }>> {
  const issues = await getIssues();
  const results: Array<{ issue: IssueRecord; similarity: number }> = [];
  
  const inputWords = new Set([
    ...title.toLowerCase().split(/\s+/),
    ...description.toLowerCase().split(/\s+/)
  ]);
  
  for (const issue of issues) {
    const issueWords = new Set([
      ...issue.title.toLowerCase().split(/\s+/),
      ...issue.description.toLowerCase().split(/\s+/)
    ]);
    
    // Calculate Jaccard similarity
    const intersection = [...inputWords].filter(w => issueWords.has(w)).length;
    const union = new Set([...inputWords, ...issueWords]).size;
    const similarity = intersection / union;
    
    // Also check location proximity (simplified)
    const locationMatch = issue.location.toLowerCase().includes(location.toLowerCase()) ||
                          location.toLowerCase().includes(issue.location.toLowerCase());
    
    const finalSimilarity = similarity * 0.7 + (locationMatch ? 0.3 : 0);
    
    if (finalSimilarity > 0.3) {
      results.push({ issue, similarity: finalSimilarity });
    }
  }
  
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}
