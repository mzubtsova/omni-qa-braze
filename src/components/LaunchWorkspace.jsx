import { useEffect, useState } from 'react';

const STORAGE_KEY = 'omniqa_launch_workspace';
const CHECKLIST_KEY = 'omniqa_launch_checklist';
const CUSTOM_TYPES_KEY = 'omniqa_custom_campaign_types';

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

export default function LaunchWorkspace({
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
  const [customTypes, setCustomTypes] = useState(() => loadJson(CUSTOM_TYPES_KEY, []));
  const [newCampaignType, setNewCampaignType] = useState('');
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

  useEffect(() => {
    localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(customTypes));
  }, [customTypes]);

  const activeTemplate = campaignTemplates[workspace.campaignType];
  const selectedCustomType = customTypes.find(type => type.id === workspace.campaignType);
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

  const addCampaignType = () => {
    const label = newCampaignType.trim();
    if (!label) return;

    const type = {
      id: `custom-${createId()}`,
      label
    };
    setCustomTypes(prev => [...prev, type]);
    setWorkspace(prev => ({ ...prev, campaignType: type.id }));
    setNewCampaignType('');
  };

  const removeCampaignType = () => {
    if (!selectedCustomType) return;
    setCustomTypes(prev => prev.filter(type => type.id !== selectedCustomType.id));
    setWorkspace(prev => ({ ...prev, campaignType: 'promo' }));
  };

  const checklistPanel = (
    <div className="panel wide-panel checklist-panel checklist-focus-panel">
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
      <div className="reviewer-notes-panel">
        <label className="form-label" htmlFor="reviewer-notes">Reviewer notes</label>
        <textarea
          id="reviewer-notes"
          className="form-textarea"
          value={workspace.notes}
          onChange={e => setWorkspace({ ...workspace, notes: e.target.value })}
          placeholder="Add launch decisions, open questions, owners, or blockers..."
        />
      </div>
    </div>
  );

  return (
    <div className="launch-workspace">
      <section className="launch-summary">
        <div>
          <p className="eyebrow">Campaign Checklist</p>
          <h2>{workspace.campaignName}</h2>
          <p>
            Start with campaign setup, then complete the launch checklist and document review decisions.
          </p>
        </div>
        <div className="launch-status-strip" aria-label="Launch status">
          <strong>{scores.overall}/100</strong>
          <span>{riskLabel}</span>
          <small>{checklistDone}/{checklist.length} checklist complete</small>
        </div>
      </section>

      <section className="launch-grid">
        <div className="panel campaign-setup-panel">
          <div className="campaign-setup-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h3>Campaign setup</h3>
            </div>
            <span className="setup-scope-badge">Active message</span>
          </div>
          <p className="setup-intro">Define the message being reviewed. For a multistage Canvas, load and audit each email, push, SMS, or IAM separately.</p>
          <div className="campaign-setup-grid">
            <div className="form-group">
              <label className="form-label">Campaign or Canvas name</label>
              <input className="form-input" value={workspace.campaignName} onChange={e => setWorkspace({ ...workspace, campaignName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Launch date</label>
              <input className="form-input" type="date" value={workspace.launchDate} onChange={e => setWorkspace({ ...workspace, launchDate: e.target.value })} />
            </div>
            <div className="form-group setup-field-full">
            <label className="form-label">Campaign type</label>
            <div className="campaign-type-select-row">
              <select className="form-select" value={workspace.campaignType} onChange={e => setWorkspace({ ...workspace, campaignType: e.target.value })}>
                {Object.entries(campaignTemplates).map(([key, template]) => (
                  <option key={key} value={key}>{template.label}</option>
                ))}
                {customTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
                <option value="custom">Custom / Manual Type</option>
              </select>
              {selectedCustomType && (
                <button className="btn btn-secondary compact-action" type="button" onClick={removeCampaignType}>
                  Remove
                </button>
              )}
            </div>
            <div className="campaign-type-add-row">
              <input
                className="form-input"
                value={newCampaignType}
                onChange={e => setNewCampaignType(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCampaignType();
                  }
                }}
                placeholder="Add a campaign type"
              />
              <button className="btn btn-secondary compact-action" type="button" onClick={addCampaignType}>Add Type</button>
            </div>
            </div>
            {workspace.campaignType === 'custom' && (
              <div className="form-group setup-field-full">
                <label className="form-label">Manual campaign type</label>
                <input className="form-input" value={workspace.customCampaignType} onChange={e => setWorkspace({ ...workspace, customCampaignType: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Audience / segment</label>
              <textarea className="form-textarea setup-textarea" value={workspace.audience} onChange={e => setWorkspace({ ...workspace, audience: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Offer / journey logic</label>
              <textarea className="form-textarea setup-textarea" value={workspace.offerLogic} onChange={e => setWorkspace({ ...workspace, offerLogic: e.target.value })} />
            </div>
            <div className="form-group setup-field-full">
              <label className="form-label">Required data and variables</label>
              <input className="form-input" value={workspace.expectedVariables} onChange={e => setWorkspace({ ...workspace, expectedVariables: e.target.value })} />
            </div>
          </div>
          <div className="campaign-setup-actions">
            <div className="setup-action-note">Template copy replaces the active message fields. Run QA when the message is ready for review.</div>
            <div className="button-row">
              <button className="btn btn-primary" onClick={applyTemplate} disabled={!activeTemplate}>Load Campaign Template</button>
              <button className="btn btn-secondary" onClick={() => onRunAudit()}>Run QA</button>
            </div>
          </div>
        </div>
        {checklistPanel}
      </section>
    </div>
  );
}
