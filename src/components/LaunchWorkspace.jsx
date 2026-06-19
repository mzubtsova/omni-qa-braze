import { useEffect, useMemo, useState } from 'react';
import {
  auditHtmlLinks,
  auditImages,
  checkWcagContrast,
  validateLiquidSyntax
} from '../utils/validators';

const STORAGE_KEY = 'omniqa_launch_workspace';
const HISTORY_KEY = 'omniqa_qa_history';

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

function summarizeIssues({ brazeHtml, subjectLine, pushBody, smsBody, iamHeader, iamBody, iamButtonLink }) {
  const liquidIssues = [
    ...validateLiquidSyntax(brazeHtml),
    ...validateLiquidSyntax(subjectLine),
    ...validateLiquidSyntax(pushBody),
    ...validateLiquidSyntax(smsBody),
    ...validateLiquidSyntax(iamHeader),
    ...validateLiquidSyntax(iamBody)
  ];
  const linkIssues = auditHtmlLinks(brazeHtml);
  const contrastIssues = checkWcagContrast(brazeHtml);
  const imageIssues = auditImages(brazeHtml);

  if (iamButtonLink && iamButtonLink.startsWith('http') && !iamButtonLink.includes('utm_')) {
    linkIssues.push({
      severity: 'low',
      item: 'IAM button',
      message: 'IAM button link is missing UTM parameters.'
    });
  }

  return {
    liquidIssues,
    linkIssues,
    contrastIssues,
    imageIssues,
    total: liquidIssues.length + linkIssues.length + contrastIssues.length + imageIssues.length
  };
}

