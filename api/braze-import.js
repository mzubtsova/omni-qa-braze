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

  const source = parseSource(req.body);
  if (!source.id || !/^[a-zA-Z0-9-]+$/.test(source.id)) {
    return res.status(400).json({ error: 'Enter a valid Braze Campaign or Canvas URL/ID.' });
  }

  if (apiKey === 'mock_braze_key_123') {
    let mockPayload;
    const lowerId = source.id.toLowerCase();

    if (lowerId.includes('spring') || lowerId.includes('sale')) {
      // 100 Score Campaign - No findings, has preheader, from, and conversion behaviors
      mockPayload = {
        name: `Simulated Spring Sale Campaign (${source.id})`,
        draft: false,
        enabled: true,
        conversion_behaviors: [
          { type: "Purchase", window: 86400 }
        ],
        messages: [
          {
            id: "msg-spring-sale",
            channel: "email",
            name: "Spring Sale Email Variant",
            subject: "🌸 Spring Sale: Get 20% off today!",
            preheader: "Shop our exclusive spring collection now.",
            body: "<p>Use coupon code SPRING20 at checkout.</p><a href=\"https://brand.com/spring-sale?utm_source=braze\">Shop Now</a>",
            from: "newsletter@brand.com"
          }
        ]
      };
    } else if (lowerId.includes('ab-test') || lowerId.includes('notification')) {
      // Low Score Campaign - Blocker & High findings (empty subject, missing from, staging link)
      mockPayload = {
        name: `Simulated A/B Test Campaign (${source.id})`,
        draft: true,
        messages: [
          {
            id: "msg-ab-test",
            channel: "email",
            name: "Welcome Variant A",
            subject: "",
            preheader: "Come back and see us!",
            body: "<p>We miss you! Here is a coupon.</p><a href=\"http://staging.brand.com/claim-rewards\">Claim Rewards</a>",
            from: ""
          }
        ]
      };
    } else if (lowerId.includes('welcome') || lowerId.includes('canvas') || source.type === 'canvas') {
      // Multi-step Canvas with a warning (very long push body)
      mockPayload = {
        name: `Simulated Onboarding Canvas (${source.id})`,
        draft: true,
        steps: [
          {
            id: "step-1",
            name: "Onboarding Welcome Email",
            type: "email",
            messages: [
              {
                id: "msg-welcome-email",
                channel: "email",
                name: "Welcome Email",
                subject: "Welcome to our application!",
                preheader: "Start your journey today.",
                body: "<p>Thanks for signing up!</p><a href=\"https://brand.com/onboarding?utm_source=braze\">Get Started</a>",
                from: "support@brand.com"
              }
            ]
          },
          {
            id: "step-2",
            name: "Follow-up Push Warning",
            type: "push",
            messages: [
              {
                id: "msg-followup-push",
                channel: "push",
                name: "Push Variant",
                title: "Quick reminder!",
                body: "This is an extremely long push notification body that is going to exceed the standard recommended limit of 178 characters to make sure the platform truncation audit warns the marketer before sending it out to devices.",
                from: ""
              }
            ]
          }
        ]
      };
    } else {
      // Default: Medium findings (missing preheader, no conversion behaviors)
      mockPayload = {
        name: `Simulated Live Campaign (${source.id})`,
        draft: true,
        messages: [
          {
            channel: "email",
            name: "Campaign Email Variant",
            subject: "Your offer has arrived!",
            body: "<p>Live import simulation successfully loaded from the serverless backend.</p><a href=\"https://brand.com/claim?utm_source=braze\">Claim Offer</a>",
            from: "offers@brand.com"
          }
        ]
      };
    }

    return res.status(200).json({ payload: mockPayload, source: { ...source, source: 'braze' } });
  }

  let endpoint;
  try {
    endpoint = getBrazeEndpoint();
  } catch (error) {
    return res.status(503).json({ error: error.message });
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
