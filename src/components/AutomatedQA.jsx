import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { demoJourney } from '../data/demoJourney';
import { importBrazeJourney } from '../services/braze';
import { auditJourneyAutomatically, getChannelLabel } from '../utils/campaignAudit';

function formatStatus(status) {
  return {
    blocked: 'Blocked',
    'needs-review': 'Needs review',
    'ready-for-approval': 'Ready for approval'
  }[status] || 'Pending review';
}

export default function AutomatedQA({ onSelectMessage, onAuditChange, useMockMode }) {
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
    return auditJourneyAutomatically(journey);
  }, [journey]);
  const visibleFindings = audit.findings.filter((item) => severityFilter === 'all' || item.severity === severityFilter);
  const selectedMessage = audit.messages.find((message) => message.id === selectedMessageId) || audit.messages[0];

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

      const importedJourney = await importBrazeJourney({
        url: sourceInput.trim(),
        type: assetType,
        postLaunchDraftVersion
      });
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

  const showDashboard = useMockMode || (journey && journey.source === 'braze');

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
                <div><p className="eyebrow">{journey.source === 'braze' ? 'Imported from Braze' : 'Fictional demo source'}</p><h3>Imported messages</h3><small>This is the message list returned by the selected Campaign or Canvas. A real read-only key replaces the demo names and content with the available data from your Braze asset. Select one to open its detailed QA Review.</small></div>
                <span className="read-only-label"><ShieldCheck size={14} /> Read only</span>
              </div>
              <div className="journey-step-list">
                {journey.steps.map((step, stepIndex) => (
                  <div className="journey-step" key={step.id}>
                    <div className="journey-step-heading"><span>{String(stepIndex + 1).padStart(2, '0')}</span><div><strong>{step.name}</strong><small>{String(step.type || 'step').replace(/[_-]+/g, ' ')} · {step.messages.length ? `${step.messages.length} message${step.messages.length === 1 ? '' : 's'}` : 'logic or timing step; no message content'}</small></div></div>
                    <div className="journey-message-list">
                      {step.messages.map((message) => {
                        const count = audit.findings.filter((item) => item.messageId === message.id).length;
                        return (
                          <button type="button" key={message.id} className={`journey-message ${selectedMessage?.id === message.id ? 'active' : ''}`} onClick={() => selectMessage(message)}>
                            <span><b>{getChannelLabel(message.channel)}</b>{message.name}</span>
                            <span className={count ? 'message-finding-count has-findings' : 'message-finding-count'}>{count || 'Pass'} <ArrowRight size={14} /></span>
                          </button>
                        );
                      })}
                      {!step.messages.length && <p className="non-message-step">This step controls journey logic or timing and has no message body to audit.</p>}
                    </div>
                  </div>
                ))}
              </div>
              {selectedMessage && (
                <div className="selected-message-card">
                  <div><p className="eyebrow">Selected imported message</p><h4>{selectedMessage.name}</h4><p>{selectedMessage.subject || selectedMessage.title || selectedMessage.body.slice(0, 120)}</p></div>
                  <button type="button" className="btn btn-secondary compact-action" onClick={() => selectMessage(selectedMessage, true)}>Open detailed QA Review <ExternalLink size={14} /></button>
                </div>
              )}
            </div>

            <div className="panel findings-panel">
              <div className="panel-topline">
                <div><p className="eyebrow">Automated findings</p><h3>Evidence and actions</h3></div>
                <button className="btn btn-secondary compact-action" type="button" onClick={() => setJourney({ ...journey })}><RefreshCw size={14} /> Re-run</button>
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
