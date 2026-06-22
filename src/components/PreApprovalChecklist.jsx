import { useState } from 'react';
import { MessageSquareText, Plus, Trash2, Mail, Download, Save } from 'lucide-react';

function createId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeItem(text) {
  return { id: createId(), text, done: false, note: '' };
}

export default function PreApprovalChecklist({ state, setState, automationState, onQuickSave, approval }) {
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [openNotes, setOpenNotes] = useState([]);

  const updateSetup = (key, value) => setState((current) => ({ ...current, setup: { ...current.setup, [key]: value } }));
  const updateItem = (id, updates) => setState((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...updates } : item) }));
  const removeItem = (id) => setState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));

  const addItem = () => {
    const text = newCheckpoint.trim();
    if (!text) return;
    setState((current) => ({ ...current, items: [...current.items, makeItem(text)] }));
    setNewCheckpoint('');
  };

  const complete = state.items.filter((item) => item.done).length;

  const journey = automationState?.journey;
  const audit = automationState?.audit;

  const createEmailDraft = () => {
    if (!journey || !audit) return;
    const subject = `OmniQA pre-deployment report: ${journey.name} (${audit.score}/100)`;
    
    const formatStatusLocal = (status) => {
      return {
        blocked: 'Blocked',
        'needs-review': 'Needs review',
        'ready-for-approval': 'Ready for approval',
        approved: 'Ready for Deploy'
      }[status] || 'Pending review';
    };

    const findings = audit.findings.map((item) =>
      `[${item.severity.toUpperCase()}] ${item.title}\nEvidence: ${item.evidence}\nAction: ${item.remediation}`
    ).join('\n\n');

    const reportText = `OMNIQA PRE-DEPLOYMENT QA REPORT

Campaign: ${journey.name}
Type: ${journey.type}
Generated: ${new Date(audit.generatedAt).toLocaleString()}
Status: ${formatStatusLocal(approval?.status === 'approved' ? 'approved' : audit.status)}
Score: ${audit.score}/100
Steps: ${audit.stepCount}
Messages: ${audit.messageCount}
Channels: ${audit.channelCount}

Blockers: ${audit.counts.blocker}
High: ${audit.counts.high}
Medium: ${audit.counts.medium}
Low: ${audit.counts.low}

Reviewer: ${approval?.reviewer || 'Not assigned'}
Decision note: ${approval?.decisionNote || 'None'}

FINDINGS
${findings || 'No automated findings.'}

READINESS BOUNDARY
This report records a QA decision. A person still controls activation and scheduling in Braze.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="preapproval-workspace fade-in">
      <section className="panel preapproval-intro">
        <div>
          <p className="eyebrow">Before final approval</p>
          <h3>Pre-Approval Checklist</h3>
          <p>Automated QA catches technical signals. Use this checklist for the business, audience, test-send, and stakeholder checks that require a person.</p>
        </div>
        <div className="preapproval-progress"><strong>{complete}/{state.items.length}</strong><span>complete</span></div>
      </section>

      <section className="panel preapproval-setup">
        <div className="panel-topline"><div><p className="eyebrow">Campaign setup</p><h3>Review context</h3></div></div>
        <div className="preapproval-setup-grid">
          <div className="form-group"><label className="form-label" htmlFor="pre-name">Campaign or Canvas name</label><input id="pre-name" className="form-input" value={state?.setup?.campaignName || ''} onChange={(event) => updateSetup('campaignName', event.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-type">Campaign type</label><input id="pre-type" className="form-input" value={state?.setup?.campaignType || ''} onChange={(event) => updateSetup('campaignType', event.target.value)} placeholder="Lifecycle, promotional, transactional..." /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-owner">Owner</label><input id="pre-owner" className="form-input" value={state?.setup?.owner || ''} onChange={(event) => updateSetup('owner', event.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-date">Planned launch date</label><input id="pre-date" type="date" className="form-input" value={state?.setup?.launchDate || ''} onChange={(event) => updateSetup('launchDate', event.target.value)} /></div>
        </div>
      </section>

      <section className="panel preapproval-checklist">
        <div className="panel-topline">
          <div>
            <p className="eyebrow">Editable checkpoints</p>
            <h3>Manual verification</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
              onClick={() => {
                const allDone = state.items.every(item => item.done);
                setState(current => ({
                  ...current,
                  items: current.items.map(item => ({ ...item, done: !allDone }))
                }));
              }}
            >
              {state.items.every(item => item.done) ? 'Deselect All' : 'Select All'}
            </button>
            <span className={
              complete === state.items.length 
                ? 'readiness-pill approved' 
                : complete === 0 
                  ? 'readiness-pill blocked' 
                  : 'readiness-pill needs-review'
            }>
              {
                complete === state.items.length 
                  ? 'Complete' 
                  : complete === 0 
                    ? 'Pending Review' 
                    : 'In progress'
              }
            </span>
          </div>
        </div>
        <div className="preapproval-items">
          {state.items.map((item, index) => (
            <article className={`preapproval-item ${item.done ? 'done' : ''}`} key={item.id}>
              <div className="preapproval-item-row">
                <input type="checkbox" checked={item.done} onChange={(event) => updateItem(item.id, { done: event.target.checked })} aria-label={`Mark checkpoint ${index + 1} complete`} />
                <textarea className="form-textarea" rows="2" value={item.text} onChange={(event) => updateItem(item.id, { text: event.target.value })} aria-label={`Checkpoint ${index + 1}`} />
                <button className="icon-button" type="button" onClick={() => setOpenNotes((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-label={`Add note to checkpoint ${index + 1}`}><MessageSquareText size={16} /></button>
                <button className="icon-button" type="button" onClick={() => removeItem(item.id)} aria-label={`Remove checkpoint ${index + 1}`}><Trash2 size={16} /></button>
              </div>
              {(openNotes.includes(item.id) || item.note) && <textarea className="form-textarea preapproval-note" value={item.note} onChange={(event) => updateItem(item.id, { note: event.target.value })} placeholder="Add a note, owner, blocker, or exception..." />}
            </article>
          ))}
        </div>
        <div className="preapproval-add-row">
          <input className="form-input" value={newCheckpoint} onChange={(event) => setNewCheckpoint(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addItem(); } }} placeholder="Add another checkpoint" />
          <button className="btn btn-secondary" type="button" onClick={addItem}><Plus size={15} /> Add</button>
        </div>
        <div className="form-group preapproval-general-notes"><label className="form-label" htmlFor="pre-notes">General reviewer notes</label><textarea id="pre-notes" className="form-textarea" value={state.generalNotes} onChange={(event) => setState((current) => ({ ...current, generalNotes: event.target.value }))} placeholder="Document open questions, owners, decisions, or accepted risks..." /></div>
        
        {/* Verification action buttons */}
        <div className="approval-actions" style={{ marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={createEmailDraft} disabled={!journey || !audit}><Mail size={15} /> Email report</button>
            <button type="button" className="btn btn-secondary" onClick={printReport} disabled={!journey || !audit}><Download size={15} /> Save / print PDF</button>
            <button type="button" className="btn btn-secondary" onClick={onQuickSave} disabled={!journey || !audit} style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Save size={15} /> Save QA to Library</button>
          </div>
        </div>
      </section>
    </div>
  );
}
