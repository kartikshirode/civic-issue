/**
 * ML Service - Frontend Mock Implementation
 * This simulates ML processing that would typically happen on a backend
 * In production, these would call actual ML APIs
 */

import { IssueCategory } from "@/types";

export interface MLAnalysisResult {
  // Auto-generated content
  suggestedTitle: string;
  enhancedDescription: string;
  
  // Auto-categorization
  predictedCategory: IssueCategory;
  categoryConfidence: number;
  
  // Duplicate detection
  isDuplicate: boolean;
  duplicateIssueId?: string;
  duplicateSimilarity?: number;
  
  // Spam detection
  isSpam: boolean;
  spamScore: number;
  spamReasons?: string[];
  
  // Location from image
  extractedLocation?: {
    address: string;
    lat: number;
    lng: number;
    confidence: number;
  };
  
  // Image quality
  imageQuality: 'poor' | 'fair' | 'good' | 'excellent';
  imageQualityScore: number;
}

export interface HotspotPrediction {
  id: string;
  location: string;
  lat: number;
  lng: number;
  predictedIssueType: IssueCategory;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  reasoning: string;
  predictedTimeframe: string;
}

// Simulated category keywords for auto-detection
const categoryKeywords: Record<IssueCategory, string[]> = {
  'roads': ['pothole', 'road', 'street', 'highway', 'pavement', 'crack', 'broken road', 'damaged road', 'tar', 'asphalt'],
  'water': ['water', 'pipe', 'leak', 'drainage', 'flood', 'sewage', 'tap', 'supply', 'dirty water', 'contaminated'],
  'electricity': ['light', 'pole', 'wire', 'electric', 'power', 'streetlight', 'outage', 'blackout', 'transformer'],
  'sanitation': ['garbage', 'trash', 'waste', 'dump', 'dirty', 'litter', 'bin', 'overflow', 'smell', 'unhygienic'],
  'public-spaces': ['park', 'garden', 'playground', 'bench', 'public', 'footpath', 'sidewalk', 'tree', 'green'],
  'transportation': ['bus', 'stop', 'station', 'traffic', 'signal', 'sign', 'metro', 'railway', 'transport'],
  'other': []
};

// Simulated title templates based on category
const titleTemplates: Record<IssueCategory, string[]> = {
  'roads': ['Pothole on {location}', 'Road damage near {location}', 'Broken road surface at {location}'],
  'water': ['Water leakage at {location}', 'Drainage issue near {location}', 'Water supply problem in {location}'],
  'electricity': ['Streetlight not working at {location}', 'Power outage near {location}', 'Damaged electric pole at {location}'],
  'sanitation': ['Garbage overflow at {location}', 'Waste accumulation near {location}', 'Unhygienic conditions at {location}'],
  'public-spaces': ['Damaged public property at {location}', 'Park maintenance needed at {location}', 'Broken bench/equipment at {location}'],
  'transportation': ['Traffic signal issue at {location}', 'Bus stop damaged at {location}', 'Missing road sign near {location}'],
  'other': ['Civic issue reported at {location}']
};

// Simulated spam patterns
const spamPatterns = [
  'buy now', 'click here', 'free money', 'lottery', 'winner',
  'http://', 'https://', 'www.', '.com', 'advertisement'
];

// Simulate processing delay
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyze an image and description to extract ML insights
 */
