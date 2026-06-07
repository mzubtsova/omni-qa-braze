/**
 * Service client for Figma API integrations.
 */

/**
 * Traverses the Figma JSON tree recursively to extract text characters.
 */
function extractTextNodes(node, texts = new Set()) {
  if (!node) return texts;

  if (node.type === 'TEXT' && node.characters) {
    const textVal = node.characters.trim();
    if (textVal.length > 0) {
      texts.add(textVal);
    }
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => extractTextNodes(child, texts));
  }

  return texts;
}

/**
 * Fetches design layout text layers from a Figma file.
 */
export async function fetchFigmaTextLayers(fileKey, token) {
  if (!token || !fileKey) {
    // Return mock figma texts if credentials are not configured (Sandbox fallback)
    return getMockFigmaTexts();
  }

  // Support full Figma URLs by extracting file key
  let cleanFileKey = fileKey.trim();
  if (cleanFileKey.includes('figma.com/file/')) {
    const match = cleanFileKey.match(/file\/([^/?#]+)/);
    if (match) cleanFileKey = match[1];
  }

  const url = `https://api.figma.com/v1/files/${cleanFileKey}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': token.trim()
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Figma API error! status: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (!data.document) {
      throw new Error("Invalid response format. No 'document' node found in Figma file.");
    }

    const uniqueTexts = extractTextNodes(data.document);
    return Array.from(uniqueTexts);
  } catch (error) {
    console.error("Figma API fetch failed:", error);
    throw error;
  }
}

/**
 * Returns mock Figma layers for sandbox operation.
 */
function getMockFigmaTexts() {
  return [
    'Dairy Queen Exclusive',
    'Get a FREE Small Blizzard',
    'Enjoy soft serve ice cream blended with your favorite toppings!',
    'Valid for 14 days',
    'Claim Offer',
    'Welcome, Marina!'
  ];
}
