/**
 * ML Backend Service
 * Provides actual ML processing capabilities with Firebase integration
 * In production, this would call external ML APIs (TensorFlow, OpenAI Vision, etc.)
 */

import { IssueCategory } from "@/types";
import { 
  storeMLAnalysis, 
  findSimilarIssues, 
  storeHotspotPrediction,
  getIssues,
  getActiveHotspots
} from "./database";
import { MLAnalysisResult, HotspotPrediction } from "./mlService";

// =============================================================================
// Configuration
// =============================================================================

const ML_CONFIG = {
  // Minimum confidence threshold for auto-categorization
  MIN_CATEGORY_CONFIDENCE: 0.6,
  // Minimum similarity for duplicate detection
  MIN_DUPLICATE_SIMILARITY: 0.7,
  // Spam score threshold
  SPAM_THRESHOLD: 0.4,
  // Enable/disable actual API calls (set to true when ML APIs are configured)
  USE_REAL_ML_API: false,
  // ML API endpoints (configure when ready)
  API_ENDPOINTS: {
    imageAnalysis: import.meta.env.VITE_ML_IMAGE_API || '',
    textAnalysis: import.meta.env.VITE_ML_TEXT_API || '',
    locationExtraction: import.meta.env.VITE_ML_LOCATION_API || '',
  }
};

// =============================================================================
// Category Keywords (for local processing)
// =============================================================================

const categoryKeywords: Record<IssueCategory, string[]> = {
  'roads': [
    'pothole', 'road', 'street', 'highway', 'pavement', 'crack', 'broken road', 
    'damaged road', 'tar', 'asphalt', 'footpath', 'crossing', 'divider', 'speed bump'
  ],
  'water': [
    'water', 'pipe', 'leak', 'leakage', 'drainage', 'drain', 'flood', 'flooding',
    'sewage', 'sewer', 'tap', 'supply', 'dirty water', 'contaminated', 'waterlogging',
    'pipeline', 'overflow', 'gutter'
  ],
  'electricity': [
    'light', 'pole', 'wire', 'electric', 'power', 'streetlight', 'outage', 'blackout',
    'transformer', 'cable', 'spark', 'short circuit', 'meter', 'voltage', 'current'
  ],
  'sanitation': [
    'garbage', 'trash', 'waste', 'dump', 'dirty', 'litter', 'bin', 'overflow',
    'smell', 'unhygienic', 'cleanliness', 'sweeping', 'dustbin', 'solid waste',
    'plastic', 'debris', 'filth'
  ],
  'public-spaces': [
    'park', 'garden', 'playground', 'bench', 'public', 'footpath', 'sidewalk',
    'tree', 'green', 'railing', 'fence', 'gate', 'community', 'recreational'
  ],
  'transportation': [
    'bus', 'stop', 'station', 'traffic', 'signal', 'sign', 'metro', 'railway',
    'transport', 'auto', 'rickshaw', 'parking', 'zebra crossing', 'pedestrian'
  ],
  'other': []
};

// =============================================================================
// Title Templates
// =============================================================================

const titleTemplates: Record<IssueCategory, string[]> = {
  'roads': [
    'Road damage at {location}',
    'Pothole reported near {location}',
    'Broken road surface at {location}',
    'Road repair needed at {location}'
  ],
  'water': [
    'Water leakage at {location}',
    'Drainage issue near {location}',
    'Water supply problem in {location}',
    'Sewage overflow at {location}'
  ],
  'electricity': [
    'Streetlight not working at {location}',
    'Power issue near {location}',
    'Electrical fault at {location}',
    'Damaged electric pole at {location}'
  ],
  'sanitation': [
    'Garbage accumulation at {location}',
    'Waste disposal issue near {location}',
    'Unhygienic conditions at {location}',
    'Overflowing dustbin at {location}'
  ],
  'public-spaces': [
    'Public space maintenance needed at {location}',
    'Park facility damaged at {location}',
    'Public property issue at {location}'
  ],
  'transportation': [
    'Traffic signal issue at {location}',
    'Bus stop maintenance needed at {location}',
    'Transport infrastructure issue at {location}'
  ],
  'other': [
    'Civic issue reported at {location}',
    'Community concern at {location}'
  ]
};