export async function analyzeImage(
  imageUrl: string,
  userDescription: string
): Promise<MLAnalysisResult> {
  // Simulate ML processing time
  await simulateDelay(1500 + Math.random() * 1000);
  
  const description = userDescription.toLowerCase();
  
  // Auto-categorization based on keywords
  let predictedCategory: IssueCategory = 'other';
  let maxScore = 0;
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(kw => description.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      predictedCategory = category as IssueCategory;
    }
  }
  
  // If no keywords matched, use image "analysis" (simulated)
  if (predictedCategory === 'other' && imageUrl) {
    const categories: IssueCategory[] = ['roads', 'water', 'electricity', 'sanitation', 'public-spaces', 'transportation'];
    predictedCategory = categories[Math.floor(Math.random() * categories.length)];
  }
  
  const categoryConfidence = maxScore > 0 ? Math.min(0.6 + maxScore * 0.15, 0.95) : 0.5 + Math.random() * 0.3;
  
  // Generate title based on category
  const templates = titleTemplates[predictedCategory];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const suggestedTitle = template.replace('{location}', 'the reported area');
  
  // Enhance description
  const enhancedDescription = enhanceDescription(userDescription, predictedCategory);
  
  // Spam detection
  const spamCheck = detectSpam(userDescription);
  
  // Duplicate detection (simulated - in reality would compare with existing issues)
  const isDuplicate = Math.random() < 0.1; // 10% chance for demo
  
  // Simulate location extraction from image EXIF data
  const extractedLocation = Math.random() > 0.5 ? {
    address: 'Near MG Road, Pune, Maharashtra',
    lat: 18.5204 + (Math.random() - 0.5) * 0.1,
    lng: 73.8567 + (Math.random() - 0.5) * 0.1,
    confidence: 0.7 + Math.random() * 0.25
  } : undefined;
  
  // Image quality assessment (simulated)
  const imageQualityScore = 0.5 + Math.random() * 0.5;
  const imageQuality: MLAnalysisResult['imageQuality'] = 
    imageQualityScore > 0.85 ? 'excellent' :
    imageQualityScore > 0.7 ? 'good' :
    imageQualityScore > 0.5 ? 'fair' : 'poor';
  
  return {
    suggestedTitle,
    enhancedDescription,
    predictedCategory,
    categoryConfidence,
    isDuplicate,
    duplicateIssueId: isDuplicate ? 'issue-123' : undefined,
    duplicateSimilarity: isDuplicate ? 0.85 + Math.random() * 0.1 : undefined,
    isSpam: spamCheck.isSpam,
    spamScore: spamCheck.score,
    spamReasons: spamCheck.reasons,
    extractedLocation,
    imageQuality,
    imageQualityScore
  };
}

/**
 * Enhance user's description with more details
 */
function enhanceDescription(original: string, category: IssueCategory): string {
  if (!original.trim()) {
    const categoryDescriptions: Record<IssueCategory, string> = {
      'roads': 'Road infrastructure issue detected. The surface appears damaged and may pose a safety hazard to vehicles and pedestrians.',
      'water': 'Water-related issue identified. This may affect local water supply or cause flooding in the area.',
      'electricity': 'Electrical infrastructure issue observed. This could impact lighting and power supply in the vicinity.',
      'sanitation': 'Sanitation concern detected. Immediate attention required to maintain hygiene standards.',
      'public-spaces': 'Public space maintenance issue identified. This affects the usability and safety of the area.',
      'transportation': 'Transportation infrastructure issue found. This may impact public commute and safety.',
      'other': 'Civic issue reported that requires attention from local authorities.'
    };
    return categoryDescriptions[category];
  }
  
  // Enhance existing description
  let enhanced = original.charAt(0).toUpperCase() + original.slice(1);
  if (!enhanced.endsWith('.')) enhanced += '.';
  
  const categoryEnhancements: Record<IssueCategory, string> = {
    'roads': ' This road condition issue requires prompt attention to ensure safe passage for vehicles and pedestrians.',
    'water': ' This water-related issue needs immediate inspection to prevent further damage or health hazards.',
    'electricity': ' This electrical issue should be addressed urgently to restore services and ensure public safety.',
    'sanitation': ' This sanitation issue needs immediate attention to maintain public health standards.',
    'public-spaces': ' This public space issue affects community well-being and should be addressed promptly.',
    'transportation': ' This transportation issue may affect daily commuters and requires attention.',
    'other': ' This issue has been flagged for review by the appropriate authorities.'
  };
  
  return enhanced + categoryEnhancements[category];
}

/**
 * Detect potential spam in the description
 */
function detectSpam(text: string): { isSpam: boolean; score: number; reasons: string[] } {
  const lowerText = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;
  
  // Check for spam patterns
  for (const pattern of spamPatterns) {
    if (lowerText.includes(pattern)) {
      score += 0.2;
      reasons.push(`Contains suspicious pattern: "${pattern}"`);
    }
  }
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    score += 0.15;
    reasons.push('Excessive use of capital letters');
  }
  
  // Check for very short or empty description
  if (text.trim().length < 10) {
    score += 0.1;
    reasons.push('Description too short');
  }
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    score += 0.15;
    reasons.push('Contains repeated characters');
  }
  
  return {
    isSpam: score >= 0.4,
    score: Math.min(score, 1),
    reasons
  };
}

