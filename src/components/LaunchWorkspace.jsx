import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'omniqa_launch_workspace';
const CHECKLIST_KEY = 'omniqa_launch_checklist';

const campaignTemplates = {
  birthday: {
    label: 'Birthday / Milestone',
    channelPlan: 'Email, push, IAM, and webhook verification',
    subjectLine: 'Happy birthday, {{ user.first_name | default: "there" }}',
    pushBody: 'Happy birthday! Your birthday reward is ready. Open the app to view details.',
    smsBody: 'Happy birthday from Rewards! View your birthday message: https://example.com/birthday',
    iamHeader: 'Happy Birthday',
    iamBody: 'Your special birthday message is waiting for you.',
    iamButtonText: 'View Details',
    iamButtonLink: 'https://example.com/birthday?utm_source=braze&utm_medium=iam&utm_campaign=birthday',
    checklist: [
      'Confirm birthday date trigger and time zone handling.',
      'Verify annual suppression so users do not receive duplicate gifts.',
      'Check loyalty versus non-loyalty content paths.',
      'Confirm webhook success path, waiting period, and fallback messaging.',
      'Validate channel opt-in routing and deep links.'
    ]
  },
  onboarding: {
    label: 'Onboarding Journey',
    channelPlan: 'Canvas, triggered email, push, content card, survey, and webhooks',
    subjectLine: 'Welcome, {{ user.first_name | default: "there" }}',
    pushBody: 'Welcome! Keep going to unlock your next onboarding milestone.',
    smsBody: 'Welcome to Rewards. Continue your onboarding journey: https://example.com/start',
    iamHeader: 'Welcome Aboard',
    iamBody: 'Complete your first steps to unlock more value in your account.',
    iamButtonText: 'Continue',
    iamButtonLink: 'https://example.com/start?utm_source=braze&utm_medium=iam&utm_campaign=onboarding',
    checklist: [
      'Confirm entry criteria for new users and loyalty enrollment status.',
      'Validate Day 0-16 and Day 17-53 journey handoff logic.',
      'Check A/B paths for offer versus challenge experience.',
      'Verify completion event and webhook removal logic.',
      'Confirm survey eligibility exclusions and reward fulfillment.'
    ]
  },
  promo: {
    label: 'Promotional Loyalty Challenge',
    channelPlan: 'Launch canvas, reminder canvas, triggered push, and last-day push',
    subjectLine: 'Earn bonus points with your favorite category',
    pushBody: 'Earn bonus points when you order from your favorite category before the offer ends.',
    smsBody: 'Rewards: Earn bonus points with your favorite category. Details: https://example.com/challenge',
    iamHeader: 'Bonus Points Challenge',
    iamBody: 'Order from your favorite category during the offer window to earn bonus points.',
    iamButtonText: 'Start Challenge',
    iamButtonLink: 'https://example.com/challenge?utm_source=braze&utm_medium=iam&utm_campaign=bonus_points',
    checklist: [
      'Confirm favorite-category custom attribute and fallback category.',
      'Validate launch, reminder, triggered, and last-day channel logic.',
      'Check dynamic content by treats, food, and drinks.',
      'Confirm SMS only targets eligible push opt-out users.',
      'Verify reward event, point assignment, and congrats trigger.'
    ]
  },
  winback: {
    label: 'Winback / Reactivation',
    channelPlan: 'Segmented email, push, IAM, and suppression logic',
    subjectLine: 'We saved something for you',
    pushBody: 'Still thinking it over? Open the app to see what is waiting.',
    smsBody: 'Rewards: Your offer is waiting. View details: https://example.com/return',
    iamHeader: 'Welcome Back',
    iamBody: 'Return today and see what is available in your account.',
    iamButtonText: 'See Offer',
    iamButtonLink: 'https://example.com/return?utm_source=braze&utm_medium=iam&utm_campaign=winback',
    checklist: [
      'Validate lapsed and dormant audience definitions.',
      'Confirm recent purchasers and unsubscribed users are excluded.',
      'Check offer expiration and fallback messaging.',
      'Review frequency caps across all reactivation sends.',
      'Validate channel priority and opt-in handling.'
    ]
  }
};

