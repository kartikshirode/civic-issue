/**
 * Gemini AI Service - Google Gemini API Integration
 * Uses the free tier of Gemini API for image and text analysis
 * 
 * @see https://ai.google.dev/gemini-api/docs
 */

import { IssueCategory } from "@/types";
import { MLAnalysisResult } from "./mlService";

// =============================================================================
// Types
// =============================================================================

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface GeminiAnalysisResult {
  title: string;
  description: string;
  category: IssueCategory;
  categoryConfidence: number;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  duration?: string;
  tags: string[];
}

// =============================================================================
// Configuration
// =============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Category mapping for Gemini responses - handles various phrasings
const CATEGORY_MAP: Record<string, IssueCategory> = {
  // Roads
  'roads': 'roads',
  'road': 'roads',
  'road infrastructure': 'roads',
  'pothole': 'roads',
  'potholes': 'roads',
  'highway': 'roads',
  'street': 'roads',
  'pavement': 'roads',
  'sidewalk': 'roads',
  'footpath': 'roads',
  
  // Water
  'water': 'water',
  'water supply': 'water',
  'drainage': 'water',
  'sewage': 'water',
  'flooding': 'water',
  'leak': 'water',
  'pipe': 'water',
  'plumbing': 'water',
  
  // Electricity
  'electricity': 'electricity',
  'electrical': 'electricity',
  'power': 'electricity',
  'power supply': 'electricity',
  'streetlight': 'electricity',
  'street light': 'electricity',
  'lighting': 'electricity',
  'light': 'electricity',
  
  // Sanitation
  'sanitation': 'sanitation',
  'garbage': 'sanitation',
  'waste': 'sanitation',
  'trash': 'sanitation',
  'cleanliness': 'sanitation',
  'hygiene': 'sanitation',
  'solid waste': 'sanitation',
  
  // Public Spaces
  'public-spaces': 'public-spaces',
  'public spaces': 'public-spaces',
  'public space': 'public-spaces',
  'park': 'public-spaces',
  'garden': 'public-spaces',
  'playground': 'public-spaces',
  'public area': 'public-spaces',
  
  // Transportation
  'transportation': 'transportation',
  'transport': 'transportation',
  'traffic': 'transportation',
  'bus': 'transportation',
  'signal': 'transportation',
  'traffic signal': 'transportation',
  
  // Other
  'other': 'other',
  'miscellaneous': 'other',
  'general': 'other'
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert image URL to base64 for Gemini API
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ data: base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

/**
 * Map Gemini's category response to our IssueCategory type
 */
function mapToCategory(geminiCategory: string): IssueCategory {
  if (!geminiCategory) return 'other';
  
  const normalized = geminiCategory.toLowerCase().trim();
  console.log('Mapping category:', geminiCategory, '-> normalized:', normalized);
  
  // First try exact match
  if (CATEGORY_MAP[normalized]) {
    console.log('Exact match found:', CATEGORY_MAP[normalized]);
    return CATEGORY_MAP[normalized];
  }
  
  // Then try partial match
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log('Partial match found:', key, '->', value);
      return value;
    }
  }
  
  console.log('No match found, returning other');
  return 'other';
}

/**
 * Convert confidence value to number
 */
function parseConfidence(confidence: any): number {
  if (typeof confidence === 'number') {
    return confidence;
  }
  if (typeof confidence === 'string') {
    const lower = confidence.toLowerCase();
    if (lower === 'high' || lower === 'very high') return 0.9;
    if (lower === 'medium' || lower === 'moderate') return 0.7;
    if (lower === 'low') return 0.5;
    // Try to parse as number
    const num = parseFloat(confidence);
    if (!isNaN(num)) return num > 1 ? num / 100 : num;
  }
  return 0.7;
}

/**
 * Convert severity value to valid type
 */
