import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, CloudLightning, FileEdit, ExternalLink } from 'lucide-react';

const SEED_CAMPAIGNS = [
  {
    id: '1',
    name: 'Northstar Welcome Lifecycle',
    brazeCampaignId: '65a2d8f9b1c0e3a4f5d6c7b8',
    channel: 'email',
    version: 'v1.4',
    status: 'Live',
    lastSynced: '2 days ago',
    subjectLine: 'Your welcome reward is ready',
    brazeHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Northstar Rewards Welcome</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background-color: #002d62; padding: 30px; text-align: center; color: #ffffff; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Northstar Rewards</h1>
    </div>
    <div class="content">
      <h2>Welcome, {{ user.first_name | default: 'Valued Customer' }}!</h2>
      <p>We loaded a special reward into your account to say thanks for being an app member.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/redeem" style="background-color: #f43f5e; color: #ffffff;" class="btn">View Welcome Offer</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Northstar Rewards. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`,
    pushBody: 'Your welcome reward is ready. Open the app to explore your new member benefits.',
    smsBody: 'Northstar Rewards: Welcome {{ user.first_name | default: \'Valued Customer\' }}! View your member offer: http://example.com/redeem',
    iamHeader: 'Your welcome reward is ready',
    iamBody: 'Explore your new member benefits and available offers. Valid for 14 days.',
    iamButtonText: 'View Offer',
    iamButtonLink: 'http://example.com/redeem',
    savedJourney: { id: '1', name: 'Northstar Welcome Lifecycle', steps: [], type: 'campaign', source: 'library' },
    savedAudit: {
      score: 100,
      counts: { blocker: 0, high: 0, medium: 0, low: 0 },
      findings: []
    },
    savedApproval: {
      status: 'approved',
      reviewer: 'QA Lead Engineer',
      approvedAt: '2026-06-19T14:30:00.000Z',
      decisionNote: 'All copy spec matches and liquid parameters pass cleanly. Ready to deploy.'
    }
  },
  {
    id: '2',
    name: 'Summer Points Boost',
    brazeCampaignId: '65b3e9a0c2d1f4b5e6f7d8a9',
    channel: 'push',
    version: 'v2.1',
    status: 'Out of Sync',
    lastSynced: '1 week ago',
    subjectLine: 'Summer double points are here',
    brazeHtml: '<h1>Summer Points Boost</h1>',
    pushBody: 'Get double points on eligible purchases today. Open the app to check your loyalty tier.',
    smsBody: 'Northstar Rewards: Earn double points on eligible purchases today. Open the app for details.',
    iamHeader: 'Double Points Today!',
    iamBody: 'Make an eligible purchase today and get double points toward your next reward.',
    iamButtonText: 'Order Now',
    iamButtonLink: 'http://example.com/order',
    savedJourney: { id: '2', name: 'Summer Points Boost', steps: [], type: 'campaign', source: 'library' },
    savedAudit: {
      score: 74,
      counts: { blocker: 0, high: 1, medium: 1, low: 1 },
      findings: [
        { id: 'f-1', severity: 'high', title: 'Action links contain placeholders', evidence: 'example.com', remediation: 'Replace placeholders.', category: 'Links', scope: 'message' },
        { id: 'f-2', severity: 'medium', title: 'Alt attribute is missing from image', evidence: 'summer_boost.png', remediation: 'Add descriptive alt text.', category: 'Images', scope: 'message' },
        { id: 'f-3', severity: 'low', title: 'Missing tracking parameters', evidence: 'utm_source missing', remediation: 'Add UTM tags.', category: 'Links', scope: 'message' }
      ]
    },
    savedApproval: {
      status: 'pending',
      reviewer: '',
      decisionNote: ''
    }
  },
  {
    id: '3',
    name: 'QSR App Download Campaign',
    brazeCampaignId: '65c4f0b1d3e2a5c6f7a8b9c0',
    channel: 'iam',
    version: 'v1.0',
    status: 'Draft',
    lastSynced: '3 days ago',
    subjectLine: 'Download the app and explore member rewards',
    brazeHtml: '<h1>Get rewards in the Northstar App</h1>',
    pushBody: 'Sign up in the app to start earning member rewards.',
    smsBody: 'Northstar Rewards: Download the app to explore member benefits: http://example.com/download',
    iamHeader: 'Get the App',
    iamBody: 'Receive rewards on your birthday, unlock point multipliers, and get quick ordering.',
    iamButtonText: 'Get App',
    iamButtonLink: 'http://example.com/download',
    savedJourney: { id: '3', name: 'QSR App Download Campaign', steps: [], type: 'campaign', source: 'library' },
    savedAudit: {
      score: 83,
      counts: { blocker: 0, high: 0, medium: 2, low: 1 },
      findings: [
        { id: 'f-4', severity: 'medium', title: 'Contrast ratio fails accessibility check', evidence: 'Ratio 3.2:1', remediation: 'Increase contrast.', category: 'Accessibility', scope: 'message' },
        { id: 'f-5', severity: 'medium', title: 'Preheader is missing', evidence: 'Preheader is empty', remediation: 'Add a supporting preheader.', category: 'Email', scope: 'message' }
      ]
    },
    savedApproval: {
      status: 'pending',
      reviewer: '',
      decisionNote: ''
    }
  }
];

