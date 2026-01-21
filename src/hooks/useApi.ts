/**
 * useApi Hook - React hook for API operations
 * Provides easy access to all backend operations with loading states
 */

import { useState, useCallback, useEffect } from 'react';
import {
  apiCreateIssue,
  apiGetIssue,
  apiGetIssues,
  apiUpdateIssueStatus,
  apiUpdateIssuePriority,
  apiDeleteIssue,
  apiUpvoteIssue,
  apiSubscribeToIssues,
  apiUploadImages,
  apiAnalyzeContent,
  apiGetFlaggedIssues,
  apiGetHotspots,
  apiGenerateHotspots,
  apiGetAnalyticsSummary,
  apiGetModelPerformance,
  CreateIssueRequest,
  IssueRecord,
  HotspotRecord,
  MLAnalysisResult
} from '@/services/api';
import { IssueStatus, IssuePriority } from '@/types';

// =============================================================================
// Generic API Hook
// =============================================================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApiCall<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args: P): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// =============================================================================
// Issues Hook
// =============================================================================

export function useIssues(options?: {
  autoFetch?: boolean;
  realtime?: boolean;
}) {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetIssues();
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (options?.realtime) {
      const unsubscribe = apiSubscribeToIssues((updatedIssues) => {
        setIssues(updatedIssues);
      });
      return unsubscribe;
    }
  }, [options?.realtime]);

  // Auto-fetch on mount
  useEffect(() => {
    if (options?.autoFetch !== false && !options?.realtime) {
      fetchIssues();
    }
  }, [options?.autoFetch, options?.realtime, fetchIssues]);

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues
  };
}

// =============================================================================
// Single Issue Hook
// =============================================================================

export function useIssue(issueId: string | undefined) {
  const [issue, setIssue] = useState<IssueRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetIssue(issueId);
      setIssue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issue');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const updateStatus = useCallback(async (status: IssueStatus) => {
    if (!issueId) return false;
    const success = await apiUpdateIssueStatus(issueId, status);
    if (success) {
      setIssue(prev => prev ? { ...prev, status } : null);
    }
    return success;
  }, [issueId]);

  const updatePriority = useCallback(async (priority: IssuePriority) => {
    if (!issueId) return false;
    const success = await apiUpdateIssuePriority(issueId, priority);
    if (success) {
      setIssue(prev => prev ? { ...prev, priority } : null);
    }
    return success;
  }, [issueId]);

  const upvote = useCallback(async () => {
    if (!issueId) return null;
    const newUpvotes = await apiUpvoteIssue(issueId);
    if (newUpvotes !== null) {
      setIssue(prev => prev ? { ...prev, upvotes: newUpvotes } : null);
    }
    return newUpvotes;
  }, [issueId]);

  const deleteIssue = useCallback(async () => {
    if (!issueId) return false;
    return apiDeleteIssue(issueId);
  }, [issueId]);

  return {
    issue,
    loading,
    error,
    refetch: fetchIssue,
    updateStatus,
    updatePriority,
    upvote,
    deleteIssue
  };
}

// =============================================================================
// Create Issue Hook
// =============================================================================

export function useCreateIssue() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);

  const createIssue = useCallback(async (request: CreateIssueRequest) => {
    setLoading(true);
    setError(null);
    setCreatedId(null);
    setMlAnalysis(null);

    try {
      const response = await apiCreateIssue(request);
      if (response.success && response.issueId) {
        setCreatedId(response.issueId);
        setMlAnalysis(response.mlAnalysis || null);
        return response.issueId;
      } else {
        throw new Error(response.error || 'Failed to create issue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setCreatedId(null);
    setMlAnalysis(null);
  }, []);

  return {
    createIssue,
    loading,
    error,
    createdId,
    mlAnalysis,
    reset
  };
}

// =============================================================================
// ML Analysis Hook
// =============================================================================

export function useMLAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MLAnalysisResult | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const analyze = useCallback(async (imageUrl: string, description: string, location?: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setProcessingTime(null);

    try {
      const response = await apiAnalyzeContent({ imageUrl, description, location });
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setProcessingTime(response.processingTimeMs || null);
        return response.analysis;
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setAnalysis(null);
    setProcessingTime(null);
  }, []);

  return {
    analyze,
    loading,
    error,
    analysis,
    processingTime,
    reset
  };
}

// =============================================================================
// Hotspots Hook
// =============================================================================

export function useHotspots(autoFetch = true) {
  const [hotspots, setHotspots] = useState<HotspotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHotspots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetHotspots();
      setHotspots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hotspots');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const newHotspots = await apiGenerateHotspots();
      await fetchHotspots(); // Refresh the list
      return newHotspots;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hotspots');
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchHotspots]);

  useEffect(() => {
    if (autoFetch) {
      fetchHotspots();
    }
  }, [autoFetch, fetchHotspots]);

  return {
    hotspots,
    loading,
    error,
    refetch: fetchHotspots,
    generateHotspots
  };
}

// =============================================================================
// Analytics Hook
// =============================================================================

export function useAnalytics() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof apiGetAnalyticsSummary>> | null>(null);
  const [performance, setPerformance] = useState<Awaited<ReturnType<typeof apiGetModelPerformance>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, performanceData] = await Promise.all([
        apiGetAnalyticsSummary(),
        apiGetModelPerformance()
      ]);
      setSummary(summaryData);
      setPerformance(performanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    summary,
    performance,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

// =============================================================================
// Flagged Issues Hook
// =============================================================================

export function useFlaggedIssues() {
  const [duplicates, setDuplicates] = useState<IssueRecord[]>([]);
  const [spam, setSpam] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlagged = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetFlaggedIssues();
      setDuplicates(data.duplicates);
      setSpam(data.spam);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flagged issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlagged();
  }, [fetchFlagged]);

  return {
    duplicates,
    spam,
    loading,
    error,
    refetch: fetchFlagged
  };
}

// =============================================================================
// Image Upload Hook
// =============================================================================

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const uploadImages = useCallback(async (
    issueId: string,
    options: { files?: File[]; urls?: string[] }
  ) => {
    setUploading(true);
    setErrors([]);

    try {
      const response = await apiUploadImages({
        issueId,
        files: options.files,
        urls: options.urls
      });
      
      setUploadedUrls(prev => [...prev, ...response.uploadedUrls]);
      setErrors(response.errors);
      
      return response;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setUploadedUrls([]);
    setErrors([]);
  }, []);

  return {
    uploadImages,
    uploading,
    uploadedUrls,
    errors,
    reset
  };
}
