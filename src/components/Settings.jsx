import { useState, useEffect } from 'react';
import { Save, Shield, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Settings({ onSave }) {
  const [showGemini, setShowGemini] = useState(false);
  const [showFigma, setShowFigma] = useState(false);
  const [showBraze, setShowBraze] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  const [settings, setSettings] = useState({
    geminiApiKey: '',
    figmaToken: '',
    figmaFileId: '',
    brazeApiKey: '',
    brazeEndpoint: 'https://rest.iad-01.braze.com',
    useMockData: true
  });

  useEffect(() => {
    // Load credentials from localStorage
    const savedGemini = localStorage.getItem('gemini_api_key') || '';
    const savedFigmaToken = localStorage.getItem('figma_token') || '';
    const savedFigmaFile = localStorage.getItem('figma_file_id') || '';
    const savedBrazeKey = localStorage.getItem('braze_api_key') || '';
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
    localStorage.setItem('gemini_api_key', settings.geminiApiKey);
    localStorage.setItem('figma_token', settings.figmaToken);
    localStorage.setItem('figma_file_id', settings.figmaFileId);
    localStorage.setItem('braze_api_key', settings.brazeApiKey);
    localStorage.setItem('braze_endpoint', settings.brazeEndpoint);
    localStorage.setItem('omniqa_use_mock', settings.useMockData ? 'true' : 'false');
    
    setSavedStatus(true);
    if (onSave) {
      onSave(settings);
    }
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={24} style={{ color: 'var(--accent-blue)' }} />
          OmniQA Configuration Panel
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Manage your Figma design tokens, Braze endpoints, and Gemini AI credentials. Keys are saved securely in your browser&apos;s local storage and never sent to external servers.
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
                disabled={settings.useMockData}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                Shares credentials with other apps in the workspace. Used to run AI copy-sync checks and deliverability scoring.
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
                  placeholder="figd_..."
                  value={settings.figmaToken}
                  onChange={handleChange}
                  disabled={settings.useMockData}
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
                  placeholder="Bearer api_..."
                  value={settings.brazeApiKey}
                  onChange={handleChange}
                  disabled={settings.useMockData}
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
    </div>
  );
}
