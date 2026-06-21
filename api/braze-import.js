function parseSource(body = {}) {
  const rawInput = String(body.url || body.id || '').trim();
  let type = body.type === 'canvas' ? 'canvas' : body.type === 'campaign' ? 'campaign' : '';
  let id = String(body.id || '').trim();

  if (rawInput.includes('braze.com')) {
    const canvasMatch = rawInput.match(/\/canvas(?:es)?\/([a-zA-Z0-9-]+)/i);
    const campaignMatch = rawInput.match(/\/campaign(?:s)?\/([a-zA-Z0-9-]+)/i);
    if (canvasMatch) {
      type = 'canvas';
      id = canvasMatch[1];
    } else if (campaignMatch) {
      type = 'campaign';
      id = campaignMatch[1];
    }
  } else if (!id) {
    id = rawInput;
  }

  if (!type) type = 'campaign';
  return { type, id, url: body.url || '' };
}

function getBrazeEndpoint() {
  const configured = process.env.BRAZE_REST_ENDPOINT;
  if (!configured) throw new Error('BRAZE_REST_ENDPOINT is not configured on the server.');
  const endpoint = new URL(configured);
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.braze.com')) {
    throw new Error('BRAZE_REST_ENDPOINT must be an HTTPS Braze REST endpoint.');
  }
  return endpoint.origin;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BRAZE_REST_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'BRAZE_REST_API_KEY is not configured on the server.' });
  }

  let endpoint;
  try {
    endpoint = getBrazeEndpoint();
  } catch (error) {
    return res.status(503).json({ error: error.message });
  }

  const source = parseSource(req.body);
  if (!source.id || !/^[a-zA-Z0-9-]+$/.test(source.id)) {
    return res.status(400).json({ error: 'Enter a valid Braze Campaign or Canvas URL/ID.' });
  }

  const path = source.type === 'canvas' ? '/canvas/details' : '/campaigns/details';
  const idParam = source.type === 'canvas' ? 'canvas_id' : 'campaign_id';
  const query = new URLSearchParams({ [idParam]: source.id });
  if (req.body?.postLaunchDraftVersion) query.set('post_launch_draft_version', 'true');

  try {
    const response = await fetch(`${endpoint}${path}?${query}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const responseText = await response.text();
    const payload = JSON.parse(responseText || '{}');

    if (!response.ok) {
      const detail = payload.message || payload.error || responseText.slice(0, 240);
      return res.status(response.status).json({ error: `Braze import failed: ${detail}` });
    }

    return res.status(200).json({ payload, source: { ...source, source: 'braze' } });
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Braze request failed.' });
  }
}
