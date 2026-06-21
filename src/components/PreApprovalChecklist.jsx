import { useEffect, useState } from 'react';
import { MessageSquareText, Plus, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'omniqa_preapproval_checklist';

const defaultItems = [
  'Confirm audience, exclusions, entry criteria, and frequency controls.',
  'Verify campaign schedule, time zone, and launch window.',
  'Review every message variant, sender, link, and destination.',
  'Test Liquid variables, fallback values, and channel eligibility.',
  'Complete test sends or device previews for every active channel.',
  'Document stakeholder approval and any accepted exceptions.'
];

function createId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeItem(text) {
  return { id: createId(), text, done: false, note: '' };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored) return stored;
  } catch {
    // Fall through to a clean fictional workspace.
  }
  return {
    setup: { campaignName: '', campaignType: '', owner: '', launchDate: '' },
    items: defaultItems.map(makeItem),
    generalNotes: ''
  };
}

export default function PreApprovalChecklist({ automationState, onStatusChange }) {
  const [state, setState] = useState(loadState);
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [openNotes, setOpenNotes] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const complete = state.items.filter((item) => item.done).length;
    onStatusChange?.({ complete, total: state.items.length, ready: state.items.length > 0 && complete === state.items.length });
  }, [state, onStatusChange]);

  useEffect(() => {
    if (!automationState?.journey) return;
    setState((current) => ({
      ...current,
      setup: {
        ...current.setup,
        campaignName: current.setup.campaignName || automationState.journey.name || '',
        campaignType: current.setup.campaignType || automationState.journey.type || ''
      }
    }));
  }, [automationState?.journey]);

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
          <div className="form-group"><label className="form-label" htmlFor="pre-name">Campaign or Canvas name</label><input id="pre-name" className="form-input" value={state.setup.campaignName} onChange={(event) => updateSetup('campaignName', event.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-type">Campaign type</label><input id="pre-type" className="form-input" value={state.setup.campaignType} onChange={(event) => updateSetup('campaignType', event.target.value)} placeholder="Lifecycle, promotional, transactional..." /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-owner">Owner</label><input id="pre-owner" className="form-input" value={state.setup.owner} onChange={(event) => updateSetup('owner', event.target.value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="pre-date">Planned launch date</label><input id="pre-date" type="date" className="form-input" value={state.setup.launchDate} onChange={(event) => updateSetup('launchDate', event.target.value)} /></div>
        </div>
      </section>

      <section className="panel preapproval-checklist">
        <div className="panel-topline"><div><p className="eyebrow">Editable checkpoints</p><h3>Manual verification</h3></div><span className={complete === state.items.length ? 'readiness-pill approved' : 'readiness-pill needs-review'}>{complete === state.items.length ? 'Complete' : 'In progress'}</span></div>
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
      </section>
    </div>
  );
}
