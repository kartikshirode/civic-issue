export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { description = "", category } = req.body || {};

  // Lightweight local fallback for now to avoid any key exposure on frontend.
  const base = description.trim().slice(0, 60) || "Civic issue";
  const categoryPrefix = category ? `${category}: ` : "";

  return res.status(200).json({
    titles: [
      `${categoryPrefix}${base}`.slice(0, 60),
      `${categoryPrefix}Issue reported by citizen`.slice(0, 60),
      `${categoryPrefix}Urgent civic attention needed`.slice(0, 60),
    ],
  });
}
