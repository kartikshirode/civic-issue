/**
 * Roboflow Service (Frontend)
 * Uses Vercel backend route so API keys are never shipped to the browser.
 */

import { MLAnalysisResult } from "./mlService";

interface AIErrorResponse {
  error?: string;
  message?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isRoboflowConfigured(): boolean {
  return true;
}

export async function analyzeWithRoboflow(imageFile: File): Promise<MLAnalysisResult> {
  const imageBase64 = await fileToBase64(imageFile);
  const response = await fetch("/api/ai/roboflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as AIErrorResponse;
    throw new Error(err.error || err.message || `Roboflow route error: ${response.status}`);
  }

  return response.json();
}

export async function analyzeImageUrlWithRoboflow(imageUrl: string): Promise<MLAnalysisResult> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return analyzeWithRoboflow(file);
}