const profilePresets = {
  loyalFood: {
    label: 'Food favorite / push opted-in',
    values: {
      'user.first_name': 'Maya',
      first_name: 'Maya',
      favorite_category: 'food',
      points_balance: '420',
      language: 'en',
      country: 'US',
      push_opt_in: 'true'
    }
  },
  loyalTreats: {
    label: 'Treats favorite / email fallback',
    values: {
      'user.first_name': 'Alex',
      first_name: 'Alex',
      favorite_category: 'treats',
      points_balance: '180',
      language: 'en',
      country: 'CA',
      push_opt_in: 'false'
    }
  },
  missingData: {
    label: 'Missing attributes fallback',
    values: {
      'user.first_name': '',
      first_name: '',
      favorite_category: '',
      points_balance: '',
      language: 'en',
      country: 'US',
      push_opt_in: 'false'
    }
  }
};

function createId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeChecklist(items = []) {
  return items.map(item => {
    if (typeof item === 'string') {
      return {
        id: createId(),
        text: item,
        done: false,
        comment: ''
      };
    }

    return {
      id: item.id || createId(),
      text: item.text || '',
      done: Boolean(item.done),
      comment: item.comment || ''
    };
  });
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function stripHtml(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderLiquidText(text, profile) {
  if (!text) return '';

  let rendered = text.replace(/\{\{\s*([^}|]+?)(?:\s*\|\s*default\s*:\s*["']([^"']+)["'])?\s*\}\}/g, (_, key, fallback = '') => {
    const cleanKey = key.trim();
    const value = profile[cleanKey] ?? profile[cleanKey.replace(/^user\./, '')] ?? '';
    return value || fallback;
  });

  rendered = rendered.replace(/\{%\s*if\s+([^%]+?)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g, (_, condition, truthy, fallback = '') => {
    const key = condition.trim().split(/\s+/)[0];
    return profile[key] ? truthy : fallback;
  });

  return rendered.replace(/\{%\s*(for|endfor|assign|elsif|else|endif)[^%]*%\}/g, '').trim();
}

function collectLinks({ brazeHtml, iamButtonLink, smsBody, pushBody }) {
  const links = [];
  const hrefRegex = /<a\s+[^>]*href=["']([^"']*)["']/gi;
  let match;
  while ((match = hrefRegex.exec(brazeHtml)) !== null) {
    links.push({ channel: 'Email HTML', url: match[1] });
  }

  [
    ['IAM button', iamButtonLink],
    ['SMS', smsBody],
    ['Push', pushBody]
  ].forEach(([channel, value]) => {
    const text = value || '';
    const matches = text.match(/https?:\/\/[^\s)]+/gi) || [];
    matches.forEach(url => links.push({ channel, url }));
  });

  return links;
}

export default function LaunchWorkspace({
  campaignState,
  setCampaignState,
  scores,
  onRunAudit
}) {
  const [workspace, setWorkspace] = useState(() => loadJson(STORAGE_KEY, {
    campaignName: 'New CRM Campaign QA',
    campaignType: 'promo',
    launchDate: '',
    audience: 'Eligible loyalty audience',
    offerLogic: 'Send personalized content based on user attributes and channel eligibility.',
    expectedVariables: 'user.first_name, favorite_category, points_balance',
    customCampaignType: '',
    notes: ''
  }));
  const [activeProfileKey, setActiveProfileKey] = useState('loyalFood');
  const [checklist, setChecklist] = useState(() => normalizeChecklist(
    loadJson(CHECKLIST_KEY, campaignTemplates[workspace.campaignType]?.checklist || [])
  ));
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [openCommentIds, setOpenCommentIds] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
  }, [checklist]);

  const activeProfile = profilePresets[activeProfileKey].values;
  const renderedPreview = useMemo(() => ({
    subject: renderLiquidText(campaignState.subjectLine, activeProfile),
    email: renderLiquidText(stripHtml(campaignState.brazeHtml), activeProfile),
    push: renderLiquidText(campaignState.pushBody, activeProfile),
    sms: renderLiquidText(campaignState.smsBody, activeProfile),
    iamHeader: renderLiquidText(campaignState.iamHeader, activeProfile),
    iamBody: renderLiquidText(campaignState.iamBody, activeProfile)
  }), [activeProfile, campaignState]);

  const links = useMemo(() => collectLinks(campaignState), [campaignState]);
  const activeTemplate = campaignTemplates[workspace.campaignType];
  const channelPlan = activeTemplate?.channelPlan || 'Manual campaign type. Add the channels, checks, and launch notes that fit this build.';
  const checklistDone = checklist.filter(item => item.done).length;

  const riskLabel = scores.overall >= 90 ? 'Launch ready' : scores.overall >= 75 ? 'Needs review' : 'Needs fixes';

  const applyTemplate = () => {
    const template = activeTemplate;
    if (!template) return;

    setCampaignState({
      subjectLine: template.subjectLine,
      pushBody: template.pushBody,
      smsBody: template.smsBody,
      iamHeader: template.iamHeader,
      iamBody: template.iamBody,
      iamButtonText: template.iamButtonText,
      iamButtonLink: template.iamButtonLink
    });
    setChecklist(normalizeChecklist(template.checklist));
  };

  const updateChecklistItem = (id, updates) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addCheckpoint = () => {
    const text = newCheckpoint.trim();
    if (!text) return;

    setChecklist(prev => [
      ...prev,
      {
        id: createId(),
        text,
        done: false,
        comment: ''
      }
    ]);
    setNewCheckpoint('');
  };

  const removeCheckpoint = (id) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
    setOpenCommentIds(prev => prev.filter(openId => openId !== id));
  };

  const toggleComment = (id) => {
    setOpenCommentIds(prev => prev.includes(id) ? prev.filter(openId => openId !== id) : [...prev, id]);
  };

  return (
    <div className="launch-workspace">
      <section className="launch-summary">
        <div>
          <p className="eyebrow">Launch Workspace</p>
          <h2>{workspace.campaignName}</h2>
          <p>
            One place to prep a campaign for review: setup, checklist, personalization preview, links, and final notes.
          </p>
        </div>
        <div className="launch-status-strip" aria-label="Launch status">
          <strong>{scores.overall}/100</strong>
          <span>{riskLabel}</span>
          <small>{checklistDone}/{checklist.length} checklist complete</small>
        </div>
      </section>

      <section className="launch-grid">
        <div className="panel">
          <h3>Campaign Setup</h3>
          <div className="form-group">
            <label className="form-label">Campaign name</label>
            <input className="form-input" value={workspace.campaignName} onChange={e => setWorkspace({ ...workspace, campaignName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Campaign type</label>
            <select className="form-select" value={workspace.campaignType} onChange={e => setWorkspace({ ...workspace, campaignType: e.target.value })}>
              {Object.entries(campaignTemplates).map(([key, template]) => (
                <option key={key} value={key}>{template.label}</option>
              ))}
              <option value="custom">Custom / Manual Type</option>
            </select>
          </div>
          {workspace.campaignType === 'custom' && (
            <div className="form-group">
              <label className="form-label">Manual campaign type</label>
              <input
                className="form-input"
                value={workspace.customCampaignType}
                onChange={e => setWorkspace({ ...workspace, customCampaignType: e.target.value })}
                placeholder="Example: Loyalty header refresh, footer update, triggered webhook"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Launch date</label>
            <input className="form-input" type="date" value={workspace.launchDate} onChange={e => setWorkspace({ ...workspace, launchDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Audience / segment</label>
            <textarea className="form-textarea" value={workspace.audience} onChange={e => setWorkspace({ ...workspace, audience: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Offer / journey logic</label>
            <textarea className="form-textarea" value={workspace.offerLogic} onChange={e => setWorkspace({ ...workspace, offerLogic: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Expected personalization fields</label>
            <input className="form-input" value={workspace.expectedVariables} onChange={e => setWorkspace({ ...workspace, expectedVariables: e.target.value })} />
          </div>
          <div className="button-row">
            <button className="btn btn-primary" onClick={applyTemplate} disabled={!activeTemplate}>Apply Template Copy</button>
            <button className="btn btn-secondary" onClick={() => onRunAudit()}>Run Full QA</button>
          </div>
        </div>

        <div className="panel checklist-panel">
          <div className="panel-topline">
            <div>
              <h3>Review Checklist</h3>
              <p className="muted-copy">{channelPlan}</p>
            </div>
            <span className="checklist-count">{checklistDone}/{checklist.length}</span>
          </div>
          <div className="qa-checklist">
            {checklist.map((item, index) => (
              <div key={item.id} className="qa-check-card">
                <div className="qa-check-row">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={e => updateChecklistItem(item.id, { done: e.target.checked })}
                    aria-label={`Mark checkpoint ${index + 1} complete`}
                  />
                  <textarea
                    className="form-textarea checkpoint-input"
                    rows="2"
                    value={item.text}
                    onChange={e => updateChecklistItem(item.id, { text: e.target.value })}
                    aria-label={`Checkpoint ${index + 1}`}
                  />
                  <button className="mini-button" type="button" onClick={() => toggleComment(item.id)}>
                    {item.comment ? 'Edit Note' : 'Note'}
                  </button>
                  <button className="icon-button" type="button" onClick={() => removeCheckpoint(item.id)} aria-label={`Remove checkpoint ${index + 1}`}>
                    ×
                  </button>
                </div>
                {(openCommentIds.includes(item.id) || item.comment) && (
                  <textarea
                    className="form-textarea checkpoint-comment"
                    value={item.comment}
                    onChange={e => updateChecklistItem(item.id, { comment: e.target.value })}
                    placeholder="Add a QA note, blocker, owner, or follow-up..."
                    aria-label={`Comment for checkpoint ${index + 1}`}
                  />
                )}
              </div>
            ))}
            <div className="qa-add-row">
              <input
                className="form-input"
                value={newCheckpoint}
                onChange={e => setNewCheckpoint(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCheckpoint();
                  }
                }}
                placeholder="Add a new checkpoint"
              />
              <button className="btn btn-secondary" type="button" onClick={addCheckpoint}>Add</button>
            </div>
          </div>
        </div>

        <div className="panel wide-panel workspace-review-panel">
          <div>
            <h3>Personalization Preview</h3>
            <p className="muted-copy">
              Pick a sample profile to see how dynamic fields and fallbacks render before launch.
            </p>
            <div className="profile-tabs compact-tabs">
              {Object.entries(profilePresets).map(([key, profile]) => (
                <button key={key} className={`btn ${activeProfileKey === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveProfileKey(key)}>
                  {profile.label}
                </button>
              ))}
            </div>
            <div className="preview-grid">
              <div><strong>Subject</strong><p>{renderedPreview.subject}</p></div>
              <div><strong>Push</strong><p>{renderedPreview.push}</p></div>
              <div><strong>SMS</strong><p>{renderedPreview.sms}</p></div>
              <div><strong>IAM</strong><p>{renderedPreview.iamHeader}: {renderedPreview.iamBody}</p></div>
            </div>
          </div>

          <div>
            <h3>Links</h3>
            <p className="muted-copy">Quick scan for missing tracking before deeper technical review.</p>
            <div className="link-table">
              {links.length === 0 ? (
                <p className="muted-copy">No links detected yet.</p>
              ) : links.map((link, index) => (
                <div className="link-row" key={`${link.url}-${index}`}>
                  <span>{link.channel}</span>
                  <code>{link.url}</code>
                  <strong className={link.url.includes('utm_') ? 'ok' : 'warn'}>{link.url.includes('utm_') ? 'UTM' : 'No UTM'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="reviewer-notes-panel">
            <h3>Reviewer Notes</h3>
            <textarea
              className="form-textarea"
              value={workspace.notes}
              onChange={e => setWorkspace({ ...workspace, notes: e.target.value })}
              placeholder="Add launch decision notes, open questions, owners, or blockers..."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