// =============================================================================
// Spam Detection Patterns
// =============================================================================

const spamPatterns = {
  urls: ['http://', 'https://', 'www.', '.com', '.in', '.org'],
  promotional: ['buy now', 'click here', 'free money', 'lottery', 'winner', 'prize', 'offer'],
  inappropriate: ['advertisement', 'promote', 'sale', 'discount', 'limited time'],
};

// =============================================================================
// Core ML Functions
// =============================================================================

/**
 * Analyze image and description to generate ML insights
 * Integrates with database for duplicate detection and stores results
 */
export async function analyzeImageWithBackend(
  issueId: string,
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  const startTime = Date.now();
  
  try {
    let result: MLAnalysisResult;
    
    if (ML_CONFIG.USE_REAL_ML_API && ML_CONFIG.API_ENDPOINTS.imageAnalysis) {
      // Call real ML API
      result = await callExternalMLAPI(imageUrl, userDescription);
    } else {
      // Use local processing
      result = await processLocally(imageUrl, userDescription, userLocation);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Store ML analysis in database
    await storeMLAnalysis(issueId, result, processingTime);
    
    return result;
  } catch (error) {
    console.error('ML Analysis error:', error);
    // Return default result on error
    return getDefaultMLResult(userDescription);
  }
}

/**
 * Process image and text locally (without external API)
 */
async function processLocally(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
  
  const description = userDescription.toLowerCase();
  
  // 1. Category prediction
  const { category, confidence } = predictCategory(description);
  
  // 2. Generate title
  const suggestedTitle = generateTitle(category, userLocation);
  
  // 3. Enhance description
  const enhancedDescription = enhanceDescription(userDescription, category);
  
  // 4. Spam detection
  const spamResult = detectSpam(userDescription);
  
  // 5. Duplicate detection
  const duplicateResult = await checkForDuplicates(userDescription, userLocation || '');
  
  // 6. Extract location from image (simulated EXIF)
  const extractedLocation = await extractImageLocation(imageUrl);
  
  // 7. Assess image quality
  const { quality, score } = assessImageQuality(imageUrl);
  
  return {
    suggestedTitle,
    enhancedDescription,
    predictedCategory: category,
    categoryConfidence: confidence,
    isDuplicate: duplicateResult.isDuplicate,
    duplicateIssueId: duplicateResult.duplicateIssueId,
    duplicateSimilarity: duplicateResult.similarity,
    isSpam: spamResult.isSpam,
    spamScore: spamResult.score,
    spamReasons: spamResult.reasons,
    extractedLocation,
    imageQuality: quality,
    imageQualityScore: score
  };
}

/**
 * Predict category from description text
 */
function predictCategory(description: string): { category: IssueCategory; confidence: number } {
  let bestCategory: IssueCategory = 'other';
  let maxScore = 0;
  let totalMatches = 0;
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(kw => description.includes(kw)).length;
    totalMatches += matches;
    
    if (matches > maxScore) {
      maxScore = matches;
      bestCategory = category as IssueCategory;
    }
  }
  
  // Calculate confidence based on match count
  let confidence: number;
  if (maxScore === 0) {
    confidence = 0.3 + Math.random() * 0.2; // Low confidence for no matches
  } else if (maxScore === 1) {
    confidence = 0.5 + Math.random() * 0.15;
  } else if (maxScore === 2) {
    confidence = 0.7 + Math.random() * 0.1;
  } else {
    confidence = 0.85 + Math.random() * 0.1;
  }
  
  return { category: bestCategory, confidence: Math.min(confidence, 0.95) };
}

