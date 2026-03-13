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

async function postAnalyze(endpoint: string, payload: AnalyzePayload): Promise<MLAnalysisResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
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
