/**
 * API Service - Unified Backend Interface
 * Provides a clean API for all frontend components to interact with backend services
 */

import {
  createIssue,
  getIssueById,
  getIssues,
  updateIssue,
  deleteIssue,
  upvoteIssue,
  subscribeToIssues,
  getMLAnalysisHistory,
  getDuplicateIssues,
  getSpamFlaggedIssues,
  getActiveHotspots,
  getAnalyticsSummary,
  getRecentAnalytics,
  searchIssues,
  IssueRecord,
  HotspotRecord,
  AnalyticsEvent
} from "./database";

import {
  analyzeImageWithBackend,
  generateHotspotPredictions,
  trackModelPerformance
} from "./mlBackend";

import {
  uploadImage,
  uploadImageFromUrl,
  deleteImage,
  deleteIssueImages,
  getIssueImages,
  compressImage,
  validateImage,
  UploadResult
} from "./storage";

import { MLAnalysisResult, HotspotPrediction } from "./mlService";
import { IssueCategory, IssueStatus, IssuePriority } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface CreateIssueRequest {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  duration: string;
  images: string[];
  reportedBy?: string;
  locationData?: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
  };
}

export interface CreateIssueResponse {
  success: boolean;
  issueId?: string;
  mlAnalysis?: MLAnalysisResult;
  error?: string;
}

export interface UploadImagesRequest {
  files?: File[];
  urls?: string[];
  issueId: string;
}

export interface UploadImagesResponse {
  success: boolean;
  uploadedUrls: string[];
  errors: string[];
}

export interface AnalyzeContentRequest {
  imageUrl: string;
  description: string;
  location?: string;
}

export interface AnalyzeContentResponse {
  success: boolean;
  analysis?: MLAnalysisResult;
  error?: string;
  processingTimeMs?: number;
}

// =============================================================================
// Issue API
// =============================================================================

/**
 * Create a new issue with ML analysis
 */
export async function apiCreateIssue(request: CreateIssueRequest): Promise<CreateIssueResponse> {
  try {
    // Create the issue first
    const issueId = await createIssue({
      title: request.title,
      description: request.description,
      category: request.category,
      status: 'reported',
      priority: 'medium',
      location: request.location,
      locationData: request.locationData,
      images: request.images,
      duration: request.duration,
      reportedBy: request.reportedBy || 'anonymous',
      timestamp: new Date().toISOString(),
      upvotes: 0,
      moderationStatus: 'pending'
    });
    
    // Run ML analysis if there's an image
    let mlAnalysis: MLAnalysisResult | undefined;
    if (request.images.length > 0) {
      try {
        mlAnalysis = await analyzeImageWithBackend(
          issueId,
          request.images[0],
          request.description,
          request.location
        );
        
        // Update issue with ML-suggested priority
        if (mlAnalysis.categoryConfidence > 0.8) {
          await updateIssue(issueId, {
            priority: calculatePriority(mlAnalysis)
          });
        }
      } catch (mlError) {
        console.warn("ML analysis failed, issue created without analysis:", mlError);
      }
    }
    
    return {
      success: true,
      issueId,
      mlAnalysis
    };
  } catch (error) {
    console.error("Error creating issue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create issue"
    };
  }
}

/**
 * Get issue by ID
 */
export async function apiGetIssue(issueId: string): Promise<IssueRecord | null> {
  return getIssueById(issueId);
}

/**
 * Get issues with filters
 */
export async function apiGetIssues(options?: {
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
  search?: string;
}): Promise<IssueRecord[]> {
  if (options?.search) {
    return searchIssues(options.search);
  }
  return getIssues(options);
}

/**
 * Update issue status
 */
export async function apiUpdateIssueStatus(
  issueId: string,
  status: IssueStatus
): Promise<boolean> {
  try {
    await updateIssue(issueId, { status });
    return true;
  } catch (error) {
    console.error("Error updating issue status:", error);
    return false;
  }
}

/**
 * Update issue priority
 */
export async function apiUpdateIssuePriority(
  issueId: string,
  priority: IssuePriority
): Promise<boolean> {
  try {
    await updateIssue(issueId, { priority });
    return true;
  } catch (error) {
    console.error("Error updating issue priority:", error);
    return false;
  }
}

/**
 * Delete an issue
 */
export async function apiDeleteIssue(issueId: string): Promise<boolean> {
  try {
    // Delete associated images first
    await deleteIssueImages(issueId);
    // Delete the issue
    await deleteIssue(issueId);
    return true;
  } catch (error) {
    console.error("Error deleting issue:", error);
    return false;
  }
}

/**
 * Upvote an issue
 */
export async function apiUpvoteIssue(issueId: string): Promise<number | null> {
  try {
    return await upvoteIssue(issueId);
  } catch (error) {
    console.error("Error upvoting issue:", error);
    return null;
  }
}

/**
 * Subscribe to real-time issue updates
 */
export function apiSubscribeToIssues(
  callback: (issues: IssueRecord[]) => void
): () => void {
  return subscribeToIssues(callback);
}

// =============================================================================
// Image API
// =============================================================================