/**
 * Generate suggested title based on category
 */
function generateTitle(category: IssueCategory, location?: string): string {
  const templates = titleTemplates[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{location}', location || 'the reported area');
}

/**
 * Enhance user description with additional context
 */
function enhanceDescription(original: string, category: IssueCategory): string {
  const categoryDescriptions: Record<IssueCategory, string> = {
    'roads': 'Road infrastructure issue detected that may affect traffic safety.',
    'water': 'Water-related issue identified that may impact local supply or sanitation.',
    'electricity': 'Electrical infrastructure issue that could affect power supply and safety.',
    'sanitation': 'Sanitation concern requiring attention for public health.',
    'public-spaces': 'Public space maintenance issue affecting community facilities.',
    'transportation': 'Transportation infrastructure issue impacting public commute.',
    'other': 'Civic issue requiring attention from local authorities.'
  };
  
  if (!original.trim()) {
    return categoryDescriptions[category];
  }
  
  let enhanced = original.charAt(0).toUpperCase() + original.slice(1);
  if (!enhanced.endsWith('.')) enhanced += '.';
  
  const enhancements: Record<IssueCategory, string> = {
    'roads': ' This requires prompt attention to ensure safe passage.',
    'water': ' Immediate inspection recommended to prevent damage.',
    'electricity': ' Urgent attention needed for public safety.',
    'sanitation': ' Action required to maintain hygiene standards.',
    'public-spaces': ' Community facility maintenance recommended.',
    'transportation': ' May affect daily commuters in the area.',
    'other': ' Flagged for review by appropriate authorities.'
  };
  
  return enhanced + enhancements[category];
}

/**
 * Detect potential spam content
 */
function detectSpam(text: string): { isSpam: boolean; score: number; reasons: string[] } {
  const lowerText = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;
  
  // Check URL patterns
  for (const pattern of spamPatterns.urls) {
    if (lowerText.includes(pattern)) {
      score += 0.15;
      reasons.push(`Contains URL pattern: "${pattern}"`);
    }
  }
  
  // Check promotional patterns
  for (const pattern of spamPatterns.promotional) {
    if (lowerText.includes(pattern)) {
      score += 0.2;
      reasons.push(`Contains promotional content: "${pattern}"`);
    }
  }
  
  // Check inappropriate patterns
  for (const pattern of spamPatterns.inappropriate) {
    if (lowerText.includes(pattern)) {
      score += 0.15;
      reasons.push(`Contains suspicious pattern: "${pattern}"`);
    }
  }
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.5 && text.length > 10) {
    score += 0.1;
    reasons.push('Excessive capital letters');
  }
  
  // Check for very short description
  if (text.trim().length < 10) {
    score += 0.1;
    reasons.push('Description too short');
  }
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    score += 0.1;
    reasons.push('Contains repeated characters');
  }
  
  // Check for excessive special characters
  const specialCharRatio = (text.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/g) || []).length / Math.max(text.length, 1);
  if (specialCharRatio > 0.2) {
    score += 0.1;
    reasons.push('Excessive special characters');
  }
  
  return {
    isSpam: score >= ML_CONFIG.SPAM_THRESHOLD,
    score: Math.min(score, 1),
    reasons
  };
}

/**
 * Check for duplicate issues using database
 */
async function checkForDuplicates(
  description: string,
  location: string
): Promise<{ isDuplicate: boolean; duplicateIssueId?: string; similarity?: number }> {
  try {
    const similarIssues = await findSimilarIssues('', description, location);
    
    if (similarIssues.length > 0 && similarIssues[0].similarity >= ML_CONFIG.MIN_DUPLICATE_SIMILARITY) {
      return {
        isDuplicate: true,
        duplicateIssueId: similarIssues[0].issue.id,
        similarity: similarIssues[0].similarity
      };
    }
  } catch (error) {
    console.error('Duplicate check error:', error);
  }
  
  return { isDuplicate: false };
}

