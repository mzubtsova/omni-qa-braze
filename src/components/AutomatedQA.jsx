import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { demoJourney } from '../data/demoJourney';
import { importBrazeJourney } from '../services/braze';
import { auditJourneyAutomatically, getChannelLabel, normalizeBrazePayload } from '../utils/campaignAudit';

function formatStatus(status) {
  return {
    blocked: 'Blocked',
    'needs-review': 'Needs review',
    'ready-for-approval': 'Ready for approval'
  }[status] || 'Pending review';
}

export default function AutomatedQA({ onSelectMessage, onAuditChange, useMockMode, figmaTexts = [], unifiedQAMode, setUnifiedQAMode }) {
  const [journey, setJourney] = useState(null);
  const [sourceInput, setSourceInput] = useState('');
  const [assetType, setAssetType] = useState('canvas');
  const [postLaunchDraftVersion, setPostLaunchDraftVersion] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [funnyComment, setFunnyComment] = useState('');
  const [importError, setImportError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [findingNotes, setFindingNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('omniqa_finding_notes') || '{}'); } catch { return {}; }
  });
  const [isReauditing, setIsReauditing] = useState(false);
  const [reauditingComment, setReauditingComment] = useState('Auditing...');

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
    return auditJourneyAutomatically(journey, figmaTexts);
  }, [journey, figmaTexts]);

  const selectedMessage = useMemo(() => {
    return audit.messages.find((message) => message.id === selectedMessageId) || audit.messages[0] || null;
  }, [audit.messages, selectedMessageId]);

  useEffect(() => {
    if (selectedMessage && selectedMessage.id !== selectedMessageId) {
      setSelectedMessageId(selectedMessage.id);
    }
  }, [selectedMessage, selectedMessageId]);

  useEffect(() => {
    if (selectedMessage) {
      onSelectMessage?.(selectedMessage, false);
    }
  }, [selectedMessage, onSelectMessage]);

  const visibleFindings = useMemo(() => {
    return audit.findings.filter((item) => {
      const matchesMessage = !selectedMessageId || item.messageId === selectedMessageId || item.scope === 'journey';
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      return matchesMessage && matchesSeverity;
    });
  }, [audit.findings, selectedMessageId, severityFilter]);

  useEffect(() => {
    onAuditChange?.({ journey, audit });
  }, [journey, audit, onAuditChange]);

  useEffect(() => {
    localStorage.setItem('omniqa_finding_notes', JSON.stringify(findingNotes));
  }, [findingNotes]);

  const loadDemo = () => {
    setJourney(demoJourney);
    setImportError('');
    setSelectedMessageId('');
  };

  const importFromBraze = async (event) => {
    event.preventDefault();
    if (!sourceInput.trim()) {
      setImportError('Enter a Braze Campaign or Canvas URL/ID.');
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
      setSelectedMessageId('');
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
          <button className="btn btn-secondary compact-action" type="button" onClick={loadDemo}>Load fictional demo</button>
        </div>
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
        {importError && <p className="automation-error" role="alert"><AlertCircle size={16} />{importError}</p>}
      </section>

      {showDashboard && (
        <>
          <section className="automation-summary">
            <article className="automation-score panel">
              <span className={`readiness-pill ${audit.status}`}>{formatStatus(audit.status)}</span>
              <strong>{audit.score}</strong>
              <small>Automated QA score</small>
            </article>
            <article className="automation-metrics panel">
              <div><strong>{audit.stepCount}</strong><span>Steps</span></div>
              <div><strong>{audit.messageCount}</strong><span>Messages</span></div>
              <div><strong>{audit.channelCount}</strong><span>Channels</span></div>
              <div><strong>{audit.findings.length}</strong><span>Findings</span></div>
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
                      const msg = audit.messages.find(m => m.id === msgId);
                      if (msg) {
                        selectMessage(msg);
                      }
                    }}
                    style={{ fontSize: '0.95rem', padding: '0.8rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                  >
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

              {selectedMessage && (
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
              )}
            </div>

            <div className="panel findings-panel">
              <div className="panel-topline">
                <div><p className="eyebrow">Automated findings</p><h3>Evidence and actions</h3></div>
                <button 
                  className="btn btn-secondary compact-action" 
                  type="button" 
                  onClick={handleReRun}
                  disabled={isReauditing || isImporting}
                >
                  <RefreshCw size={14} className={isReauditing ? 'spin' : ''} /> {isReauditing ? reauditingComment : 'Re-run'}
                </button>
              </div>
              <div className="severity-filters" aria-label="Finding severity filters">
                {['all', 'blocker', 'high', 'medium', 'low'].map((severity) => (
                  <button key={severity} type="button" className={severityFilter === severity ? 'active' : ''} onClick={() => setSeverityFilter(severity)}>
                    {severity === 'all' ? `All ${audit.findings.length}` : `${severity} ${audit.counts[severity] || 0}`}
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
