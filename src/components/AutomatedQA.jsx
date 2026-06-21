import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileSearch,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { demoJourney } from '../data/demoJourney';
import { importBrazeJourney } from '../services/braze';
import { auditJourneyAutomatically, canApproveAudit, getChannelLabel } from '../utils/campaignAudit';

const approvalChecks = [
  ['audience', 'Audience, exclusions, entry criteria, and schedule were verified in Braze.'],
  ['content', 'Every message variant, link, sender, and destination was reviewed.'],
  ['personalization', 'Liquid variables, fallback values, and channel eligibility were tested.'],
  ['evidence', 'Test-send evidence and required stakeholder approvals are documented.']
];

function loadStoredApproval() {
  try {
    return JSON.parse(localStorage.getItem('omniqa_approval') || 'null');
  } catch {
    return null;
  }
}

const emptyApproval = {
  reviewer: '',
  checks: { audience: false, content: false, personalization: false, evidence: false },
  confirmHumanReview: false,
  decisionNote: '',
  status: 'pending',
  approvedAt: ''
};

function formatStatus(status) {
  return {
    blocked: 'Blocked',
    'needs-review': 'Needs review',
    'ready-for-approval': 'Ready for approval',
    approved: 'Approved by reviewer'
  }[status] || 'Pending review';
}

function createReportText(journey, audit, approval) {
  const findings = audit.findings.map((item) =>
    `[${item.severity.toUpperCase()}] ${item.title}\nEvidence: ${item.evidence}\nAction: ${item.remediation}`
  ).join('\n\n');
  return `OMNIQA PRE-DEPLOYMENT QA REPORT

Campaign: ${journey.name}
Type: ${journey.type}
Generated: ${new Date(audit.generatedAt).toLocaleString()}
Status: ${formatStatus(approval.status === 'approved' ? 'approved' : audit.status)}
Score: ${audit.score}/100
Steps: ${audit.stepCount}
Messages: ${audit.messageCount}
Channels: ${audit.channelCount}

Blockers: ${audit.counts.blocker}
High: ${audit.counts.high}
Medium: ${audit.counts.medium}
Low: ${audit.counts.low}

Reviewer: ${approval.reviewer || 'Not assigned'}
Decision note: ${approval.decisionNote || 'None'}

FINDINGS
${findings || 'No automated findings.'}

SAFETY BOUNDARY
This report does not deploy, activate, or modify the Braze asset. Deployment remains a human-controlled action in Braze.`;
}