export default function LaunchWorkspace({
  campaignState,
  setCampaignState,
  scores,
  issuesCount,
  copyAuditResults,
  spamAuditResults,
  predictionResults,
  onRunAudit
}) {
  const [workspace, setWorkspace] = useState(() => loadJson(STORAGE_KEY, {
    campaignName: 'New CRM Campaign QA',
    campaignType: 'promo',
    launchDate: '',
    audience: 'Eligible loyalty audience',
    offerLogic: 'Send personalized content based on user attributes and channel eligibility.',
    expectedVariables: 'user.first_name, favorite_category, points_balance',
    notes: ''
  }));
  const [activeProfileKey, setActiveProfileKey] = useState('loyalFood');
  const [history, setHistory] = useState(() => loadJson(HISTORY_KEY, []));
  const [checklist, setChecklist] = useState(() => campaignTemplates[workspace.campaignType]?.checklist || []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const issueSummary = useMemo(
    () => summarizeIssues(campaignState),
    [campaignState]
  );

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

  const riskLabel = scores.overall >= 90 ? 'Launch ready' : scores.overall >= 75 ? 'Needs light review' : 'Needs fixes before launch';
  const reportFindings = [
    issueSummary.liquidIssues.length ? `${issueSummary.liquidIssues.length} Liquid or variable syntax item(s) need review.` : 'Liquid syntax is clean across major channel copy.',
    issueSummary.linkIssues.length ? `${issueSummary.linkIssues.length} link or UTM item(s) need cleanup.` : 'Links and UTMs have no blocking issues in the current scan.',
    spamAuditResults?.spamTriggers?.length ? `${spamAuditResults.spamTriggers.length} deliverability phrase(s) are flagged.` : 'No major deliverability language risks are active.',
    copyAuditResults?.mismatches?.length ? `${copyAuditResults.mismatches.length} creative-to-code alignment item(s) are active.` : 'Creative and coded copy alignment is clear in the current report.'
  ];

  const applyTemplate = () => {
    const template = campaignTemplates[workspace.campaignType];
    setCampaignState({
      subjectLine: template.subjectLine,
      pushBody: template.pushBody,
      smsBody: template.smsBody,
      iamHeader: template.iamHeader,
      iamBody: template.iamBody,
      iamButtonText: template.iamButtonText,
      iamButtonLink: template.iamButtonLink
    });
    setChecklist(template.checklist);
  };

  const saveQaRun = () => {
    const entry = {
      id: crypto.randomUUID(),
      name: workspace.campaignName || 'Untitled campaign',
      type: campaignTemplates[workspace.campaignType].label,
      date: new Date().toISOString(),
      status: riskLabel,
      score: scores.overall,
      issues: issueSummary.total,
      notes: workspace.notes
    };
    setHistory(prev => [entry, ...prev].slice(0, 12));
  };

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="launch-workspace">
      <section className="panel launch-hero">
        <div>
          <p className="eyebrow">Campaign Intake</p>
          <h2>{workspace.campaignName}</h2>
          <p>
            Build a structured QA packet from campaign context, templates, Liquid variables,
            link checks, launch risk, and saved review history.
          </p>
        </div>
        <div className="launch-score-card">
          <span>{scores.overall}</span>
          <strong>{riskLabel}</strong>
          <small>{issuesCount.high} high / {issuesCount.medium} medium / {issuesCount.low} low</small>
        </div>
      </section>

      <section className="launch-grid">
        <div className="panel">
          <h3>1. Intake</h3>
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
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Launch date</label>
            <input className="form-input" type="date" value={workspace.launchDate} onChange={e => setWorkspace({ ...workspace, launchDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Audience / segment</label>
            <textarea className="form-textarea" value={workspace.audience} onChange={e => setWorkspace({ ...workspace, audience: e.target.value })} />
          </div>
        </div>

        <div className="panel">
          <h3>2. Template Checklist</h3>
          <p className="muted-copy">{campaignTemplates[workspace.campaignType].channelPlan}</p>
          <button className="btn btn-primary" onClick={applyTemplate}>Apply Template Copy</button>
          <div className="qa-checklist">
            {checklist.map((item, index) => (
              <label key={item} className="qa-check">
                <input type="checkbox" />
                <span>{index + 1}. {item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>3. Offer Logic</h3>
          <div className="form-group">
            <label className="form-label">Offer / journey logic</label>
            <textarea className="form-textarea" value={workspace.offerLogic} onChange={e => setWorkspace({ ...workspace, offerLogic: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Expected variables</label>
            <input className="form-input" value={workspace.expectedVariables} onChange={e => setWorkspace({ ...workspace, expectedVariables: e.target.value })} />
          </div>
          <button className="btn btn-secondary" onClick={() => onRunAudit()}>Run Full QA</button>
        </div>

        <div className="panel">
          <h3>4. Link & UTM Scan</h3>
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

        <div className="panel wide-panel">
          <h3>5. Liquid Simulator</h3>
          <div className="profile-tabs">
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

        <div className="panel wide-panel">
          <h3>6. Launch Readiness Report</h3>
          <div className="report-grid">
            <div>
              <p className="report-status">{riskLabel}</p>
              <p className="muted-copy">Forecast: {predictionResults?.summary || 'Run QA to refresh engagement forecast.'}</p>
            </div>
            <ul>
              {reportFindings.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="form-group">
            <label className="form-label">Reviewer notes</label>
            <textarea className="form-textarea" value={workspace.notes} onChange={e => setWorkspace({ ...workspace, notes: e.target.value })} />
          </div>
          <div className="button-row">
            <button className="btn btn-primary" onClick={saveQaRun}>Save QA Run</button>
            <button className="btn btn-secondary" onClick={exportReport}>Export / Print Report</button>
          </div>
        </div>

        <div className="panel wide-panel">
          <h3>7. QA History</h3>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="muted-copy">No saved QA runs yet. Save a run to start building your campaign review history.</p>
            ) : history.map(entry => (
              <div className="history-row" key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>{entry.type} • {new Date(entry.date).toLocaleString()}</span>
                </div>
                <div>
                  <strong>{entry.score}/100</strong>
                  <span>{entry.status} • {entry.issues} issue(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
