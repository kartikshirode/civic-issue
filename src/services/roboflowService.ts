/**
 * Roboflow Service - Image Analysis for Civic Issue Detection
 * Uses Roboflow Inference API for pothole and garbage detection
 * 
 * Docs: https://docs.roboflow.com/api-reference/inference
*/

import { IssueCategory } from "@/types";
import { MLAnalysisResult } from "./mlService";

const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY || '';
const ROBOFLOW_API_URL = 'https://serverless.roboflow.com';

interface RoboflowPrediction {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: { width: number; height: number };
}

const MODEL_CONFIGS = {
  pothole: {
    modelId: 'pothole-detection-sjbkl/5',
    category: 'roads' as IssueCategory,
    title: 'Pothole',
    description: 'Road damage in the form of a pothole detected. This poses a safety hazard to vehicles and pedestrians.'
  },
  garbage: {
    modelId: 'garbage-detection-aylah/9',
    category: 'sanitation' as IssueCategory,
    title: 'Garbage',
    description: 'Garbage or waste accumulation detected. This creates unhygienic conditions and requires immediate attention.'
  }
};

function isRoboflowConfigured(): boolean {
  return !!ROBOFLOW_API_KEY && ROBOFLOW_API_KEY !== '';
}

function mapClassToCategory(detectedClass: string): IssueCategory {
  const classLower = detectedClass.toLowerCase();
  
  // Roads - English + Portuguese/Spanish
  if (classLower.includes('pothole') || classLower.includes('buraco') || 
      classLower.includes('crack') || classLower.includes('road') || 
      classLower.includes('damage') || classLower.includes('hole')) {
    return 'roads';
  }
  
  // Sanitation - English + Portuguese/Spanish
  if (classLower.includes('garbage') || classLower.includes('lixo') || 
      classLower.includes('waste') || classLower.includes('residue') || 
      classLower.includes('trash') || classLower.includes('detritus')) {
    return 'sanitation';
  }
  
  return 'other';
}

function generateTitle(detectedClass: string, category: IssueCategory): string {
  const titles: Record<string, string> = {
    'roads': 'Road damage - Pothole detected',
    'sanitation': 'Garbage accumulation detected'
  };
  
  return titles[category] || `Issue detected: ${detectedClass}`;
}

function generateDescription(detectedClass: string, category: IssueCategory, confidence: number): string {
  const descriptions: Record<string, string> = {
    'roads': `A pothole has been detected on the road surface. This road damage requires immediate attention to prevent vehicle damage and accidents. Detected with ${Math.round(confidence * 100)}% confidence.`,
    'sanitation': `Garbage or waste accumulation has been detected in this area. This sanitation issue creates unhygienic conditions and poses health risks to the community. Detected with ${Math.round(confidence * 100)}% confidence.`
  };
  
  return descriptions[category] || `Civic issue detected: ${detectedClass}. Requires attention from local authorities. Detected with ${Math.round(confidence * 100)}% confidence.`;
}

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function runInference(imageBase64: string, modelId: string): Promise<RoboflowResponse | null> {
  try {
    const response = await fetch(
      `${ROBOFLOW_API_URL}/${modelId}?api_key=${ROBOFLOW_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: imageBase64
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Roboflow API error for ${modelId}:`, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Roboflow inference error for ${modelId}:`, error);
    return null;
  }
}

export async function analyzeWithRoboflow(
  imageFile: File
): Promise<MLAnalysisResult> {
  if (!isRoboflowConfigured()) {
    throw new Error('Roboflow API key not configured');
  }

  try {
    const imageBase64 = await imageToBase64(imageFile);
    
    const results = await Promise.all([
      runInference(imageBase64, MODEL_CONFIGS.pothole.modelId),
      runInference(imageBase64, MODEL_CONFIGS.garbage.modelId)
    ]);

    const [potholeResult, garbageResult] = results;
    
    let bestPrediction: RoboflowPrediction | null = null;
    let bestModel: keyof typeof MODEL_CONFIGS = 'pothole';
    let bestConfidence = 0;

    if (potholeResult?.predictions?.length > 0) {
      const topPrediction = potholeResult.predictions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      if (topPrediction.confidence > bestConfidence) {
        bestPrediction = topPrediction;
        bestConfidence = topPrediction.confidence;
        bestModel = 'pothole';
      }
    }

    if (garbageResult?.predictions?.length > 0) {
      const topPrediction = garbageResult.predictions.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      if (topPrediction.confidence > bestConfidence) {
        bestPrediction = topPrediction;
        bestConfidence = topPrediction.confidence;
        bestModel = 'garbage';
      }
    }

    if (!bestPrediction) {
      return {
        suggestedTitle: 'Civic issue detected',
        enhancedDescription: 'An issue was detected in the uploaded image but could not be classified. Please provide additional details.',
        predictedCategory: 'other',
        categoryConfidence: 0.3,
        isDuplicate: false,
        isSpam: false,
        spamScore: 0,
        imageQuality: 'fair',
        imageQualityScore: 0.5
      };
    }

    const config = MODEL_CONFIGS[bestModel];
    const category = mapClassToCategory(bestPrediction.class);
    
    return {
      suggestedTitle: generateTitle(bestPrediction.class, category),
      enhancedDescription: generateDescription(bestPrediction.class, category, bestPrediction.confidence),
      predictedCategory: category,
      categoryConfidence: bestPrediction.confidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: bestPrediction.confidence > 0.8 ? 'good' : 'fair',
      imageQualityScore: bestPrediction.confidence
    };

  } catch (error) {
    console.error('Roboflow analysis error:', error);
    throw error;
  }
}

export async function analyzeImageUrlWithRoboflow(
  imageUrl: string
): Promise<MLAnalysisResult> {
  if (!isRoboflowConfigured()) {
    throw new Error('Roboflow API key not configured');
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    
    return analyzeWithRoboflow(file);
  } catch (error) {
    console.error('Error fetching image for Roboflow:', error);
    throw new Error('Failed to fetch image for analysis');
  }
}

export { isRoboflowConfigured };