export default function AutomatedQA({ onSelectMessage, onAuditChange, useMockMode }) {
  const [journey, setJourney] = useState(demoJourney);
  const [sourceInput, setSourceInput] = useState('');
  const [assetType, setAssetType] = useState('canvas');
  const [postLaunchDraftVersion, setPostLaunchDraftVersion] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [findingNotes, setFindingNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('omniqa_finding_notes') || '{}'); } catch { return {}; }
  });
  const [approval, setApproval] = useState(() => {
    const stored = loadStoredApproval();
    return stored ? { ...emptyApproval, ...stored, checks: { ...emptyApproval.checks, ...(stored.checks || {}) } } : emptyApproval;
  });

  const audit = useMemo(() => auditJourneyAutomatically(journey), [journey]);
  const visibleFindings = audit.findings.filter((item) => severityFilter === 'all' || item.severity === severityFilter);
  const approvalAllowed = canApproveAudit(audit, approval);
  const selectedMessage = audit.messages.find((message) => message.id === selectedMessageId) || audit.messages[0];

  useEffect(() => {
    onAuditChange?.({ journey, audit, approval });
  }, [journey, audit, approval, onAuditChange]);

  useEffect(() => {
    localStorage.setItem('omniqa_finding_notes', JSON.stringify(findingNotes));
  }, [findingNotes]);

  useEffect(() => {
    localStorage.setItem('omniqa_approval', JSON.stringify(approval));
  }, [approval]);

  const resetApproval = () => setApproval(emptyApproval);

  const loadDemo = () => {
    setJourney(demoJourney);
    setImportError('');
    setSelectedMessageId('');
    resetApproval();
  };

  const importFromBraze = async (event) => {
    event.preventDefault();
    if (!sourceInput.trim()) {
      setImportError('Enter a Braze Campaign or Canvas URL/ID.');
      return;
    }
    setIsImporting(true);
    setImportError('');
    try {
      const importedJourney = await importBrazeJourney({
        url: sourceInput.trim(),
        type: assetType,
        postLaunchDraftVersion
      });
      setJourney(importedJourney);
      setSelectedMessageId('');
      resetApproval();
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const selectMessage = (message, openReview = false) => {
    setSelectedMessageId(message.id);
    onSelectMessage?.(message, openReview);
  };

  const updateApprovalCheck = (key, checked) => {
    setApproval((current) => ({ ...current, checks: { ...current.checks, [key]: checked }, status: 'pending', approvedAt: '' }));
  };

  const approve = () => {
    if (!approvalAllowed) return;
    const nextApproval = { ...approval, status: 'approved', approvedAt: new Date().toISOString() };
    setApproval(nextApproval);
    const history = JSON.parse(localStorage.getItem('omniqa_approval_history') || '[]');
    localStorage.setItem('omniqa_approval_history', JSON.stringify([
      { journeyId: journey.id, journeyName: journey.name, auditId: audit.id, score: audit.score, ...nextApproval },
      ...history
    ].slice(0, 25)));
  };

  const printReport = () => {
    const cleanup = () => document.body.classList.remove('print-automation');
    document.body.classList.add('print-automation');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1500);
  };

  const createEmailDraft = () => {
    const subject = `OmniQA pre-deployment report: ${journey.name} (${audit.score}/100)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(createReportText(journey, audit, approval))}`;
  };

  return (
    <div className="automated-qa fade-in">
      <section className="automation-hero">
        <div>
          <p className="eyebrow">Read-only pre-deployment QA</p>
          <h2>Import once. Review the full journey.</h2>
          <p>OmniQA imports Campaign or Canvas metadata, audits every available message, and prepares evidence for a named reviewer. It cannot deploy or modify Braze.</p>
        </div>
        <div className="safety-lockup"><LockKeyhole size={19} /><span>Human-controlled deployment</span></div>
      </section>

      <section className="automation-import panel">
        <div className="panel-topline">
          <div>
            <p className="eyebrow">Source</p>
            <h3>Braze Campaign or Canvas</h3>
          </div>
          <button className="btn btn-secondary compact-action" type="button" onClick={loadDemo}>Load safe demo</button>
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
          <button className="btn btn-primary automation-import-button" disabled={isImporting || useMockMode}>
            {isImporting ? <><RefreshCw size={16} className="spin" /> Importing</> : <><FileSearch size={16} /> Import and run QA</>}
          </button>
          <label className="automation-checkbox">
            <input type="checkbox" checked={postLaunchDraftVersion} onChange={(event) => setPostLaunchDraftVersion(event.target.checked)} />
            Include the post-launch draft when available
          </label>
        </form>
        {useMockMode && <p className="automation-callout">Sandbox mode is active. Use the safe demo now, or disable Sandbox Simulation in Settings after the read-only Braze variables are configured.</p>}
        {importError && <p className="automation-error" role="alert"><AlertCircle size={16} />{importError}</p>}
      </section>

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
          <p>{journey.source === 'braze' ? 'Imported read-only from Braze' : 'Sandbox fixture'} · {journey.type}</p>
          <span>{journey.draft ? 'Draft' : journey.enabled ? 'Enabled' : 'Not enabled'}</span>
        </article>
      </section>

      <section className="automation-workspace">
        <div className="panel journey-map-panel">
          <div className="panel-topline">
            <div><p className="eyebrow">Journey inventory</p><h3>Steps and messages</h3></div>
            <span className="read-only-label"><ShieldCheck size={14} /> Read only</span>
          </div>
          <div className="journey-step-list">
            {journey.steps.map((step, stepIndex) => (
              <div className="journey-step" key={step.id}>
                <div className="journey-step-heading"><span>{String(stepIndex + 1).padStart(2, '0')}</span><div><strong>{step.name}</strong><small>{step.messages.length} message{step.messages.length === 1 ? '' : 's'}</small></div></div>
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
                </div>
              </div>
            ))}
          </div>
          {selectedMessage && (
            <div className="selected-message-card">
              <div><p className="eyebrow">Selected message</p><h4>{selectedMessage.name}</h4><p>{selectedMessage.subject || selectedMessage.title || selectedMessage.body.slice(0, 120)}</p></div>
              <button type="button" className="btn btn-secondary compact-action" onClick={() => selectMessage(selectedMessage, true)}>Open focused review <ExternalLink size={14} /></button>
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

      <section className="approval-panel panel">
        <div className="panel-topline">
          <div><p className="eyebrow">Human approval gate</p><h3>Deployment remains outside OmniQA</h3></div>
          <span className={`readiness-pill ${approval.status === 'approved' ? 'approved' : audit.status}`}>{formatStatus(approval.status === 'approved' ? 'approved' : audit.status)}</span>
        </div>
        <p className="approval-intro">Automated checks provide evidence. A named reviewer must validate business logic, test sends, and final Braze configuration before approving readiness.</p>
        <div className="approval-grid">
          <div className="approval-checks">
            {approvalChecks.map(([key, label]) => (
              <label key={key}><input type="checkbox" checked={approval.checks[key]} onChange={(event) => updateApprovalCheck(key, event.target.checked)} /><span>{label}</span></label>
            ))}
          </div>
          <div className="approval-fields">
            <div className="form-group"><label className="form-label" htmlFor="reviewer">Reviewer name</label><input id="reviewer" className="form-input" value={approval.reviewer} onChange={(event) => setApproval({ ...approval, reviewer: event.target.value, status: 'pending', approvedAt: '' })} /></div>
            <div className="form-group"><label className="form-label" htmlFor="decision-note">Decision or exception note</label><textarea id="decision-note" className="form-textarea" value={approval.decisionNote} onChange={(event) => setApproval({ ...approval, decisionNote: event.target.value, status: 'pending', approvedAt: '' })} /></div>
            <label className="automation-checkbox approval-confirm"><input type="checkbox" checked={approval.confirmHumanReview} onChange={(event) => setApproval({ ...approval, confirmHumanReview: event.target.checked, status: 'pending', approvedAt: '' })} />I reviewed the final asset in Braze and accept responsibility for the readiness decision.</label>
          </div>
        </div>
        {audit.counts.blocker > 0 && <p className="approval-blocked"><AlertCircle size={16} />Resolve {audit.counts.blocker} blocker{audit.counts.blocker === 1 ? '' : 's'} before approval can be recorded.</p>}
        <div className="approval-actions">
          <div><button type="button" className="btn btn-secondary" onClick={createEmailDraft}><Mail size={15} /> Email report</button><button type="button" className="btn btn-secondary" onClick={printReport}><Download size={15} /> Save / print PDF</button></div>
          <button type="button" className="btn btn-primary approval-button" onClick={approve} disabled={!approvalAllowed || approval.status === 'approved'}><ClipboardCheck size={16} />{approval.status === 'approved' ? `Approved ${new Date(approval.approvedAt).toLocaleString()}` : 'Approve readiness'}</button>
        </div>
      </section>
    </div>
  );
}