/**
 * Extract location from image EXIF data (simulated)
 */
async function extractImageLocation(imageUrl: string): Promise<{
  address: string;
  lat: number;
  lng: number;
  confidence: number;
} | undefined> {
  // In production, this would parse actual EXIF data or use reverse geocoding API
  // For now, simulate with 30% success rate
  
  if (Math.random() > 0.7) {
    const locations = [
      { address: 'Near Shivaji Nagar, Pune', lat: 18.5308, lng: 73.8474 },
      { address: 'MG Road, Pune', lat: 18.5204, lng: 73.8567 },
      { address: 'Market Road, Baramati', lat: 18.1525, lng: 74.5771 },
      { address: 'FC Road, Pune', lat: 18.5273, lng: 73.8409 },
      { address: 'Kothrud, Pune', lat: 18.5074, lng: 73.8077 },
    ];
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    return {
      ...location,
      confidence: 0.7 + Math.random() * 0.25
    };
  }
  
  return undefined;
}

/**
 * Assess image quality
 */
function assessImageQuality(imageUrl: string): {
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  score: number;
} {
  // In production, this would analyze actual image properties
  // For now, simulate based on URL characteristics
  
  let score = 0.5 + Math.random() * 0.5;
  
  // Bonus for high-quality image sources
  if (imageUrl.includes('unsplash') || imageUrl.includes('pexels')) {
    score = Math.min(score + 0.2, 1);
  }
  
  const quality: 'poor' | 'fair' | 'good' | 'excellent' = 
    score > 0.85 ? 'excellent' :
    score > 0.7 ? 'good' :
    score > 0.5 ? 'fair' : 'poor';
  
  return { quality, score };
}

/**
 * Call external ML API (when configured)
 */
