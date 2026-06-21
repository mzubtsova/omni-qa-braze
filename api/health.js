export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    figmaConfigured: Boolean(process.env.FIGMA_ACCESS_TOKEN),
    brazeConfigured: Boolean(process.env.BRAZE_REST_API_KEY && process.env.BRAZE_REST_ENDPOINT),
    brazeReadOnly: true,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  });
}
