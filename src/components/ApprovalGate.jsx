import { useEffect, useMemo } from 'react';
import { AlertCircle, ClipboardCheck, Download, Mail, ShieldCheck, Save } from 'lucide-react';
import { canApproveAudit } from '../utils/campaignAudit';

const approvalChecks = [
  ['audience', 'Audience, exclusions, entry criteria, and schedule were verified in Braze.'],
  ['content', 'Every message variant, link, sender, and destination was reviewed.'],
  ['personalization', 'Liquid variables, fallback values, and channel eligibility were tested.'],
  ['evidence', 'Test-send evidence and required stakeholder approvals are documented.']
];

function formatStatus(status) {
  return {
    blocked: 'Blocked',
    'needs-review': 'Needs review',
    'ready-for-approval': 'Ready for approval',
    approved: 'Ready for Deploy'
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

READINESS BOUNDARY
This report records a QA decision. A person still controls activation and scheduling in Braze.`;
}

export default function ApprovalGate({ automationState, preApprovalStatus, approval, setApproval, onApprovalChange, onQuickSave }) {
  const journey = automationState?.journey;
  const audit = automationState?.audit;
  const approvalAllowed = useMemo(() => audit ? canApproveAudit(audit, approval) && preApprovalStatus?.ready : false, [audit, approval, preApprovalStatus]);

  useEffect(() => {
    onApprovalChange?.(approval);
  }, [approval, onApprovalChange]);

  if (!journey || !audit) {
    return (
      <section className="approval-panel panel approval-empty">
        <ShieldCheck size={28} />
        <h3>Run Automated QA first</h3>
        <p>Import a Campaign or Canvas, or load the fictional demo, before completing the final readiness review.</p>
      </section>
    );
  }

  const updateCheck = (key, checked) => {
    setApproval((current) => ({ ...current, checks: { ...current.checks, [key]: checked }, status: 'pending', approvedAt: '' }));
  };

  const approve = () => {
    if (!approvalAllowed) return;
    const next = { ...approval, status: 'approved', approvedAt: new Date().toISOString() };
    setApproval(next);
    const history = JSON.parse(localStorage.getItem('omniqa_approval_history') || '[]');
    localStorage.setItem('omniqa_approval_history', JSON.stringify([
      { journeyId: journey.id, journeyName: journey.name, auditId: audit.id, score: audit.score, ...next },
      ...history
    ].slice(0, 25)));
  };

  const createEmailDraft = () => {
    const subject = `OmniQA pre-deployment report: ${journey.name} (${audit.score}/100)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(createReportText(journey, audit, approval))}`;
  };

  const printReport = () => {
    window.print();
  };

  const completedChecks = Object.keys(approval?.checks || {}).filter(k => approval.checks[k]).length;
  const totalChecks = approvalChecks.length;

  let approvalPillText = 'Pending Review';
  let approvalPillClass = 'blocked';

  if (approval.status === 'approved' || completedChecks === totalChecks) {
    approvalPillText = 'Complete';
    approvalPillClass = 'approved';
  } else if (completedChecks > 0) {
    approvalPillText = 'In Progress';
    approvalPillClass = 'needs-review';
  }

  return (
    <section className="approval-panel panel">
      <div className="panel-topline">
        <div><p className="eyebrow">Final readiness review</p><h3>Human approval</h3></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
            onClick={() => {
              const keys = approvalChecks.map(([k]) => k);
              const allChecked = keys.every(k => approval.checks[k]);
              const nextChecks = {};
              keys.forEach(k => { nextChecks[k] = !allChecked; });
              setApproval(current => ({
                ...current,
                checks: nextChecks,
                status: 'pending',
                approvedAt: ''
              }));
            }}
          >
            {approvalChecks.map(([k]) => k).every(k => approval.checks[k]) ? 'Deselect All' : 'Select All Checks'}
          </button>
          <span className={`readiness-pill ${approvalPillClass}`}>{approvalPillText}</span>
        </div>
      </div>
      <p className="approval-intro">Automated findings are evidence, not a launch decision. Confirm the remaining business and test checks, record the reviewer, and approve readiness here.</p>
      {!preApprovalStatus?.ready && <p className="approval-blocked"><AlertCircle size={16} />Complete the Pre-Approval checklist first ({preApprovalStatus?.complete || 0}/{preApprovalStatus?.total || 0}).</p>}
      <div className="approval-grid">
        <div className="approval-checks">
          {approvalChecks.map(([key, label]) => (
            <label key={key}><input type="checkbox" checked={approval.checks[key]} onChange={(event) => updateCheck(key, event.target.checked)} /><span>{label}</span></label>
          ))}
        </div>
        <div className="approval-fields">
          <div className="form-group"><label className="form-label" htmlFor="reviewer">Reviewer name</label><input id="reviewer" className="form-input" value={approval.reviewer} onChange={(event) => setApproval({ ...approval, reviewer: event.target.value, status: 'pending', approvedAt: '' })} /></div>
          <div className="form-group"><label className="form-label" htmlFor="decision-note">Decision or exception note</label><textarea id="decision-note" className="form-textarea" value={approval.decisionNote} onChange={(event) => setApproval({ ...approval, decisionNote: event.target.value, status: 'pending', approvedAt: '' })} /></div>
          <label className="automation-checkbox approval-confirm"><input type="checkbox" checked={approval.confirmHumanReview} onChange={(event) => setApproval({ ...approval, confirmHumanReview: event.target.checked, status: 'pending', approvedAt: '' })} />I reviewed the final asset in Braze and accept responsibility for this readiness decision.</label>
        </div>
      </div>
      {audit.counts.blocker > 0 && <p className="approval-blocked"><AlertCircle size={16} />Resolve {audit.counts.blocker} blocker{audit.counts.blocker === 1 ? '' : 's'} before approval can be recorded.</p>}
      <div className="approval-actions">
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={createEmailDraft}><Mail size={15} /> Email report</button>
          <button type="button" className="btn btn-secondary" onClick={printReport}><Download size={15} /> Save / print PDF</button>
          <button type="button" className="btn btn-secondary" onClick={onQuickSave} style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Save size={15} /> Save QA to Library</button>
        </div>
        <button type="button" className="btn btn-primary approval-button" onClick={approve} disabled={!approvalAllowed || approval.status === 'approved'}><ClipboardCheck size={16} />{approval.status === 'approved' ? `Approved ${new Date(approval.approvedAt).toLocaleString()}` : 'Approve readiness'}</button>
      </div>
    </section>
  );
}