/**
 * Upload images for an issue
 */
export async function apiUploadImages(request: UploadImagesRequest): Promise<UploadImagesResponse> {
  const uploadedUrls: string[] = [];
  const errors: string[] = [];
  
  // Upload files
  if (request.files) {
    for (let i = 0; i < request.files.length; i++) {
      const file = request.files[i];
      
      // Validate
      const validation = validateImage(file);
      if (!validation.valid) {
        errors.push(`File ${i + 1}: ${validation.error}`);
        continue;
      }
      
      // Compress if large
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) {
        try {
          fileToUpload = await compressImage(file);
        } catch (e) {
          console.warn("Compression failed, using original:", e);
        }
      }
      
      // Upload
      const result = await uploadImage(fileToUpload, request.issueId, i);
      if (result.success && result.url) {
        uploadedUrls.push(result.url);
      } else {
        errors.push(`File ${i + 1}: ${result.error}`);
      }
    }
  }
  
  // Upload from URLs
  if (request.urls) {
    for (let i = 0; i < request.urls.length; i++) {
      const url = request.urls[i];
      const result = await uploadImageFromUrl(url, request.issueId, uploadedUrls.length + i);
      if (result.success && result.url) {
        uploadedUrls.push(result.url);
      } else {
        errors.push(`URL ${i + 1}: ${result.error}`);
      }
    }
  }
  
  return {
    success: errors.length === 0,
    uploadedUrls,
    errors
  };
}

/**
 * Get images for an issue
 */
export async function apiGetIssueImages(issueId: string): Promise<string[]> {
  return getIssueImages(issueId);
}

// =============================================================================
// ML Analysis API
// =============================================================================

/**
 * Analyze content (image + description) without creating issue
 */
export async function apiAnalyzeContent(request: AnalyzeContentRequest): Promise<AnalyzeContentResponse> {
  const startTime = Date.now();
  
  try {
    // Use a temporary ID for analysis
    const tempId = `temp-${Date.now()}`;
    const analysis = await analyzeImageWithBackend(
      tempId,
      request.imageUrl,
      request.description,
      request.location
    );
    
    return {
      success: true,
      analysis,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
      processingTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Get ML analysis history for an issue
 */
export async function apiGetMLHistory(issueId: string) {
  return getMLAnalysisHistory(issueId);
}

/**
 * Get all flagged issues (duplicates and spam)
 */
export async function apiGetFlaggedIssues(): Promise<{
  duplicates: IssueRecord[];
  spam: IssueRecord[];
}> {
  const [duplicates, spam] = await Promise.all([
    getDuplicateIssues(),
    getSpamFlaggedIssues()
  ]);
  return { duplicates, spam };
}

/**
 * Verify/reject ML categorization
 */
export async function apiVerifyMLResult(
  issueId: string,
  isCorrect: boolean
): Promise<boolean> {
  try {
    await updateIssue(issueId, { isVerified: isCorrect });
    return true;
  } catch (error) {
    console.error("Error verifying ML result:", error);
    return false;
  }
}

/**
 * Approve/reject moderation
 */
export async function apiModerateIssue(
  issueId: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  try {
    await updateIssue(issueId, { moderationStatus: status });
    return true;
  } catch (error) {
    console.error("Error moderating issue:", error);
    return false;
  }
}

// =============================================================================
// Hotspot API
// =============================================================================

/**
 * Get active hotspot predictions
 */
export async function apiGetHotspots(): Promise<HotspotRecord[]> {
  return getActiveHotspots();
}

/**
 * Generate new hotspot predictions
 */
export async function apiGenerateHotspots(): Promise<HotspotPrediction[]> {
  return generateHotspotPredictions();
}

// =============================================================================
// Analytics API
// =============================================================================

/**
 * Get analytics summary
 */
export async function apiGetAnalyticsSummary() {
  return getAnalyticsSummary();
}

/**
 * Get recent analytics events
 */
export async function apiGetRecentAnalytics(limit?: number): Promise<AnalyticsEvent[]> {
  return getRecentAnalytics(limit);
}

/**
 * Get ML model performance metrics
 */
export async function apiGetModelPerformance() {
  return trackModelPerformance();
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate issue priority based on ML analysis
 */
function calculatePriority(analysis: MLAnalysisResult): IssuePriority {
  // Spam gets low priority
  if (analysis.isSpam) return 'low';
  
  // Duplicate gets low priority
  if (analysis.isDuplicate) return 'low';
  
  // High confidence urgent categories
  const urgentCategories: IssueCategory[] = ['electricity', 'water'];
  if (urgentCategories.includes(analysis.predictedCategory) && analysis.categoryConfidence > 0.8) {
    return 'high';
  }
  
  // Based on confidence
  if (analysis.categoryConfidence > 0.85) return 'medium';
  
  return 'medium';
}

// =============================================================================
// Export everything for convenience
// =============================================================================

export {
  // Types from other modules
  type IssueRecord,
  type HotspotRecord,
  type AnalyticsEvent,
  type MLAnalysisResult,
  type HotspotPrediction,
  type UploadResult
};