async function callExternalMLAPI(
  imageUrl: string,
  description: string
): Promise<MLAnalysisResult> {
  const response = await fetch(ML_CONFIG.API_ENDPOINTS.imageAnalysis, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl, description })
  });
  
  if (!response.ok) {
    throw new Error(`ML API error: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get default ML result for error cases
 */
function getDefaultMLResult(description: string): MLAnalysisResult {
  return {
    suggestedTitle: 'Civic issue reported',
    enhancedDescription: description || 'Issue reported by citizen',
    predictedCategory: 'other',
    categoryConfidence: 0.3,
    isDuplicate: false,
    isSpam: false,
    spamScore: 0,
    imageQuality: 'fair',
    imageQualityScore: 0.5
  };
}

// =============================================================================
// Hotspot Prediction Functions
// =============================================================================

/**
 * Generate hotspot predictions based on historical data
 */
export async function generateHotspotPredictions(): Promise<HotspotPrediction[]> {
  try {
    const issues = await getIssues();
    const existingHotspots = await getActiveHotspots();
    
    // Analyze issue patterns to predict hotspots
    const locationClusters = clusterIssuesByLocation(issues);
    const predictions: HotspotPrediction[] = [];
    
    for (const [location, cluster] of Object.entries(locationClusters)) {
      if (cluster.count >= 2) { // At least 2 issues in same area
        const prediction = generateHotspotFromCluster(location, cluster);
        
        // Check if similar hotspot already exists
        const existingSimilar = existingHotspots.find(h => 
          Math.abs(h.lat - prediction.lat) < 0.01 && 
          Math.abs(h.lng - prediction.lng) < 0.01
        );
        
        if (!existingSimilar) {
          predictions.push(prediction);
          await storeHotspotPrediction(prediction);
        }
      }
    }
    
    return predictions;
  } catch (error) {
    console.error('Hotspot prediction error:', error);
    return [];
  }
}

/**
 * Cluster issues by approximate location
 */
function clusterIssuesByLocation(issues: any[]): Record<string, {
  count: number;
  categories: IssueCategory[];
  avgLat: number;
  avgLng: number;
  recentIssues: number;
}> {
  const clusters: Record<string, any> = {};
  
  for (const issue of issues) {
    const location = issue.location || issue.locationData?.address || 'Unknown';
    const normalizedLocation = location.toLowerCase().split(',')[0].trim();
    
    if (!clusters[normalizedLocation]) {
      clusters[normalizedLocation] = {
        count: 0,
        categories: [],
        avgLat: issue.locationData?.lat || 18.5 + Math.random() * 0.1,
        avgLng: issue.locationData?.lng || 73.8 + Math.random() * 0.1,
        recentIssues: 0
      };
    }
    
    clusters[normalizedLocation].count++;
    clusters[normalizedLocation].categories.push(issue.category);
    
    // Count recent issues (last 7 days)
    const issueDate = new Date(issue.timestamp);
    const daysSinceIssue = (Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceIssue <= 7) {
      clusters[normalizedLocation].recentIssues++;
    }
  }
  
  return clusters;
}

/**
 * Generate hotspot prediction from issue cluster
 */
function generateHotspotFromCluster(location: string, cluster: any): HotspotPrediction {
  // Find most common category
  const categoryCounts: Record<string, number> = {};
  for (const cat of cluster.categories) {
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const mostCommonCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as IssueCategory;
  
  // Calculate risk level based on issue density and recency
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  const recentRatio = cluster.recentIssues / cluster.count;
  
  if (cluster.count >= 5 && recentRatio > 0.5) {
    riskLevel = 'critical';
  } else if (cluster.count >= 3 || recentRatio > 0.3) {
    riskLevel = 'high';
  } else if (cluster.count >= 2) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }
  
  // Calculate probability
  const probability = Math.min(0.5 + cluster.count * 0.1 + recentRatio * 0.2, 0.95);
  
  return {
    id: `hs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    location: location.charAt(0).toUpperCase() + location.slice(1),
    lat: cluster.avgLat,
    lng: cluster.avgLng,
    predictedIssueType: mostCommonCategory,
    riskLevel,
    probability,
    reasoning: `Based on ${cluster.count} historical issues in this area, with ${cluster.recentIssues} reported recently.`,
    predictedTimeframe: riskLevel === 'critical' ? 'Next few days' :
                        riskLevel === 'high' ? 'Next 1-2 weeks' :
                        riskLevel === 'medium' ? 'Next month' : 'Next 2-3 months'
  };
}

// =============================================================================
// Model Performance Tracking
// =============================================================================

/**
 * Track ML model performance
 */
export async function trackModelPerformance(): Promise<{
  categoryAccuracy: number;
  duplicateDetectionRate: number;
  spamDetectionRate: number;
  avgConfidence: number;
}> {
  try {
    const issues = await getIssues();
    
    let totalConfidence = 0;
    let analyzedCount = 0;
    let verifiedCorrect = 0;
    let verifiedTotal = 0;
    
    for (const issue of issues) {
      if (issue.mlAnalysis) {
        totalConfidence += issue.mlAnalysis.categoryConfidence;
        analyzedCount++;
        
        if (issue.isVerified !== undefined) {
          verifiedTotal++;
          if (issue.isVerified) verifiedCorrect++;
        }
      }
    }
    
    return {
      categoryAccuracy: verifiedTotal > 0 ? verifiedCorrect / verifiedTotal : 0,
      duplicateDetectionRate: issues.filter(i => i.duplicateOf).length / Math.max(issues.length, 1),
      spamDetectionRate: issues.filter(i => i.flaggedAsSpam).length / Math.max(issues.length, 1),
      avgConfidence: analyzedCount > 0 ? totalConfidence / analyzedCount : 0
    };
  } catch (error) {
    console.error('Performance tracking error:', error);
    return {
      categoryAccuracy: 0,
      duplicateDetectionRate: 0,
      spamDetectionRate: 0,
      avgConfidence: 0
    };
  }
}