/**
 * Get hotspot predictions for an area
 */
export async function getHotspotPredictions(state?: string): Promise<HotspotPrediction[]> {
  await simulateDelay(800);
  
  // Simulated hotspot predictions
  const hotspots: HotspotPrediction[] = [
    {
      id: 'hs-1',
      location: 'MG Road Junction, Pune',
      lat: 18.5204,
      lng: 73.8567,
      predictedIssueType: 'roads',
      riskLevel: 'high',
      probability: 0.85,
      reasoning: 'High traffic volume and historical pothole reports in monsoon season',
      predictedTimeframe: 'Next 2 weeks'
    },
    {
      id: 'hs-2',
      location: 'Market Area, Baramati',
      lat: 18.1525,
      lng: 74.5771,
      predictedIssueType: 'sanitation',
      riskLevel: 'critical',
      probability: 0.92,
      reasoning: 'Weekend market activity leads to waste accumulation',
      predictedTimeframe: 'Next 3-5 days'
    },
    {
      id: 'hs-3',
      location: 'Industrial Zone, PCMC',
      lat: 18.6279,
      lng: 73.8009,
      predictedIssueType: 'water',
      riskLevel: 'medium',
      probability: 0.68,
      reasoning: 'Aging pipeline infrastructure showing signs of wear',
      predictedTimeframe: 'Next month'
    },
    {
      id: 'hs-4',
      location: 'Hadapsar IT Park Road',
      lat: 18.5089,
      lng: 73.9260,
      predictedIssueType: 'electricity',
      riskLevel: 'medium',
      probability: 0.72,
      reasoning: 'Increased load during summer months expected',
      predictedTimeframe: 'Next 2-3 weeks'
    },
    {
      id: 'hs-5',
      location: 'Kothrud Residential Area',
      lat: 18.5074,
      lng: 73.8077,
      predictedIssueType: 'public-spaces',
      riskLevel: 'low',
      probability: 0.45,
      reasoning: 'Seasonal maintenance typically required post-monsoon',
      predictedTimeframe: 'Next 2 months'
    }
  ];
  
  return hotspots;
}

/**
 * Check for similar/duplicate issues
 */
export async function checkDuplicates(
  imageUrl: string,
  description: string,
  location: string
): Promise<{ isDuplicate: boolean; similarIssues: Array<{ id: string; title: string; similarity: number }> }> {
  await simulateDelay(500);
  
  // Simulated duplicate check
  const hasDuplicate = Math.random() < 0.15;
  
  if (hasDuplicate) {
    return {
      isDuplicate: true,
      similarIssues: [
        { id: 'issue-456', title: 'Similar issue reported nearby', similarity: 0.87 },
        { id: 'issue-789', title: 'Related complaint in same area', similarity: 0.72 }
      ]
    };
  }
  
  return { isDuplicate: false, similarIssues: [] };
}

/**
 * Extract location from image EXIF data (simulated)
 */
export async function extractLocationFromImage(imageUrl: string): Promise<{
  success: boolean;
  location?: {
    address: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  message: string;
}> {
  await simulateDelay(600);
  
  // Simulate EXIF extraction (30% success rate for demo)
  const hasGeoTag = Math.random() > 0.7;
  
  if (hasGeoTag) {
    const locations = [
      { address: 'Near Shivaji Nagar, Pune', lat: 18.5308, lng: 73.8474, city: 'Pune', state: 'Maharashtra' },
      { address: 'MG Road, Mumbai', lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
      { address: 'Market Road, Baramati', lat: 18.1525, lng: 74.5771, city: 'Baramati', state: 'Maharashtra' },
    ];
    
    return {
      success: true,
      location: locations[Math.floor(Math.random() * locations.length)],
      message: 'Location extracted from image metadata'
    };
  }
  
  return {
    success: false,
    message: 'No geolocation data found in image. Please enter location manually.'
  };
}
