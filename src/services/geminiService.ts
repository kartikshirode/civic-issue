/**
 * AI Service - NVIDIA NIM + Google Gemini Integration
 * Primary: NVIDIA Llama 3.2 Vision for image + text analysis
 * Fallback: Google Gemini for text analysis
 * 
 * NVIDIA NIM: https://build.nvidia.com/
 * Gemini: https://ai.google.dev/gemini-api/docs
 */

import { IssueCategory } from "@/types";
import { MLAnalysisResult } from "./mlService";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CATEGORY_MAP: Record<string, IssueCategory> = {
  'roads': 'roads', 'road': 'roads', 'pothole': 'roads', 'potholes': 'roads',
  'highway': 'roads', 'street': 'roads', 'pavement': 'roads', 'sidewalk': 'roads',
  'water': 'water', 'water supply': 'water', 'drainage': 'water', 'sewage': 'water',
  'flooding': 'water', 'leak': 'water', 'pipe': 'water',
  'electricity': 'electricity', 'electrical': 'electricity', 'power': 'electricity',
  'streetlight': 'electricity', 'street light': 'electricity', 'lighting': 'electricity',
  'sanitation': 'sanitation', 'garbage': 'sanitation', 'waste': 'sanitation',
  'trash': 'sanitation', 'cleanliness': 'sanitation',
  'public-spaces': 'public-spaces', 'public space': 'public-spaces', 'park': 'public-spaces',
  'garden': 'public-spaces', 'playground': 'public-spaces',
  'transportation': 'transportation', 'transport': 'transportation', 'traffic': 'transportation',
  'bus': 'transportation', 'signal': 'transportation',
  'other': 'other'
};

function mapToCategory(geminiCategory: string): IssueCategory {
  if (!geminiCategory) return 'other';
  const normalized = geminiCategory.toLowerCase().trim();
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  return 'other';
}

function parseConfidence(confidence: any): number {
  if (typeof confidence === 'number') return confidence;
  if (typeof confidence === 'string') {
    const lower = confidence.toLowerCase();
    if (lower === 'high' || lower === 'very high') return 0.9;
    if (lower === 'medium' || lower === 'moderate') return 0.7;
    if (lower === 'low') return 0.5;
    const num = parseFloat(confidence);
    if (!isNaN(num)) return num > 1 ? num / 100 : num;
  }
  return 0.7;
}

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

function parseAIResponse(text: string): any {
  try {
    let cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: (parsed.title || '').toString().trim(),
        description: (parsed.description || '').toString().trim(),
        category: mapToCategory(parsed.category || 'other'),
        confidence: parseConfidence(parsed.confidence || parsed.categoryConfidence),
        severity: parseSeverity(parsed.severity || parsed.priority),
        location: parsed.location ? parsed.location.toString().trim() : null,
        duration: parsed.duration ? parsed.duration.toString().trim() : undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}

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

export function isNvidiaConfigured(): boolean {
  return !!NVIDIA_API_KEY && NVIDIA_API_KEY !== '';
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here';
}

export async function analyzeWithNvidia(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isNvidiaConfigured()) {
    throw new Error('NVIDIA API key not configured');
  }

  const prompt = `You are analyzing a civic issue complaint from India.

User Description: ${userDescription || 'No description provided'}
${userLocation ? `Location: ${userLocation}` : ''}

Analyze and respond with ONLY valid JSON (no markdown, no code blocks):
{"title":"clear title under 60 chars","description":"2-3 sentence description","category":"roads","confidence":0.85,"severity":"high","duration":"1-3 months"}

STRICT RULES:
- category MUST be one of: roads, water, electricity, sanitation, public-spaces, transportation, other
- confidence MUST be 0-1
- severity MUST be: low, medium, high, or urgent
- duration MUST be one of: Less than 24 hours, 1-3 days, 4-7 days, 1-2 weeks, 2-4 weeks, 1-3 months, 3-6 months, More than 6 months
- Return ONLY raw JSON, no explanation`;

  try {
    const requestBody: any = {
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt }
        ]
      }],
      temperature: 0.1,
      max_tokens: 512
    };

    if (imageUrl) {
      const imageData = await imageUrlToBase64(imageUrl);
      if (imageData) {
        requestBody.messages[0].content.unshift({
          type: "image_url",
          image_url: { url: `data:${imageData.mimeType};base64,${imageData.data}` }
        });
      }
    }

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(textResponse);

    if (!parsed) {
      throw new Error('Failed to parse NVIDIA response');
    }

    return {
      suggestedTitle: parsed.title || 'Civic Issue Report',
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.confidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: imageUrl ? 'good' : 'fair',
      imageQualityScore: imageUrl ? 0.8 : 0.5,
      extractedLocation: parsed.location ? {
        address: parsed.location,
        lat: 0,
        lng: 0,
        confidence: 0.6
      } : undefined,
      suggestedDuration: parsed.duration
    };

  } catch (error) {
    console.error('NVIDIA API error:', error);
    throw error;
  }
}

export async function analyzeTextWithNvidia(
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isNvidiaConfigured()) {
    throw new Error('NVIDIA API key not configured');
  }

  const prompt = `You are analyzing a civic issue complaint from India.

User's Description: "${userDescription}"
${userLocation ? `User's Location: "${userLocation}"` : ''}

Respond with valid JSON:
{"title":"title","description":"description","category":"roads","confidence":0.8,"severity":"medium","tags":[]}

Categories: roads, water, electricity, sanitation, public-spaces, transportation, other`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(textResponse);

    if (!parsed) {
      throw new Error('Failed to parse response');
    }

    return {
      suggestedTitle: parsed.title,
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.confidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: 'fair',
      imageQualityScore: 0.5
    };

  } catch (error) {
    console.error('NVIDIA text analysis error:', error);
    throw error;
  }
}

export async function analyzeWithGemini(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured');
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
- Return ONLY raw JSON, no explanation`;

  try {
    const requestBody: any = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 512,
      }
    };

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

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseAIResponse(textResponse);

    if (!parsed) {
      throw new Error('Failed to parse Gemini response');
    }

    return {
      suggestedTitle: parsed.title || 'Civic Issue Report',
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.confidence,
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

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function analyzeTextWithGemini(
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured.');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseAIResponse(textResponse);

    if (!parsed) {
      throw new Error('Failed to parse response');
    }

    return {
      suggestedTitle: parsed.title,
      enhancedDescription: parsed.description,
      predictedCategory: parsed.category,
      categoryConfidence: parsed.confidence,
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

export async function generateTitleSuggestions(
  description: string,
  category?: IssueCategory
): Promise<string[]> {
  if (isNvidiaConfigured()) {
    try {
      const prompt = `Generate 3 concise titles for this civic issue report:
Description: "${description}"
${category ? `Category: ${category}` : ''}

Respond with JSON: { "titles": ["title1", "title2", "title3"] }`;

      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 256
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.titles || [];
      }
    } catch {
      console.error('NVIDIA title generation failed');
    }
  }

  if (isGeminiConfigured()) {
    try {
      const prompt = `Generate 3 concise titles for this civic issue report:
Description: "${description}"
${category ? `Category: ${category}` : ''}

Respond with JSON: { "titles": ["title1", "title2", "title3"] }`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.titles || [];
      }
    } catch {
      console.error('Gemini title generation failed');
    }
  }

  return [];
}
