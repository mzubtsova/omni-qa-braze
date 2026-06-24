import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  RefreshCw,
  ShieldCheck,
  Save
} from 'lucide-react';
import { demoJourneys } from '../data/demoJourney';
import { importBrazeJourney } from '../services/braze';
import { auditJourneyAutomatically, getChannelLabel, normalizeBrazePayload } from '../utils/campaignAudit';

function formatStatus(status) {
  return {
    blocked: 'Blocked',
    'needs-review': 'Needs review',
    'ready-for-approval': 'Ready for approval'
  }[status] || 'Pending review';
}

export default function AutomatedQA({ onSelectMessage, onAuditChange, useMockMode, figmaTexts = [], unifiedQAMode, setUnifiedQAMode, onQuickSave, automationState }) {
  const [journey, setJourney] = useState(() => automationState?.journey || null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [sourceInput, setSourceInput] = useState('');
  const [assetType, setAssetType] = useState('canvas');
  const [postLaunchDraftVersion, setPostLaunchDraftVersion] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [funnyComment, setFunnyComment] = useState('');
  const [importError, setImportError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedMessageId, setSelectedMessageId] = useState('all');
  const [findingNotes, setFindingNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('omniqa_finding_notes') || '{}'); } catch { return {}; }
  });
  const [isReauditing, setIsReauditing] = useState(false);
  const [reauditingComment, setReauditingComment] = useState('Auditing...');

  useEffect(() => {
    if (automationState?.journey) {
      setJourney(automationState.journey);
    } else {
      setJourney(null);
    }
  }, [automationState?.journey]);

  useEffect(() => {
    setSelectedMessageId('all');
  }, [journey?.id]);

  const handleReRun = async () => {
    setIsReauditing(true);
    const comments = [
      "🔍 Re-checking active URLs...",
      "⚡ Analyzing liquid tags...",
      "🤖 Reviewing contrast ratios...",
      "🛡️ Verifying UTM configuration...",
      "📝 Comparing text copy..."
    ];
    setReauditingComment(comments[Math.floor(Math.random() * comments.length)]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReauditingComment(comments[Math.floor(Math.random() * comments.length)]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setJourney({ ...journey });
    setIsReauditing(false);
  };

  const audit = useMemo(() => {
    if (!journey) {
      if (automationState?.audit) {
        return automationState.audit;
      }
      return {
        status: 'pending',
        score: 100,
        stepCount: 0,
        messageCount: 0,
        channelCount: 0,
        findings: [],
        messages: [],
        counts: { blocker: 0, high: 0, medium: 0, low: 0 }
      };
    }
    // If restoring from library and journey steps are empty, use saved audit to prevent blanking
    if (journey.source === 'library' && automationState?.audit && (!journey.steps || journey.steps.length === 0)) {
      return automationState.audit;
    }
    return auditJourneyAutomatically(journey, figmaTexts);
  }, [journey, figmaTexts, automationState]);

  const currentAudit = useMemo(() => {
    if (selectedMessageId === 'all') {
      return audit;
    }
    
    // Calculate message-specific score and counts
    const filteredFindings = audit.findings.filter(item => item.messageId === selectedMessageId || item.scope === 'journey');
    const counts = filteredFindings.reduce((acc, item) => ({ ...acc, [item.severity]: (acc[item.severity] || 0) + 1 }), { blocker: 0, high: 0, medium: 0, low: 0 });
    const severityWeight = { blocker: 24, high: 14, medium: 7, low: 3 };
    const totalDeduction = filteredFindings.reduce((sum, item) => sum + (severityWeight[item.severity] || 0), 0);
    const score = Math.max(0, 100 - totalDeduction);
    const status = counts.blocker > 0 ? 'blocked' : counts.high > 0 ? 'needs-review' : 'ready-for-approval';
    
    return {
      ...audit,
      score,
      status,
      counts,
      findings: filteredFindings
    };
  }, [audit, selectedMessageId]);

  const selectedMessage = useMemo(() => {
    if (selectedMessageId === 'all') return null;
    return audit.messages.find((message) => message.id === selectedMessageId) || null;
  }, [audit.messages, selectedMessageId]);

  useEffect(() => {
    if (selectedMessageId === 'all') return;
    if (!selectedMessage && audit.messages.length > 0) {
      setSelectedMessageId('all');
    }
  }, [selectedMessage, selectedMessageId, audit.messages]);

  useEffect(() => {
    if (selectedMessage) {
      onSelectMessage?.(selectedMessage, false);
    }
  }, [selectedMessage, onSelectMessage]);

  const visibleFindings = useMemo(() => {
    return currentAudit.findings.filter((item) => {
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      return matchesSeverity;
    });
  }, [currentAudit.findings, severityFilter]);

  useEffect(() => {
    onAuditChange?.({ journey, audit });
  }, [journey, audit, onAuditChange]);

  useEffect(() => {
    localStorage.setItem('omniqa_finding_notes', JSON.stringify(findingNotes));
  }, [findingNotes]);

  useEffect(() => {
    if (journey && (journey.source === 'sandbox' || journey.id?.startsWith('demo-'))) {
      setSourceInput('');
    }
  }, [journey]);

  const loadSelectedDemo = (demo) => {
    setJourney(demo);
    setSourceInput('');
    setImportError('');
    setSelectedMessageId('all');
    setShowDemoSelector(false);
  };

  const importFromBraze = async (event) => {
    event.preventDefault();
    const trimmedInput = sourceInput.trim();
    if (!trimmedInput) {
      setImportError('Enter a Braze Campaign or Canvas URL/ID.');
      return;
    }

    // Helper to validate Braze URL or API ID
    const isValidBrazeInput = (input) => {
      const trimmed = input.trim();
      if (!trimmed) return false;
      
      // Check if it's a URL
      const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('/') || trimmed.includes('.');
      if (isUrl) {
        const lower = trimmed.toLowerCase();
        return lower.includes('braze') || lower.includes('dashboard') || lower.includes('campaign') || lower.includes('canvas');
      }
      
      // Check if it's a 24-char hex Campaign ID or a 36-char UUID Canvas ID
      const campaignIdRegex = /^[a-fA-F0-9]{24}$/;
      const canvasIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      return campaignIdRegex.test(trimmed) || canvasIdRegex.test(trimmed);
    };

    if (!isValidBrazeInput(trimmedInput)) {
      const funnyErrors = [
        "Oops! That doesn't look like a Braze URL or API ID. Did your cat walk across the keyboard? 🐾 Double-check your clipboard!",
        "Wait a second... that's not a Braze ID! Did you copy the link to your favorite recipe by mistake? 🍳 Check your link and try again!",
        "Oops! That link is about as valid as a unicorn's driver's license. 🦄 Please paste a proper Braze Campaign/Canvas URL or API ID!",
        "Uh-oh! Our detectors say this isn't a Braze URL or API ID. Are you trying to hack us with space-dust? 🌌 Double-check your input!"
      ];
      setImportError(funnyErrors[Math.floor(Math.random() * funnyErrors.length)]);
      setJourney(null); // Clear the current campaign so we "dont show anything"
      return;
    }

    setIsImporting(true);
    setImportError('');
    
    const loadingComments = [
      "🕵️‍♂️ Intercepting secret Braze transmissions...",
      "⚡ Scanning for broken Liquid brackets...",
      "🛸 beam_me_up_braze.sh in progress...",
      "🤖 Consulting with Gemini copyeditor...",
      "🍕 Feeding the servers to speed up verification...",
      "🎩 Performing digital card tricks with your API calls..."
    ];

    try {
      // First comment delay
      setFunnyComment(loadingComments[Math.floor(Math.random() * loadingComments.length)]);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Second comment delay
      setFunnyComment(loadingComments[Math.floor(Math.random() * loadingComments.length)]);
      await new Promise(resolve => setTimeout(resolve, 1200));

      let importedJourney;
      if (useMockMode) {
        const lowerId = sourceInput.trim().toLowerCase();
        let mockPayload;
        
        if (lowerId.includes('spring') || lowerId.includes('sale')) {
          mockPayload = {
            id: 'spring-sale',
            type: 'campaign',
            name: `Simulated Spring Sale Campaign (${sourceInput})`,
            draft: false,
            enabled: true,
            conversion_behaviors: [{ type: "Purchase", window: 86400 }],
            source: 'braze',
            messages: [{
              id: 'msg-spring-sale',
              channel: 'email',
              name: 'Spring Sale Email Variant',
              subject: '🌸 Spring Sale: Get 20% off today!',
              preheader: 'Shop our exclusive spring collection now.',
              body: '<p>Use coupon code SPRING20 at checkout.</p><a href="https://brand.com/spring-sale?utm_source=braze">Shop Now</a>',
              from: 'newsletter@brand.com'
            }]
          };
        } else if (lowerId.includes('ab-test') || lowerId.includes('notification')) {
          mockPayload = {
            id: 'ab-test',
            type: 'campaign',
            name: `Simulated A/B Test Campaign (${sourceInput})`,
            draft: true,
            enabled: false,
            conversion_behaviors: [],
            source: 'braze',
            messages: [{
              id: 'msg-ab-test',
              channel: 'email',
              name: 'Welcome Variant A',
              subject: '',
              preheader: 'Come back and see us!',
              body: '<p>We miss you! Here is a coupon.</p><a href="http://staging.brand.com/claim-rewards">Claim Rewards</a>',
              from: ''
            }]
          };
        } else if (lowerId.includes('welcome') || lowerId.includes('canvas') || assetType === 'canvas') {
          mockPayload = {
            id: 'onboarding-canvas',
            type: 'canvas',
            name: `Simulated Onboarding Canvas (${sourceInput})`,
            draft: true,
            enabled: false,
            conversion_behaviors: [],
            source: 'braze',
            steps: [
              {
                id: 'step-1',
                name: 'Onboarding Welcome Email',
                type: 'email',
                messages: [{
                  id: 'msg-welcome-email',
                  channel: 'email',
                  name: 'Welcome Email',
                  subject: 'Welcome to our application!',
                  preheader: 'Start your journey today.',
                  body: '<p>Thanks for signing up!</p><a href="https://brand.com/onboarding?utm_source=braze">Get Started</a>',
                  from: 'support@brand.com'
                }]
              },
              {
                id: 'step-2',
                name: 'Follow-up Push Warning',
                type: 'push',
                messages: [{
                  id: 'msg-followup-push',
                  channel: 'push',
                  name: 'Push Variant',
                  title: 'Quick reminder!',
                  body: 'This is an extremely long push notification body that is going to exceed the standard recommended limit of 178 characters to make sure the platform truncation audit warns the marketer before sending it out to devices.',
                  from: ''
                }]
              }
            ]
          };
        } else {
          mockPayload = {
            id: 'default-mock',
            type: 'campaign',
            name: `Simulated Live Campaign (${sourceInput})`,
            draft: true,
            enabled: false,
            conversion_behaviors: [],
            source: 'braze',
            messages: [{
              id: 'msg-default',
              channel: 'email',
              name: 'Campaign Email Variant',
              subject: 'Your offer has arrived!',
              body: '<p>Live import simulation successfully loaded from the serverless backend.</p><a href="https://brand.com/claim?utm_source=braze">Claim Offer</a>',
              from: 'offers@brand.com'
            }]
          };
        }
        importedJourney = normalizeBrazePayload(mockPayload, { id: sourceInput.trim(), type: assetType, source: 'braze' });
      } else {
        importedJourney = await importBrazeJourney({
          url: sourceInput.trim(),
          type: assetType,
          postLaunchDraftVersion
        });
      }
      setJourney(importedJourney);
      setSelectedMessageId('all');
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      setFunnyComment('');
    }
  };

  const selectMessage = (message, openReview = false) => {
    setSelectedMessageId(message.id);
    onSelectMessage?.(message, openReview);
  };

  const showDashboard = journey !== null;

  return (
    <div className="automated-qa fade-in">
      <section className="automation-hero">
        <div>
          <h2>Import once. Review the full journey.</h2>
          <p>Connect an approved Braze asset or use fictional demo data, then run consistent checks across every available message.</p>
        </div>
        <div className="safety-lockup"><ShieldCheck size={19} /><span>Read-only import</span></div>
      </section>

      <section className="automation-import panel">
        <div className="panel-topline">
          <div>
            <p className="eyebrow">Source</p>
            <h3>Braze Campaign or Canvas</h3>
          </div>
          {!sourceInput.trim() && (
            <button className="btn btn-secondary compact-action" type="button" onClick={() => setShowDemoSelector(true)}>Load fictional demo</button>
          )}
        </div>
        {showDemoSelector && (
          <div className="demo-selector-container" style={{
            marginTop: '0.75rem',
            marginBottom: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Select a fictional project to load:</h4>
              <button 
                type="button" 
                className="btn btn-secondary compact-action" 
                onClick={() => setShowDemoSelector(false)} 
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                Close
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {demoJourneys.map(demo => (
                <div 
                  key={demo.id} 
                  onClick={() => loadSelectedDemo(demo)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {demo.type === 'canvas' ? '🔮 Canvas' : '✉️ Campaign'}
                    </span>
                    <h5 style={{ margin: '0.25rem 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{demo.name}</h5>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{demo.description}</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: '600', alignSelf: 'flex-end', marginTop: '0.5rem' }}>Load project →</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {importError && (
          <div 
            className="automation-error" 
            role="alert" 
            style={{ 
              marginTop: '0.75rem', 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.12)', 
              border: '1.5px solid var(--error)', 
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--error)', 
              fontWeight: '600', 
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{importError}</span>
          </div>
        )}
        <form className="automation-import-form" onSubmit={importFromBraze}>
          <div className="form-group automation-source-field">
            <label className="form-label" htmlFor="braze-source">Braze URL or API identifier</label>
            <input id="braze-source" className="form-input" value={sourceInput} onChange={(event) => setSourceInput(event.target.value)} placeholder="Paste a Campaign or Canvas URL" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="asset-type">Asset type</label>
            <select id="asset-type" className="form-select" value={assetType} onChange={(event) => setAssetType(event.target.value)}>
              <option value="canvas">Canvas</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>
          <button className="btn btn-primary automation-import-button" disabled={isImporting || !sourceInput.trim()}>
            {isImporting ? <><RefreshCw size={16} className="spin" /> {funnyComment || 'Importing...'}</> : <><FileSearch size={16} /> Import and run QA</>}
          </button>
          <label className="automation-checkbox">
            <input type="checkbox" checked={postLaunchDraftVersion} onChange={(event) => setPostLaunchDraftVersion(event.target.checked)} />
            Include the post-launch draft when available
          </label>
          <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <label className="automation-checkbox" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={unifiedQAMode} onChange={(event) => setUnifiedQAMode(event.target.checked)} />
              <span>Unified Campaign QA Mode (Bypass Separate Message & Technical QA tabs)</span>
            </label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '0.25rem 0 0 1.35rem', lineHeight: '1.4' }}>
              When enabled, Automated QA performs all link, alt text, accessibility, copy mismatch, and spam checks directly in the dropdown message selector below, simplifying QA Review to approvals and checklists.
            </p>
          </div>
        </form>
        {useMockMode && <p className="automation-callout"><b>Demo mode:</b> the current asset is fictional sample data stored in the browser. It does not call Braze. Disable Sandbox Simulation in Settings after the read-only Braze variables are configured.</p>}
      </section>

      {showDashboard && (
        <>
          <section className="automation-summary">
            <article className="automation-score panel">
              <span className={`readiness-pill ${currentAudit.status}`}>{formatStatus(currentAudit.status)}</span>
              <strong>{currentAudit.score}</strong>
              <small>Automated QA score</small>
            </article>
            <article className="automation-metrics panel">
              <div><strong>{selectedMessageId === 'all' ? audit.stepCount : 1}</strong><span>Steps</span></div>
              <div><strong>{selectedMessageId === 'all' ? audit.messageCount : 1}</strong><span>Messages</span></div>
              <div><strong>{selectedMessageId === 'all' ? audit.channelCount : 1}</strong><span>Channels</span></div>
              <div><strong>{currentAudit.findings.length}</strong><span>Findings</span></div>
            </article>
            <article className="automation-source-summary panel">
              <p className="eyebrow">Current asset</p>
              <h3>{journey.name}</h3>
              <p>{journey.source === 'braze' ? 'Imported read-only from Braze' : 'Fictional browser demo'} · {journey.type}</p>
              <span>{journey.draft ? 'Draft' : journey.enabled ? 'Enabled' : 'Not enabled'}</span>
            </article>
          </section>

          <section className="automation-workspace">
            <div className="panel journey-map-panel">
              <div className="panel-topline">
                <div><p className="eyebrow">{journey.source === 'braze' ? 'Imported from Braze' : 'Fictional demo source'}</p><h3>Message Variant Selector</h3><small>Choose a campaign message variant from the dropdown to review its full copy mismatch, link, accessibility, and deliverability findings.</small></div>
                <span className="read-only-label"><ShieldCheck size={14} /> Read only</span>
              </div>
              
              {audit.messages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <label className="form-label" htmlFor="message-select" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Selected Message Variant</label>
                  <select
                    id="message-select"
                    className="form-select"
                    value={selectedMessageId}
                    onChange={(e) => {
                      const msgId = e.target.value;
                      setSelectedMessageId(msgId);
                      if (msgId === 'all') {
                        onSelectMessage?.(null, false);
                      } else {
                        const msg = audit.messages.find(m => m.id === msgId);
                        if (msg) {
                          selectMessage(msg);
                        }
                      }
                    }}
                    style={{ fontSize: '0.95rem', padding: '0.8rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                  >
                    <option value="all">Show All Steps / Message Variants</option>
                    {audit.messages.map((msg) => (
                      <option key={msg.id} value={msg.id}>
                        {msg.stepName ? (msg.stepName === msg.name ? msg.stepName : `${msg.stepName} (${msg.name})`) : msg.name} ({getChannelLabel(msg.channel)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="non-message-step" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No message variants found in this campaign asset.
                </p>
              )}

              {selectedMessageId === 'all' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  {audit.messages.map((msg) => (
                    <div key={msg.id} className="selected-message-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <span className="eyebrow" style={{ fontSize: '0.7rem' }}>{getChannelLabel(msg.channel)} Configuration</span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', marginBottom: '0.5rem' }}>{msg.name}</h4>
                        
                        {msg.subject && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                            <strong>Subject:</strong> &quot;{msg.subject}&quot;
                          </div>
                        )}
                        {msg.preheader && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                            <strong>Preheader:</strong> &quot;{msg.preheader}&quot;
                          </div>
                        )}
                        {msg.from && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                            <strong>From:</strong> {msg.from}
                          </div>
                        )}
                        {msg.actionUrl && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            <strong>CTA Link:</strong> <span style={{ color: 'var(--accent-blue)' }}>{msg.actionUrl}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                        <strong>Coded Body Text Preview:</strong>
                        <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          {(msg.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 250)}
                          {(msg.body || '').replace(/<[^>]*>/g, ' ').length > 250 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedMessage ? (
                <div className="selected-message-card" style={{ marginTop: '1.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span className="eyebrow" style={{ fontSize: '0.7rem' }}>{getChannelLabel(selectedMessage.channel)} Configuration</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem', marginBottom: '0.5rem' }}>{selectedMessage.name}</h4>
                    
                    {selectedMessage.subject && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        <strong>Subject:</strong> &quot;{selectedMessage.subject}&quot;
                      </div>
                    )}
                    {selectedMessage.preheader && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        <strong>Preheader:</strong> &quot;{selectedMessage.preheader}&quot;
                      </div>
                    )}
                    {selectedMessage.from && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        <strong>From:</strong> {selectedMessage.from}
                      </div>
                    )}
                    {selectedMessage.actionUrl && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                        <strong>CTA Link:</strong> <span style={{ color: 'var(--accent-blue)' }}>{selectedMessage.actionUrl}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <strong>Coded Body Text Preview:</strong>
                    <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                      {(selectedMessage.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 250)}
                      {(selectedMessage.body || '').replace(/<[^>]*>/g, ' ').length > 250 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="panel findings-panel">
              <div className="panel-topline">
                <div><p className="eyebrow">Automated findings</p><h3>Evidence and actions</h3></div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    className="btn btn-secondary compact-action" 
                    type="button" 
                    onClick={handleReRun}
                    disabled={isReauditing || isImporting}
                  >
                    <RefreshCw size={14} className={isReauditing ? 'spin' : ''} /> {isReauditing ? reauditingComment : 'Re-run'}
                  </button>
                  {journey && (
                    <button 
                      className="btn btn-secondary compact-action" 
                      type="button" 
                      onClick={onQuickSave}
                      style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Save active workspace editor content & QA status to Library"
                    >
                      <Save size={14} /> Save QA
                    </button>
                  )}
                </div>
              </div>
              <div className="severity-filters" aria-label="Finding severity filters">
                {['all', 'blocker', 'high', 'medium', 'low'].map((severity) => (
                  <button key={severity} type="button" className={severityFilter === severity ? 'active' : ''} onClick={() => setSeverityFilter(severity)}>
                    {severity === 'all' ? `All ${currentAudit.findings.length}` : `${severity} ${currentAudit.counts[severity] || 0}`}
                  </button>
                ))}
              </div>
              <div className="finding-list">
                {visibleFindings.length === 0 && <div className="empty-findings"><CheckCircle2 size={22} />No findings in this filter.</div>}
                {visibleFindings.map((item) => (
                  <article className="finding-card" key={item.id}>
                    <div className="finding-heading"><span className={`severity-label ${item.severity}`}>{item.severity}</span><div><strong>{item.title}</strong><small>{item.category} · {item.scope}</small></div></div>
                    <p><b>Evidence:</b> {item.evidence}</p>
                    <p><b>Required action:</b> {item.remediation}</p>
                    <textarea className="form-textarea finding-note" value={findingNotes[item.id] || ''} onChange={(event) => setFindingNotes({ ...findingNotes, [item.id]: event.target.value })} placeholder="Reviewer note, owner, or exception rationale" />
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
