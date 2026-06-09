import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, CloudLightning, FileEdit, ExternalLink } from 'lucide-react';

const SEED_CAMPAIGNS = [
  {
    id: '1',
    name: 'Dairy Queen Welcome Lifecycle',
    brazeCampaignId: '65a2d8f9b1c0e3a4f5d6c7b8',
    channel: 'email',
    version: 'v1.4',
    status: 'Live',
    lastSynced: '2 days ago',
    subjectLine: 'Get a FREE Blizzard Ice Cream! 🍦 Alert',
    brazeHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dairy Queen Blizzard Welcome</title>
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
      <h1 style="margin: 0; font-size: 24px;">Dairy Queen Welcome</h1>
    </div>
    <div class="content">
      <h2>Welcome, {{ user.first_name | default: 'Valued Customer' }}!</h2>
      <p>We loaded a special reward into your account to say thanks for being an app member.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/redeem" style="background-color: #f43f5e; color: #ffffff;" class="btn">Claim Blizzard Offer</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Dairy Queen. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`,
    pushBody: 'Get a FREE Small Blizzard! 🍦 Valid for 14 days. Claim your exclusive app reward today.',
    smsBody: 'Dairy Queen: Welcome {{ user.first_name | default: \'Valued Customer\' }}! Claim your free Blizzard here: http://example.com/redeem',
    iamHeader: 'Get a FREE Small Blizzard',
    iamBody: 'Enjoy soft serve ice cream blended with your favorite toppings! Valid for 14 days.',
    iamButtonText: 'Claim Offer',
    iamButtonLink: 'http://example.com/redeem'
  },
  {
    id: '2',
    name: 'Blizzard Summer Points Boost',
    brazeCampaignId: '65b3e9a0c2d1f4b5e6f7d8a9',
    channel: 'push',
    version: 'v2.1',
    status: 'Out of Sync',
    lastSynced: '1 week ago',
    subjectLine: 'Summer Blizzard Madness is here!',
    brazeHtml: '<h1>Summer Blizzard Points Blast!</h1>',
    pushBody: 'Get double points on all Blizzards today! 🍦 Open the app to check your loyalty tier.',
    smsBody: 'Dairy Queen: Summer is here! Get double points on all Blizzards today. Order in-app now!',
    iamHeader: 'Double Points Today!',
    iamBody: 'Order any Blizzard today and get double points towards your next reward.',
    iamButtonText: 'Order Now',
    iamButtonLink: 'http://example.com/order'
  },
  {
    id: '3',
    name: 'QSR App Download Campaign',
    brazeCampaignId: '65c4f0b1d3e2a5c6f7a8b9c0',
    channel: 'iam',
    version: 'v1.0',
    status: 'Draft',
    lastSynced: '3 days ago',
    subjectLine: 'Download the DQ App and get free treats',
    brazeHtml: '<h1>Get rewards in the Dairy Queen App</h1>',
    pushBody: 'Sign up in the DQ app to lock in point rewards.',
    smsBody: 'Dairy Queen: Download the app for free rewards: http://example.com/download',
    iamHeader: 'Get the App',
    iamBody: 'Receive rewards on your birthday, unlock point multipliers, and get quick ordering.',
    iamButtonText: 'Get App',
    iamButtonLink: 'http://example.com/download'
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
  currentCampaignState
}) {
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignId, setNewCampaignId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [loadingLoadId, setLoadingLoadId] = useState(null);
  
  const [editingIdField, setEditingIdField] = useState(null);
  const [tempCampaignId, setTempCampaignId] = useState('');

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
      ...currentCampaignState // Inject all active HTML/Push/SMS workspace values
    };

    const updated = [newCampaign, ...campaigns];
    saveCatalog(updated);
    setNewCampaignName('');
    setNewCampaignId('');
    setShowAddForm(false);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Braze Campaign Catalog & Sync Manager</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Simulate staging, versioning, and deploying campaign assets directly via Braze API endpoints.
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
        <form onSubmit={handleCreateFromWorkspace} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.02)' }}>
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
                placeholder="e.g. Blizzard BOGO Fall Campaign" 
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
      <div className="catalog-grid">
        {campaigns.map((c) => (
          <div key={c.id} className="panel" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {c.channel === 'email' ? '✉️ Email' : c.channel === 'push' ? '📱 Push' : c.channel === 'sms' ? '💬 SMS' : '✨ In-App'}
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
                title="Simulate Braze API Sync"
              >
                <RefreshCw size={12} className={syncingId === c.id ? 'spin' : ''} /> {syncingId === c.id ? 'Syncing...' : 'Sync API'}
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

    </div>
  );
}