function parseSeverity(severity: any): 'low' | 'medium' | 'high' | 'urgent' {
  if (typeof severity === 'string') {
    const lower = severity.toLowerCase();
    if (lower.includes('urgent') || lower.includes('critical')) return 'urgent';
    if (lower.includes('high') || lower.includes('severe')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
    if (lower.includes('low') || lower.includes('minor')) return 'low';
  }
  return 'medium';
}

/**
 * Parse Gemini's JSON response
 */
function parseGeminiResponse(text: string): GeminiAnalysisResult | null {
  try {
    console.log('Raw Gemini response:', text);
    
    // Clean up the response - remove markdown code blocks
    let cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Try to extract JSON from the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON:', jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      
      // Extract and clean values
      const title = (parsed.title || '').toString().trim();
      const description = (parsed.description || '').toString().trim();
      const category = mapToCategory(parsed.category || 'other');
      const confidence = parseConfidence(parsed.confidence);
      const severity = parseSeverity(parsed.severity);
      const location = parsed.location ? parsed.location.toString().trim() : null;
      const duration = parsed.duration ? parsed.duration.toString().trim() : undefined;
      const tags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => t.toString()) : [];
      
      console.log('Parsed result:', { title, description, category, confidence, severity, location, duration, tags });
      
      return {
        title: title || 'Civic Issue Report',
        description: description,
        category,
        categoryConfidence: confidence,
        location,
        severity,
        duration,
        tags
      };
    }
    
    // If no JSON found, try to extract key info from plain text
    console.warn('No JSON found in response, attempting text extraction');
    const titleMatch = text.match(/["']?title["']?\s*:\s*["']([^"']+)["']/i);
    const descMatch = text.match(/["']?description["']?\s*:\s*["']([^"']+)["']/i);
    const categoryMatch = text.match(/["']?category["']?\s*:\s*["']([^"']+)["']/i);
    const locationMatch = text.match(/["']?location["']?\s*:\s*["']([^"']+)["']/i);
    
    if (titleMatch || categoryMatch) {
      return {
        title: titleMatch?.[1]?.trim() || 'Civic Issue Report',
        description: descMatch?.[1]?.trim() || '',
        category: mapToCategory(categoryMatch?.[1] || 'other'),
        categoryConfidence: 0.7,
        location: locationMatch?.[1]?.trim() || null,
        severity: 'medium',
        tags: []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Response text was:', text);
    return null;
  }
}

// =============================================================================
// Main API Functions
// =============================================================================

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here';
}

/**
 * Analyze image and description using Gemini AI
 */
export async function analyzeWithGemini(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const prompt = `You are analyzing a civic issue report from India for a citizen complaint platform.

User Description: ${userDescription || 'No description provided'}
${userLocation ? `Location: ${userLocation}` : ''}

Analyze and respond with ONLY this JSON (no markdown, no code blocks):
{"title":"clear title under 60 chars","description":"enhanced 2-3 sentence description","category":"roads","confidence":0.85,"location":"specific location or null","severity":"high","duration":"1-3 months","tags":["tag1","tag2"]}

STRICT RULES:
- category MUST be one of: roads, water, electricity, sanitation, public-spaces, transportation, other
- confidence MUST be a decimal between 0-1
- severity MUST be: low, medium, high, or urgent
- duration MUST be one of: Less than 24 hours, 1-3 days, 4-7 days, 1-2 weeks, 2-4 weeks, 1-3 months, 3-6 months, More than 6 months
- Extract duration from text (e.g., "2 months" = "1-3 months", "few days" = "1-3 days", "1 week" = "4-7 days")
- Return ONLY raw JSON, no explanation`;

  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 512,
      }
    };

    // Add image if available
    if (imageUrl) {
      const imageData = await imageUrlToBase64(imageUrl);
      if (imageData) {
        requestBody.contents[0].parts.unshift({
          inline_data: {
            mime_type: imageData.mimeType,
            data: imageData.data
          }
        });
      }
    }

    // Make API request
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the response
    const parsed = parseGeminiResponse(textResponse);
    
    if (!parsed) {
      throw new Error('Failed to parse Gemini response');
    }

    // Convert to MLAnalysisResult format
    const result: MLAnalysisResult = {
      suggestedTitle: parsed.title,
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.categoryConfidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: imageUrl ? 'good' : 'fair',
      imageQualityScore: imageUrl ? 0.8 : 0,
      extractedLocation: parsed.location ? {
        address: parsed.location,
        lat: 0,
        lng: 0,
        confidence: 0.6
      } : undefined,
      suggestedDuration: parsed.duration
    };

    return result;

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Analyze text-only content (no image) using Gemini AI
 */
export async function analyzeTextWithGemini(
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `You are analyzing a civic issue report from India for a citizen complaint platform.

User's Description: "${userDescription}"
${userLocation ? `User's Location: "${userLocation}"` : ''}

Respond with a JSON object:
{
  "title": "Clear, concise title (max 60 characters)",
  "description": "Enhanced professional description (2-3 sentences)",
  "category": "One of: roads, water, electricity, sanitation, public-spaces, transportation, other",
  "confidence": 0.0-1.0,
  "severity": "low/medium/high/urgent",
  "tags": ["keywords"]
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseGeminiResponse(textResponse);

    if (!parsed) {
      throw new Error('Failed to parse response');
    }

    return {
      suggestedTitle: parsed.title,
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.categoryConfidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: 'fair',
      imageQualityScore: 0.5
    };

  } catch (error) {
    console.error('Gemini text analysis error:', error);
    throw error;
  }
}

/**
 * Generate title suggestions using Gemini
 */
export async function generateTitleSuggestions(
  description: string,
  category?: IssueCategory
): Promise<string[]> {
  if (!isGeminiConfigured()) {
    return [];
  }

  const prompt = `Generate 3 concise titles for this civic issue report:
Description: "${description}"
${category ? `Category: ${category}` : ''}

Respond with JSON: { "titles": ["title1", "title2", "title3"] }`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
      })
    });

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.titles || [];
    }
    
    return [];
  } catch {
    return [];
  }
}
