import { normalizeBrazePayload } from '../utils/campaignAudit.js';

export async function importBrazeJourney(source) {
  const response = await fetch('/api/braze-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Braze import failed with status ${response.status}.`);
  }
  return normalizeBrazePayload(payload.payload, payload.source);
}
