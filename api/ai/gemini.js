import { imageUrlToDataUrl, parseAIResponse, toMlResult } from "./_shared.js";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Gemini key missing on server" });

  try {
    const { imageUrl = "", userDescription = "", userLocation } = req.body || {};

    const prompt = `You are analyzing a civic issue report from India.\n\nUser Description: ${userDescription || "No description provided"}\n${userLocation ? `Location: ${userLocation}` : ""}\n\nRespond with ONLY valid JSON:\n{"title":"clear title under 60 chars","description":"2-3 sentence description","category":"roads","confidence":0.85,"location":"specific location or null","duration":"1-3 months"}\n\nSTRICT: category must be one of roads, water, electricity, sanitation, public-spaces, transportation, other.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    };

    const dataUrl = await imageUrlToDataUrl(imageUrl);
    if (dataUrl) {
      const [, metaAndData] = dataUrl.split(":");
      const [mimeAndBase64] = metaAndData.split(";");
      const [, b64] = dataUrl.split(",");
      requestBody.contents[0].parts.unshift({
        inline_data: {
          mime_type: mimeAndBase64,
          data: b64,
        },
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini error: ${errText}` });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = parseAIResponse(text);
    if (!parsed) return res.status(422).json({ error: "Failed to parse Gemini response" });

    return res.status(200).json(toMlResult(parsed, Boolean(dataUrl)));
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Gemini route failed" });
  }
}
