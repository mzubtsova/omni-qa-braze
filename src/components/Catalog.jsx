import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, CloudLightning, FileEdit } from 'lucide-react';

const SEED_CAMPAIGNS = [
  {
    id: '1',
    name: 'Dairy Queen Welcome Lifecycle',
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

export default function Catalog({ 
  onLoadCampaign,
  currentCampaignState
}) {
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [loadingLoadId, setLoadingLoadId] = useState(null);

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

  const handleCreateFromWorkspace = (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const newCampaign = {
      id: Date.now().toString(),
      name: newCampaignName,
      channel: 'email', // default primary
      version: 'v1.0',
      status: 'Draft',
      lastSynced: 'Never',
      ...currentCampaignState // Inject all active HTML/Push/SMS workspace values
    };

    const updated = [newCampaign, ...campaigns];
    saveCatalog(updated);
    setNewCampaignName('');
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
        
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Save Current Workspace Template
        </button>
      </div>

      {/* Save Campaign Form */}
      {showAddForm && (
        <form onSubmit={handleCreateFromWorkspace} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.02)' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CloudLightning size={16} style={{ color: 'var(--accent-cyan)' }} />
            Save Workspace Template to Catalog Database
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="form-input" 
              required
              placeholder="e.g. Blizzard BOGO Fall Campaign" 
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              style={{ flex: 1, minWidth: '240px' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Save Template</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            * This grabs the current HTML, Push notify copy, SMS copy, subject line, and IAM layout parameters currently loaded in your editor workspace.
          </p>
        </form>
      )}

      {/* Catalog Grid */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="diagnostics-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '1rem' }}>Campaign Name</th>
              <th style={{ padding: '1rem' }}>Version</th>
              <th style={{ padding: '1rem' }}>Sync Status</th>
              <th style={{ padding: '1rem' }}>Last Synced</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {c.channel === 'email' ? '✉️ Email' : c.channel === 'push' ? '📱 Push' : c.channel === 'sms' ? '💬 SMS' : '✨ In-App'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{c.version}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    ...getStatusStyle(c.status)
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.lastSynced}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleLoad(c)}
                      disabled={loadingLoadId === c.id || syncingId === c.id}
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Load into Editor"
                    >
                      <FileEdit size={12} className={loadingLoadId === c.id ? 'spin' : ''} /> {loadingLoadId === c.id ? '🚚 Loading...' : 'Load'}
                    </button>
                    <button 
                      onClick={() => handleSync(c.id)}
                      className="btn btn-secondary" 
                      disabled={loadingLoadId === c.id || syncingId === c.id}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                      title="Simulate Braze API Sync"
                    >
                      <RefreshCw size={12} className={syncingId === c.id ? 'spin' : ''} /> {syncingId === c.id ? '🚀 Syncing...' : 'Sync API'}
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                      title="Delete Campaign"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
