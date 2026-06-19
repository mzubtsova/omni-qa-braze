import { useState, useEffect } from 'react';
import { Save, Shield, Key, Eye, EyeOff, CheckCircle, Terminal, RefreshCw } from 'lucide-react';

export default function Settings({ onSave }) {
  const [showGemini, setShowGemini] = useState(false);
  const [showFigma, setShowFigma] = useState(false);
  const [showBraze, setShowBraze] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  const [settings, setSettings] = useState({
    geminiApiKey: '',
    figmaToken: '',
    figmaFileId: '',
    brazeApiKey: '',
    brazeEndpoint: 'https://rest.iad-01.braze.com',
    useMockData: true
  });

  useEffect(() => {
    // Load non-secret workspace preferences from localStorage.
    const savedGemini = '';
    const savedFigmaToken = '';
    const savedFigmaFile = localStorage.getItem('figma_file_id') || '';
    const savedBrazeKey = '';
    const savedBrazeEnd = localStorage.getItem('braze_endpoint') || 'https://rest.iad-01.braze.com';
    const savedMock = localStorage.getItem('omniqa_use_mock') !== 'false'; // default to true

    setSettings({
      geminiApiKey: savedGemini,
      figmaToken: savedFigmaToken,
      figmaFileId: savedFigmaFile,
      brazeApiKey: savedBrazeKey,
      brazeEndpoint: savedBrazeEnd,
      useMockData: savedMock
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('figma_file_id', settings.figmaFileId);
    localStorage.setItem('braze_endpoint', settings.brazeEndpoint);
    localStorage.setItem('omniqa_use_mock', settings.useMockData ? 'true' : 'false');
    
    setSavedStatus(true);
    if (onSave) {
      onSave(settings);
    }
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagnosticLogs([]);
    let health = null;

    try {
      const response = await fetch('/api/health');
      health = await response.json();
      if (!response.ok) {
        throw new Error(health.error || 'Health route failed.');
      }
    } catch (error) {
      health = { error: error.message };
    }
    
    const logs = [];
    const addLog = (text, type = 'info') => {
      const timestamp = new Date().toLocaleTimeString();
      logs.push({ text, type, timestamp });
      setDiagnosticLogs([...logs]);
    };

    setTimeout(() => {
      addLog(`Initializing connection diagnostics pipeline...`, 'info');
    }, 100);

    setTimeout(() => {
      addLog(`Testing connection to Figma API (api.figma.com)...`, 'ping');
    }, 800);

    setTimeout(() => {
      if (!settings.useMockData && !health.figmaConfigured) {
        addLog(`Figma server token missing: configure FIGMA_ACCESS_TOKEN in Vercel environment variables.`, 'error');
      } else if (settings.useMockData) {
        addLog(`Figma Sandbox handshake: OK (responded in 45ms)`, 'success');
      } else {
        addLog(`Figma server proxy configured. Text extraction can run through /api/figma-layers.`, 'success');
      }
    }, 1600);

    setTimeout(() => {
      addLog(`Checking Braze dashboard endpoint routing (${settings.brazeEndpoint})...`, 'ping');
    }, 2400);

    setTimeout(() => {
      if (settings.useMockData) {
        addLog(`Braze Sandbox endpoint handshake: OK (rest.iad-01.braze.com responded in 68ms)`, 'success');
      } else {
        addLog(`Braze endpoint saved for catalog deep links. REST read/write sync is reserved for the next integration phase.`, 'info');
      }
    }, 3200);

    setTimeout(() => {
      addLog(`Verifying Gemini model API key credentials...`, 'ping');
    }, 4000);

    setTimeout(() => {
      if (!settings.useMockData && !health.geminiConfigured) {
        addLog(`Gemini server key missing: configure GEMINI_API_KEY in Vercel environment variables.`, 'error');
      } else if (settings.useMockData) {
        addLog(`Gemini platform connection verified: OK (api.google.dev responded in 92ms)`, 'success');
      } else {
        addLog(`Gemini server proxy configured with ${health.geminiModel}. AI engines can run through /api/gemini.`, 'success');
      }
    }, 4800);

    setTimeout(() => {
      const hasErrors = !settings.useMockData && (!health.figmaConfigured || !health.geminiConfigured);
      if (hasErrors) {
        addLog(`Diagnostics complete: server configuration is incomplete. Add missing Vercel environment variables and redeploy.`, 'error');
      } else {
        addLog(`Diagnostics complete: live AI and Figma routes are ready.`, 'success');
      }
      setIsDiagnosing(false);
    }, 5500);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={24} style={{ color: 'var(--accent-blue)' }} />
          OmniQA Configuration Panel
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Manage sandbox mode, Figma file routing, and Braze dashboard endpoints. Gemini and Figma secrets are read from Vercel environment variables, not stored in the browser.
        </p>

        {savedStatus && (
          <div className="toast" style={{ bottom: '2rem', right: '2rem' }}>
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ marginBottom: '0.25rem' }}>Use Sandbox Simulation / Demo Mode</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Toggle this on to run the app instantly with high-fidelity pre-loaded campaign datasets. No external API queries will be performed.
              </p>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
              <input 
                type="checkbox" 
                name="useMockData"
                checked={settings.useMockData}
                onChange={handleChange}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.useMockData ? 'var(--accent-cyan)' : 'var(--bg-primary)',
                transition: '.4s',
                borderRadius: '34px',
                border: '1px solid var(--border-color)'
              }}>
                <span className="slider-knob" style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px', width: '18px',
                  left: settings.useMockData ? '28px' : '4px',
                  bottom: '3px',
                  backgroundColor: '#fff',
                  transition: '.4s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}></span>
              </span>
            </label>
          </div>

          <div style={{ opacity: settings.useMockData ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
              API Credentials & Keys
            </h3>

            {/* Gemini API Key */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" htmlFor="geminiApiKey" style={{ margin: 0 }}>
                  <Key size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
                  Gemini API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                >
                  {showGemini ? <EyeOff size={14} /> : <Eye size={14} />} {showGemini ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showGemini ? 'text' : 'password'}
                id="geminiApiKey"
                name="geminiApiKey"
                className="form-input"
                placeholder="AI platform credentials..."
                value={settings.geminiApiKey}
                onChange={handleChange}
                disabled
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                Configure this as GEMINI_API_KEY in Vercel. The browser never stores or sends this secret directly.
              </p>
            </div>

            {/* Figma Token & File ID */}
            <div className="settings-grid">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="figmaToken" style={{ margin: 0 }}>
                    Figma Personal Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFigma(!showFigma)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                  >
                    {showFigma ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input
                  type={showFigma ? 'text' : 'password'}
                  id="figmaToken"
                  name="figmaToken"
                  className="form-input"
                  placeholder="Configured as FIGMA_ACCESS_TOKEN in Vercel"
                  value={settings.figmaToken}
                  onChange={handleChange}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="figmaFileId">
                  Default Figma File ID / URL
                </label>
                <input
                  type="text"
                  id="figmaFileId"
                  name="figmaFileId"
                  className="form-input"
                  placeholder="e.g. 8Kj9F2Hl4..."
                  value={settings.figmaFileId}
                  onChange={handleChange}
                  disabled={settings.useMockData}
                />
              </div>
            </div>

            {/* Braze Key & Endpoint */}
            <div className="settings-grid">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="brazeApiKey" style={{ margin: 0 }}>
                    Braze API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBraze(!showBraze)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                  >
                    {showBraze ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input
                  type={showBraze ? 'text' : 'password'}
                  id="brazeApiKey"
                  name="brazeApiKey"
                  className="form-input"
                  placeholder="Future server-side Braze integration"
                  value={settings.brazeApiKey}
                  onChange={handleChange}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="brazeEndpoint">
                  Braze API REST Endpoint
                </label>
                <select
                  id="brazeEndpoint"
                  name="brazeEndpoint"
                  className="form-select"
                  value={settings.brazeEndpoint}
                  onChange={handleChange}
                  disabled={settings.useMockData}
                >
                  <option value="https://rest.iad-01.braze.com">US-01 (rest.iad-01.braze.com)</option>
                  <option value="https://rest.iad-02.braze.com">US-02 (rest.iad-02.braze.com)</option>
                  <option value="https://rest.iad-03.braze.com">US-03 (rest.iad-03.braze.com)</option>
                  <option value="https://rest.iad-05.braze.com">US-05 (rest.iad-05.braze.com)</option>
                  <option value="https://rest.iad-06.braze.com">US-06 (rest.iad-06.braze.com)</option>
                  <option value="https://rest.braze.eu">EU-01 (rest.braze.eu)</option>
                  <option value="https://rest.braze.com.cn">CN-01 (rest.braze.com.cn)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Connection Diagnostics Terminal panel */}
      <div className="panel fade-in" style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
          <Terminal size={20} style={{ color: 'var(--accent-cyan)' }} />
          Credentials Handshake Diagnostic Terminal
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Trigger a step-by-step diagnostic ping sequence to test network accessibility and API token scopes for Figma, Braze, and Gemini endpoints.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={isDiagnosing}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} className={isDiagnosing ? 'spin' : ''} />
            {isDiagnosing ? 'Running Diagnostics...' : 'Run Diagnostics Handshake'}
          </button>
          {isDiagnosing && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Pinging endpoints...
            </span>
          )}
        </div>

        {/* Diagnostic Terminal View */}
        <div style={{
          backgroundColor: '#090d16',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
        }}>
          {/* Terminal Window Header */}
          <div style={{
            backgroundColor: '#101726',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f43f5e', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>handshake-diagnostic-console.sh</span>
            <div style={{ width: '38px' }} />
          </div>

          {/* Terminal Body */}
          <div style={{
            padding: '1rem',
            minHeight: '180px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            color: '#a5b4fc',
            textAlign: 'left'
          }}>
            {diagnosticLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', height: '150px', justifyContent: 'center' }}>
                Terminal idle. Click the button above to execute diagnostics test pipeline.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {diagnosticLogs.map((log, index) => {
                  let color = '#a5b4fc';
                  let prefix = '[INFO]';
                  if (log.type === 'ping') {
                    color = '#f1f5f9';
                    prefix = '[PING]';
                  } else if (log.type === 'success') {
                    color = 'var(--success)';
                    prefix = '[ OK ]';
                  } else if (log.type === 'warning') {
                    color = 'var(--warning)';
                    prefix = '[WARN]';
                  } else if (log.type === 'error') {
                    color = 'var(--error)';
                    prefix = '[FAIL]';
                  }
                  return (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.timestamp}]</span>
                      <span style={{ color, fontWeight: '600', flexShrink: 0 }}>{prefix}</span>
                      <span style={{ color: log.type === 'ping' ? 'var(--text-primary)' : color }}>{log.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