const getBrazeDashboardUrl = (campaignId) => {
  const endpoint = localStorage.getItem('braze_endpoint') || 'https://rest.iad-01.braze.com';
  let domain = 'dashboard.braze.com';
  
  if (endpoint.includes('iad-01')) domain = 'dashboard-01.braze.com';
  else if (endpoint.includes('iad-02')) domain = 'dashboard-02.braze.com';
  else if (endpoint.includes('iad-03')) domain = 'dashboard-03.braze.com';
  else if (endpoint.includes('iad-05')) domain = 'dashboard-05.braze.com';
  else if (endpoint.includes('iad-06')) domain = 'dashboard-06.braze.com';
  else if (endpoint.includes('eu')) domain = 'dashboard-eu.braze.com';
  else if (endpoint.includes('cn')) domain = 'dashboard.braze.com.cn';

  if (campaignId) {
    return `https://${domain}/campaigns/editor/${campaignId}/details`;
  }
  return `https://${domain}/campaigns`;
};

export default function Catalog({ 
  onLoadCampaign,
  loadedCampaignId,
  setLoadedCampaignId,
  currentCampaignState,
  automationState
}) {
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignId, setNewCampaignId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [loadingLoadId, setLoadingLoadId] = useState(null);
  
  const [editingIdField, setEditingIdField] = useState(null);
  const [tempCampaignId, setTempCampaignId] = useState('');
  const [reportModalCampaign, setReportModalCampaign] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('omniqa_braze_catalog');
    if (saved) {
      setCampaigns(JSON.parse(saved));
    } else {
      setCampaigns(SEED_CAMPAIGNS);
      localStorage.setItem('omniqa_braze_catalog', JSON.stringify(SEED_CAMPAIGNS));
    }
  }, []);

  const saveCatalog = (updatedList) => {
    setCampaigns(updatedList);
    localStorage.setItem('omniqa_braze_catalog', JSON.stringify(updatedList));
  };

  const handleLoad = (campaign) => {
    setLoadingLoadId(campaign.id);
    if (setLoadedCampaignId) {
      setLoadedCampaignId(campaign.id);
    }
    setTimeout(() => {
      if (onLoadCampaign) {
        onLoadCampaign(campaign);
      }
      setLoadingLoadId(null);
    }, 1000);
  };

  const handleSync = (id) => {
    setSyncingId(id);
    // Simulate Braze API sync latency
    setTimeout(() => {
      const updated = campaigns.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'Live',
            lastSynced: 'Just now',
            version: `v${(parseFloat(c.version.replace('v', '')) + 0.1).toFixed(1)}`
          };
        }
        return c;
      });
      saveCatalog(updated);
      setSyncingId(null);
    }, 1500);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this campaign template from the catalog?")) {
      const updated = campaigns.filter(c => c.id !== id);
      saveCatalog(updated);
    }
  };

  const handleSaveCampaignId = (id) => {
    const updated = campaigns.map(c => {
      if (c.id === id) {
        return {
          ...c,
          brazeCampaignId: tempCampaignId.trim()
        };
      }
      return c;
    });
    saveCatalog(updated);
    setEditingIdField(null);
  };

  const handleCreateFromWorkspace = (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const newCampaign = {
      id: Date.now().toString(),
      name: newCampaignName,
      brazeCampaignId: newCampaignId.trim(),
      channel: 'email', // default primary
      version: 'v1.0',
      status: 'Draft',
      lastSynced: 'Never',
      ...currentCampaignState, // Inject all active HTML/Push/SMS workspace values
      savedJourney: automationState?.journey || null,
      savedAudit: automationState?.audit || null,
      savedApproval: automationState?.approval || null
    };

    const updated = [newCampaign, ...campaigns];
    saveCatalog(updated);
    setNewCampaignName('');
    setNewCampaignId('');
    setShowAddForm(false);
  };

  const handleUpdateCard = (id) => {
    if (!automationState?.audit) {
      if (!window.confirm("You have not run a QA audit in the active workspace yet. Update this template's message contents anyway (QA score and findings will be cleared)?")) {
        return;
      }
    }
    
    if (window.confirm("Are you sure you want to update this template card with the active workspace content, QA score, findings, and approval log?")) {
      const updated = campaigns.map(c => {
        if (c.id === id) {
          return {
            ...c,
            lastSynced: 'Just now (Updated)',
            status: 'Live',
            ...currentCampaignState,
            savedJourney: automationState?.journey || null,
            savedAudit: automationState?.audit || null,
            savedApproval: automationState?.approval || null
          };
        }
        return c;
      });
      saveCatalog(updated);
      alert("Campaign template successfully updated with current workspace QA content & results!");
    }
  };

  const handlePrintReport = () => {
    document.body.classList.add('print-library-report');
    const cleanup = () => document.body.classList.remove('print-library-report');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1500);
  };

  const handleCopyMarkdownReport = (campaign) => {
    const findings = campaign.savedAudit?.findings?.map((item) =>
      `- [${item.severity.toUpperCase()}] **${item.title}**\n  *Evidence:* ${item.evidence || 'N/A'}\n  *Remediation:* ${item.remediation || 'N/A'}`
    ).join('\n\n') || '- No automated findings.';

    const reportText = `### OMNIQA SAVED QA AUDIT REPORT: ${campaign.name}
- **Braze Campaign ID:** \`${campaign.brazeCampaignId || 'None'}\`
- **Version:** ${campaign.version}
- **QA Score:** ${campaign.savedAudit?.score || 'N/A'}/100
- **QA Status:** ${campaign.savedApproval?.status === 'approved' ? 'Approved' : 'Pending Review'}
- **Reviewer:** ${campaign.savedApproval?.reviewer || 'Not assigned'}
- **Decision Note:** *${campaign.savedApproval?.decisionNote || 'No notes left.'}*

#### FINDINGS SUMMARY
${findings}
`;
    navigator.clipboard.writeText(reportText).then(() => {
      alert(`Markdown QA Report for "${campaign.name}" copied to clipboard!`);
    }).catch(err => {
      console.error('Could not copy report:', err);
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Live': return { color: 'var(--success)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'Out of Sync': return { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      default: return { color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)' };
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top action block */}
      <div className="print-report-only-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Campaign Library</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Store reusable QA examples locally. Braze links open the source campaign; message content is loaded from saved examples or entered manually.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a 
            href={getBrazeDashboardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              textDecoration: 'none',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              backgroundColor: 'rgba(6, 182, 212, 0.05)',
              fontWeight: '600'
            }}
          >
            <ExternalLink size={16} /> Open Braze Dashboard
          </a>

          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Save Current Workspace Template
          </button>
        </div>
      </div>

      {/* Save Campaign Form */}
      {showAddForm && (
        <form onSubmit={handleCreateFromWorkspace} className="panel print-report-only-hide" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.02)' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CloudLightning size={16} style={{ color: 'var(--accent-cyan)' }} />
            Save Workspace Template to Catalog Database
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Campaign Template Name:</label>
              <input 
                type="text" 
                className="form-input" 
                required
                placeholder="e.g. Fall Member Offer"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Braze Campaign ID (Optional):</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 65a2d8f9b1c0e3a4f5d6c7b8" 
                value={newCampaignId}
                onChange={(e) => setNewCampaignId(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Save Template</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ height: '38px' }}>Cancel</button>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            * This grabs the current HTML, Push notify copy, SMS copy, subject line, and IAM layout parameters currently loaded in your editor workspace.
          </p>
        </form>
      )}

      {/* Catalog Card Grid */}
      <div className="catalog-grid print-report-only-hide">
        {campaigns.map((c) => (
          <div key={c.id} className="panel" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            border: c.id === loadedCampaignId ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            position: 'relative',
            boxShadow: c.id === loadedCampaignId ? '0 0 10px rgba(139, 92, 246, 0.1)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{c.channel === 'email' ? '✉️ Email' : c.channel === 'push' ? '📱 Push' : c.channel === 'sms' ? '💬 SMS' : '✨ In-App'}</span>
                  {c.id === loadedCampaignId && <span style={{ color: 'var(--accent-purple)', textTransform: 'none', fontSize: '0.65rem', fontWeight: '800' }}>· ACTIVE WORKSPACE</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a 
                    href={getBrazeDashboardUrl(c.brazeCampaignId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--text-primary)'
                    }}
                    title={c.brazeCampaignId ? "Open Campaign in Braze Dashboard" : "Go to Braze Campaign Dashboard"}
                  >
                    <h4 
                      style={{ 
                        margin: 0, 
                        fontSize: '1.05rem', 
                        fontWeight: '700', 
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--accent-cyan)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
                    >
                      {c.name}
                    </h4>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                  </a>
                </div>
              </div>
              <span style={{ 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.72rem',
                fontWeight: '700',
                ...getStatusStyle(c.status)
              }}>
                {c.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0', margin: '0.1rem 0', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Version</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.version}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Last Synced</span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.lastSynced}</strong>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Braze Campaign ID</span>
                {editingIdField === c.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={tempCampaignId}
                      onChange={(e) => setTempCampaignId(e.target.value)}
                      placeholder="e.g. 65a2d8f9b1c0e3a4..."
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.1rem 0.3rem', 
                        width: '120px',
                        height: '24px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--accent-cyan)'
                      }}
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => handleSaveCampaignId(c.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', height: '24px', lineHeight: 1 }}
                    >
                      Save
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingIdField(null)}
                      className="btn btn-secondary"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', height: '24px', lineHeight: 1 }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {c.brazeCampaignId || 'None'}
                    </strong>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIdField(c.id);
                        setTempCampaignId(c.brazeCampaignId || '');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px',
                        opacity: 0.7
                      }}
                      title="Edit Braze Campaign ID"
                    >
                      <FileEdit size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {c.savedAudit && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Saved QA Score:</span>
                  <strong style={{ color: c.savedAudit.score >= 90 ? 'var(--success)' : c.savedAudit.score >= 70 ? 'var(--warning)' : 'var(--error)' }}>
                    {c.savedAudit.score}/100
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Findings:</span>
                  <span>
                    {c.savedAudit.counts.blocker > 0 && <span style={{ color: 'var(--error)', marginRight: '0.25rem' }}>{c.savedAudit.counts.blocker} blocker</span>}
                    {c.savedAudit.counts.high > 0 && <span style={{ color: 'var(--error)', marginRight: '0.25rem' }}>{c.savedAudit.counts.high} high</span>}
                    {c.savedAudit.counts.medium > 0 && <span style={{ color: 'var(--warning)', marginRight: '0.25rem' }}>{c.savedAudit.counts.medium} med</span>}
                    {c.savedAudit.counts.low > 0 && <span style={{ color: 'var(--text-secondary)' }}>{c.savedAudit.counts.low} low</span>}
                    {(!c.savedAudit.counts.blocker && !c.savedAudit.counts.high && !c.savedAudit.counts.medium && !c.savedAudit.counts.low) && <span style={{ color: 'var(--success)' }}>Clean Pass</span>}
                  </span>
                </div>
                {c.savedApproval && (
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>QA Status:</span>
                      <strong style={{ color: c.savedApproval.status === 'approved' ? 'var(--success)' : 'var(--warning)' }}>
                        {c.savedApproval.status === 'approved' ? 'Approved' : 'Pending Review'}
                      </strong>
                    </div>
                    {c.savedApproval.reviewer && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reviewer: {c.savedApproval.reviewer} {c.savedApproval.approvedAt && `on ${new Date(c.savedApproval.approvedAt).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setReportModalCampaign(c)} 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                  >
                    View QA Report
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateCard(c.id)} 
                    className="btn btn-secondary" 
                    style={{ flex: 1.2, padding: '0.25rem', fontSize: '0.75rem', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', backgroundColor: 'rgba(139, 92, 246, 0.05)', cursor: 'pointer' }}
                    title="Save active workspace editor content & QA status to this card"
                  >
                    Save QA to Card
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                onClick={() => handleLoad(c)}
                disabled={loadingLoadId === c.id || syncingId === c.id}
                className="btn btn-secondary" 
                style={{
                  flex: 1,
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
                title="Load into Editor"
              >
                <FileEdit size={12} className={loadingLoadId === c.id ? 'spin' : ''} /> {loadingLoadId === c.id ? 'Loading...' : 'Load'}
              </button>

              <a 
                href={getBrazeDashboardUrl(c.brazeCampaignId)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary" 
                style={{
                  flex: 1.2,
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
                title={c.brazeCampaignId ? "Open Campaign Editor in Braze" : "Open Braze Campaign Dashboard"}
              >
                <ExternalLink size={12} /> {c.brazeCampaignId ? 'Open Braze' : 'Braze Dash'}
              </a>

              <button 
                onClick={() => handleSync(c.id)}
                disabled={loadingLoadId === c.id || syncingId === c.id}
                className="btn btn-secondary" 
                style={{
                  flex: 1,
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  borderColor: 'var(--accent-blue)',
                  color: 'var(--accent-blue)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer'
                }}
                title="Simulate a connection status refresh"
              >
                <RefreshCw size={12} className={syncingId === c.id ? 'spin' : ''} /> {syncingId === c.id ? 'Refreshing...' : 'Refresh Status'}
              </button>
              <button 
                onClick={() => handleDelete(c.id)}
                className="btn btn-secondary" 
                style={{
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  borderColor: 'var(--error)',
                  color: 'var(--error)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer'
                }}
                title="Delete Campaign"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QA REPORT MODAL */}
      {reportModalCampaign && (
        <div 
          className="library-report-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 8, 15, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div 
            className="library-report-modal-content"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '2.5rem 2rem 2rem 2rem',
              borderRadius: 'var(--border-radius-lg)',
              position: 'relative',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
          >
            <button 
              onClick={() => setReportModalCampaign(null)}
              className="print-report-only-hide"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              x
            </button>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Saved QA Audit Report
              </span>
              <h3 style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {reportModalCampaign.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Braze ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{reportModalCampaign.brazeCampaignId || 'None'}</code> · Version: {reportModalCampaign.version}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }} className="settings-grid">
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>QA Score</span>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: reportModalCampaign.savedAudit.score >= 90 ? 'var(--success)' : reportModalCampaign.savedAudit.score >= 70 ? 'var(--warning)' : 'var(--error)' }}>
                  {reportModalCampaign.savedAudit.score}/100
                </span>
                <span className={`readiness-pill ${reportModalCampaign.savedApproval?.status === 'approved' ? 'approved' : reportModalCampaign.savedAudit.score >= 90 ? 'ready-for-approval' : 'needs-review'}`} style={{ fontSize: '0.65rem' }}>
                  {reportModalCampaign.savedApproval?.status === 'approved' ? 'Approved' : 'Pending Review'}
                </span>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h5 style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Review Log</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Reviewer:</strong> {reportModalCampaign.savedApproval?.reviewer || 'Not assigned'}</div>
                  <div><strong>Date:</strong> {reportModalCampaign.savedApproval?.approvedAt ? new Date(reportModalCampaign.savedApproval.approvedAt).toLocaleString() : 'Never'}</div>
                  <div><strong>Decision note:</strong> <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic', fontSize: '0.78rem' }}>&quot;{reportModalCampaign.savedApproval?.decisionNote || 'No notes left.'}&quot;</p></div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Saved Audit Findings ({reportModalCampaign.savedAudit.findings?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {(!reportModalCampaign.savedAudit.findings || reportModalCampaign.savedAudit.findings.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
                    No findings were recorded. The campaign had a clean pass.
                  </p>
                )}
                {reportModalCampaign.savedAudit.findings?.map((item, index) => (
                  <div key={index} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className={`severity-label ${item.severity}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>{item.severity}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                    </div>
                    {item.evidence && <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.2rem' }}><strong>Evidence:</strong> {item.evidence}</div>}
                    {item.remediation && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><strong>Remediation:</strong> {item.remediation}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }} className="print-report-only-hide">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => handleCopyMarkdownReport(reportModalCampaign)}
                style={{ flex: 1, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '0.45rem 0.6rem', fontSize: '0.78rem' }}
              >
                Copy Markdown
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => handlePrintReport(reportModalCampaign)}
                style={{ flex: 1, borderColor: 'var(--success)', color: 'var(--success)', cursor: 'pointer', padding: '0.45rem 0.6rem', fontSize: '0.78rem' }}
              >
                Print / Save PDF
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setReportModalCampaign(null)}
                style={{ flex: 1, cursor: 'pointer', padding: '0.45rem 0.6rem', fontSize: '0.78rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
