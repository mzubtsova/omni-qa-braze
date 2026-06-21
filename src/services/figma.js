/**
 * Service client for Figma API integrations.
 */

/**
 * Fetches design layout text layers from a Figma file.
 */
export async function fetchFigmaTextLayers(fileKey, token) {
  if (!fileKey) {
    // Return mock figma texts if credentials are not configured (Sandbox fallback)
    return getMockFigmaTexts();
  }

  if (token) {
    console.warn('Browser-provided Figma tokens are no longer used. Configure FIGMA_ACCESS_TOKEN on the server instead.');
  }

  try {
    const response = await fetch('/api/figma-layers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Figma API error! status: ${response.status}`);
    }

    if (!Array.isArray(data.layers)) {
      throw new Error("Invalid response format. No 'layers' array found.");
    }

    return data.layers;
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
    'Northstar Rewards',
    'Your welcome reward is ready',
    'Explore your new member benefits and available offers.',
    'Valid for 14 days',
    'View Offer',
    'Welcome, Marina!'
  ];
}
