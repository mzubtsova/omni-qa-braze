function extractTextNodes(node, texts = new Set()) {
  if (!node) return texts;

  if (node.type === 'TEXT' && node.characters) {
    const textValue = node.characters.trim();
    if (textValue) texts.add(textValue);
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => extractTextNodes(child, texts));
  }

  return texts;
}

function normalizeFileKey(fileKey) {
  let cleanFileKey = String(fileKey || '').trim();
  if (cleanFileKey.includes('figma.com/file/')) {
    const match = cleanFileKey.match(/file\/([^/?#]+)/);
    if (match) cleanFileKey = match[1];
  }
  if (cleanFileKey.includes('figma.com/design/')) {
    const match = cleanFileKey.match(/design\/([^/?#]+)/);
    if (match) cleanFileKey = match[1];
  }
  return cleanFileKey;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'FIGMA_ACCESS_TOKEN is not configured on the server.' });
  }

  const fileKey = normalizeFileKey(req.body?.fileKey);
  if (!fileKey) {
    return res.status(400).json({ error: 'Missing Figma file ID or URL.' });
  }

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': token }
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Figma API error ${response.status}: ${text.slice(0, 300)}`
      });
    }

    const data = JSON.parse(text);
    if (!data.document) {
      return res.status(502).json({ error: "Invalid Figma response. Missing 'document' node." });
    }

    return res.status(200).json({ layers: Array.from(extractTextNodes(data.document)) });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Figma request failed.' });
  }
}
