export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    figmaConfigured: Boolean(process.env.FIGMA_ACCESS_TOKEN),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  });
}
