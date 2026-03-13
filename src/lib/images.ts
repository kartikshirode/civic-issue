type ImageObjectLike = {
  url?: unknown;
  src?: unknown;
};

function extractImageUrl(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value && typeof value === "object") {
    const candidate = value as ImageObjectLike;
    if (typeof candidate.url === "string" && candidate.url.trim()) {
      return candidate.url.trim();
    }
    if (typeof candidate.src === "string" && candidate.src.trim()) {
      return candidate.src.trim();
    }
  }

  return null;
}

export function normalizeIssueImages(images: unknown, fallback = "/placeholder.svg"): string[] {
  const normalized = Array.isArray(images)
    ? images.map(extractImageUrl).filter((url): url is string => Boolean(url))
    : [];

  if (normalized.length > 0) return normalized;
  return fallback ? [fallback] : [];
}

export function normalizeIssueImage(value: unknown, fallback = "/placeholder.svg"): string {
  const imageUrl = extractImageUrl(value);
  return imageUrl || fallback;
}
