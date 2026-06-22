import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ClipboardCheck, Download, Mail, ShieldCheck, Save, Plus, Trash2 } from 'lucide-react';
import { canApproveAudit } from '../utils/campaignAudit';

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
  
  const checksText = (approval.items || []).map((item) =>
    `[${item.done ? 'X' : ' '}] ${item.text}`
  ).join('\n');

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

READINESS CHECKS
${checksText || 'No checklist items.'}

FINDINGS
${findings || 'No automated findings.'}

READINESS BOUNDARY
This report records a QA decision. A person still controls activation and scheduling in Braze.`;
}

export default function ApprovalGate({ automationState, preApprovalStatus, approval, setApproval, onApprovalChange, onQuickSave }) {
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const journey = automationState?.journey;
  const audit = automationState?.audit;

  const completedChecks = (approval?.items || []).filter(item => item.done).length;
  const totalChecks = (approval?.items || []).length;

  const approvalAllowed = useMemo(() => {
    if (!audit) return false;
    return canApproveAudit(audit, approval) && preApprovalStatus?.ready;
  }, [audit, approval, preApprovalStatus]);

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

  const updateItem = (id, done) => {
    setApproval((current) => {
      const nextItems = (current.items || []).map(item => item.id === id ? { ...item, done } : item);
      const nextChecks = { ...current.checks, [id]: done };
      return {
        ...current,
        items: nextItems,
        checks: nextChecks,
        status: 'pending',
        approvedAt: ''
      };
    });
  };

  const addItem = () => {
    const text = newCheckpoint.trim();
    if (!text) return;
    const newId = crypto?.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    setApproval((current) => {
      const nextItems = [...(current.items || []), { id: newId, text, done: false }];
      const nextChecks = { ...current.checks, [newId]: false };
      return {
        ...current,
        items: nextItems,
        checks: nextChecks,
        status: 'pending',
        approvedAt: ''
      };
    });
    setNewCheckpoint('');
  };

  const removeItem = (id) => {
    setApproval((current) => {
      const nextItems = (current.items || []).filter(item => item.id !== id);
      const nextChecks = { ...current.checks };
      delete nextChecks[id];
      return {
        ...current,
        items: nextItems,
        checks: nextChecks,
        status: 'pending',
        approvedAt: ''
      };
    });
  };

  const handleToggleAll = () => {
    const allChecked = (approval.items || []).every(item => item.done);
    setApproval((current) => {
      const nextItems = (current.items || []).map(item => ({ ...item, done: !allChecked }));
      const nextChecks = {};
      nextItems.forEach(item => { nextChecks[item.id] = item.done; });
      return {
        ...current,
        items: nextItems,
        checks: nextChecks,
        status: 'pending',
        approvedAt: ''
      };
    });
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

  let approvalPillText = 'Pending Review';
  let approvalPillClass = 'blocked';

  if (approval.status === 'approved' || (totalChecks > 0 && completedChecks === totalChecks)) {
    approvalPillText = 'Complete';
    approvalPillClass = 'approved';
  } else if (completedChecks > 0) {
    approvalPillText = 'In Progress';
    approvalPillClass = 'needs-review';
  }

  return (
    <section className="approval-panel panel">
      <div className="panel-topline">
        <div><p className="eyebrow">Final readiness review</p><h3>Readiness Approval</h3></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
            onClick={handleToggleAll}
          >
            {(approval.items || []).every(item => item.done) ? 'Deselect All' : 'Select All Checks'}
          </button>
          <span className={`readiness-pill ${approvalPillClass}`}>{approvalPillText}</span>
        </div>
      </div>
      <p className="approval-intro">Automated findings are evidence, not a launch decision. Confirm the remaining business and test checks, record the reviewer, and approve readiness here.</p>
      {!preApprovalStatus?.ready && <p className="approval-blocked"><AlertCircle size={16} />Complete the Pre-Approval checklist first ({preApprovalStatus?.complete || 0}/{preApprovalStatus?.total || 0}).</p>}
      <div className="approval-grid">
        <div className="approval-checks" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(approval.items || []).map((item) => (
            <div 
              key={item.id} 
              className="checklist-item-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                gap: '0.75rem'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1, margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={!!item.done} 
                  onChange={(event) => updateItem(item.id, event.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{item.text}</span>
              </label>
              
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeItem(item.id)}
                title="Remove checkpoint"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          {/* Add custom checkpoint form */}
          <div className="add-checkpoint-form" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={newCheckpoint}
              onChange={(e) => setNewCheckpoint(e.target.value)}
              placeholder="Add custom readiness check..."
              style={{ flex: 1, fontSize: '0.85rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={addItem}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
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
