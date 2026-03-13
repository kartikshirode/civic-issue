export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Roboflow key missing on server" });

  const potholeModel = process.env.ROBOFLOW_POTHOLE_MODEL_ID || "pothole-detection-sjbkl/5";
  const garbageModel = process.env.ROBOFLOW_GARBAGE_MODEL_ID || "garbage-detection-aylah/9";

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    async function runInference(modelId) {
      const response = await fetch(`https://serverless.roboflow.com/${modelId}?api_key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: imageBase64,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Roboflow ${modelId}: ${text}`);
      }

      return response.json();
    }

    const [potholeResult, garbageResult] = await Promise.all([
      runInference(potholeModel),
      runInference(garbageModel),
    ]);

    const potholeTop = potholeResult?.predictions?.reduce((best, cur) =>
      (cur.confidence > (best?.confidence || 0) ? cur : best), null
    );
    const garbageTop = garbageResult?.predictions?.reduce((best, cur) =>
      (cur.confidence > (best?.confidence || 0) ? cur : best), null
    );

    const best = (!potholeTop || (garbageTop?.confidence || 0) > potholeTop.confidence)
      ? garbageTop
      : potholeTop;

    if (!best) {
      return res.status(200).json({
        suggestedTitle: "Civic issue detected",
        enhancedDescription: "Image analyzed but no strong pothole/garbage detection found.",
        predictedCategory: "other",
        categoryConfidence: 0.3,
        isDuplicate: false,
        isSpam: false,
        spamScore: 0,
        imageQuality: "fair",
        imageQualityScore: 0.5,
      });
    }

    const isGarbage = best === garbageTop;
    const category = isGarbage ? "sanitation" : "roads";

    return res.status(200).json({
      suggestedTitle: isGarbage ? "Garbage accumulation detected" : "Road damage - pothole detected",
      enhancedDescription: isGarbage
        ? `Garbage/waste accumulation detected with ${Math.round(best.confidence * 100)}% confidence.`
        : `Pothole detected with ${Math.round(best.confidence * 100)}% confidence.`,
      predictedCategory: category,
      categoryConfidence: best.confidence,
      isDuplicate: false,
      isSpam: false,
      spamScore: 0,
      imageQuality: best.confidence > 0.8 ? "good" : "fair",
      imageQualityScore: best.confidence,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Roboflow route failed" });
  }
}
