import { imageUrlToDataUrl, parseAIResponse, toMlResult } from "./_shared.js";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "NVIDIA key missing on server" });

  try {
    const { imageUrl = "", userDescription = "", userLocation } = req.body || {};

    const prompt = `You are analyzing a civic issue complaint from India.\n\nUser Description: ${userDescription || "No description provided"}\n${userLocation ? `Location: ${userLocation}` : ""}\n\nRespond with ONLY valid JSON:\n{"title":"clear title under 60 chars","description":"2-3 sentence description","category":"roads","confidence":0.85,"duration":"1-3 months"}\n\nSTRICT: category must be one of roads, water, electricity, sanitation, public-spaces, transportation, other.`;

    const requestBody = {
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      temperature: 0.1,
      max_tokens: 512,
    };

    const dataUrl = await imageUrlToDataUrl(imageUrl);
    if (dataUrl) {
      requestBody.messages[0].content.unshift({
        type: "image_url",
        image_url: { url: dataUrl },
      });
    }

    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `NVIDIA error: ${errText}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = parseAIResponse(text);
    if (!parsed) return res.status(422).json({ error: "Failed to parse NVIDIA response" });

    return res.status(200).json(toMlResult(parsed, Boolean(dataUrl)));
  } catch (error) {
    return res.status(500).json({ error: error?.message || "NVIDIA route failed" });
  }
}
