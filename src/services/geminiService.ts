/**
 * AI Service (Frontend)
 * All secret-key provider calls are proxied through Vercel backend routes.
 * No API keys are exposed to the browser.
 */

import { IssueCategory } from "@/types";
import { MLAnalysisResult } from "./mlService";

interface AnalyzePayload {
  imageUrl: string;
  userDescription: string;
  userLocation?: string;
}

interface AIErrorResponse {
  error?: string;
  message?: string;
}

function fallbackAnalyze(payload: AnalyzePayload): MLAnalysisResult {
  const text = String(payload.userDescription || "").trim();
  const lower = text.toLowerCase();

  let predictedCategory: MLAnalysisResult["predictedCategory"] = "other";
  if (/(pothole|road|street|asphalt|crack)/.test(lower)) predictedCategory = "roads";
  else if (/(water|drain|sewage|leak|flood)/.test(lower)) predictedCategory = "water";
  else if (/(light|electric|power|wire|transformer)/.test(lower)) predictedCategory = "electricity";
  else if (/(garbage|waste|trash|sanitation|dirty)/.test(lower)) predictedCategory = "sanitation";
  else if (/(park|playground|footpath|public)/.test(lower)) predictedCategory = "public-spaces";
  else if (/(traffic|signal|bus|transport|metro)/.test(lower)) predictedCategory = "transportation";

  const firstSentence = text.split(/[.!?]\s+/)[0]?.trim() || "Civic issue reported";
  const title = firstSentence.length > 60 ? `${firstSentence.slice(0, 57)}...` : firstSentence;

  return {
    suggestedTitle: title,
    enhancedDescription: text || "Issue report submitted by citizen.",
    predictedCategory,
    categoryConfidence: text ? 0.62 : 0.5,
    isDuplicate: false,
    isSpam: false,
    spamScore: 0,
    imageQuality: payload.imageUrl ? "good" : "fair",
    imageQualityScore: payload.imageUrl ? 0.8 : 0.5,
    extractedLocation: payload.userLocation
      ? { address: payload.userLocation, lat: 0, lng: 0, confidence: 0.6 }
      : undefined,
    suggestedDuration: "1-2 weeks",
  };
}

async function postAnalyze(endpoint: string, payload: AnalyzePayload): Promise<MLAnalysisResult> {
  const isPlainViteDev = import.meta.env.DEV && typeof window !== "undefined" && window.location.port === "8080";
  if (isPlainViteDev && endpoint.startsWith("/api/ai/")) {
    return fallbackAnalyze(payload);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // In plain Vite dev server, /api routes are not available (404). Fall back locally.
    if (response.status === 404 || response.status >= 500) {
      return fallbackAnalyze(payload);
    }

    const err = (await response.json().catch(() => ({}))) as AIErrorResponse;
    throw new Error(err.error || err.message || `AI route error: ${response.status}`);
  }

  return response.json();
}

// These are route-availability checks now, not local env checks.
// Keep them true so frontend can attempt backend routes in dev/prod.
export function isNvidiaConfigured(): boolean {
  return true;
}

export function isGeminiConfigured(): boolean {
  return true;
}

export async function analyzeWithNvidia(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  return postAnalyze("/api/ai/nvidia", { imageUrl, userDescription, userLocation });
}

export async function analyzeTextWithNvidia(
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  return postAnalyze("/api/ai/nvidia", { imageUrl: "", userDescription, userLocation });
}

export async function analyzeWithGemini(
  imageUrl: string,
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  return postAnalyze("/api/ai/gemini", { imageUrl, userDescription, userLocation });
}

export async function analyzeTextWithGemini(
  userDescription: string,
  userLocation?: string
): Promise<MLAnalysisResult> {
  return postAnalyze("/api/ai/gemini", { imageUrl: "", userDescription, userLocation });
}

export async function generateTitleSuggestions(
  description: string,
  category?: IssueCategory
): Promise<string[]> {
  const response = await fetch("/api/ai/title-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, category }),
  });

  if (!response.ok) return [];
  const data = (await response.json().catch(() => ({}))) as { titles?: string[] };
  return data.titles || [];
}
