import { useState, useRef } from 'react';
import { Info, Sparkles, CheckCircle, RefreshCw, Layers, Monitor, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast } from '../utils/validators';

export default function CopyAuditor({ 
  figmaTexts, 
  setFigmaTexts, 
  subjectLine, 
  setSubjectLine, 
  brazeHtml, 
  setBrazeHtml,
  pushBody,
  setPushBody,
  smsBody,
  setSmsBody,
  iamHeader,
  setIamHeader,
  iamBody,
  setIamBody,
  iamButtonText,
  setIamButtonText,
  iamButtonLink,
  setIamButtonLink,
  auditResults,
  spamAuditResults,
  isAuditing,
  onRunAudit,
  onSyncFigma,
  figmaSyncLoading
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [editorChannel, setEditorChannel] = useState('email'); // 'email', 'push', 'sms', 'iam'
  const [isExtensionView, setIsExtensionView] = useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editorInstance) => {
    editorRef.current = editorInstance;
  };

  const highlightLine = (line) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleFigmaChange = (e) => {
    const lines = e.target.value.split('\n');
    setFigmaTexts(lines);
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-low';
    }
  };

  // 1. Calculate active campaign issue items locally on the fly
  const htmlToAudit = brazeHtml || '';
  const liquidErrors = validateLiquidSyntax(htmlToAudit);
  const linkIssues = auditHtmlLinks(htmlToAudit);
  const contrastIssues = checkWcagContrast(htmlToAudit);
  const copyMismatches = auditResults?.mismatches?.filter(m => m.brazeText !== 'Dark Mode Contrast Risk' && m.brazeText !== 'Low Color Contrast') || [];
  const spamTriggers = spamAuditResults?.spamTriggers || [];

  // 2. Build the unified diagnostic list
  const allIssues = [];

  // Copy sync
  copyMismatches.forEach(m => {
    allIssues.push({
      category: 'copy',
      severity: m.severity || 'low',
      title: 'Copy Sync Mismatch',
      detail1: 'Figma Design copy:',
      value1: m.figmaText,
      detail2: 'Braze HTML / Subject:',
      value2: m.brazeText,
      message: m.message
    });
  });

  // WCAG Contrast & accessibility
  contrastIssues.forEach(c => {
    const isDarkModeRisk = c.item === 'Dark Mode Risk';
    allIssues.push({
      category: 'contrast',
      severity: c.severity || 'medium',
      title: c.item,
      detail1: 'Target element tag:',
      value1: isDarkModeRisk ? 'Text Element (No BG)' : 'Inline Styled Button',
      detail2: 'Contrast alert context:',
      value2: isDarkModeRisk ? 'Hardcoded Dark Value' : 'Low Contrast Ratio',
      message: c.message
    });
  });

  // Link crawler
  linkIssues.forEach(l => {
    allIssues.push({
      category: 'link',
      severity: l.severity || 'medium',
      title: l.item,
      detail1: 'Crawl target url:',
      value1: l.message.match(/"([^"]*)"/)?.[1] || 'href destination',
      detail2: 'parameter context:',
      value2: l.item === 'Missing Tracking' ? 'UTM parameters check' : 'Broken URL check',
      message: l.message
    });
  });

  // Liquid tags
  liquidErrors.forEach(err => {
    allIssues.push({
      category: 'liquid',
      severity: err.severity || 'high',
      title: err.item,
      detail1: 'Delimiter logic error:',
      value1: err.item,
      detail2: 'diagnostic status:',
      value2: 'Unbalanced tags',
      message: err.message
    });
  });

  // Spam checks
  spamTriggers.forEach(s => {
    allIssues.push({
      category: 'spam',
      severity: s.severity || 'low',
      title: 'Spam Filter Trigger',
      detail1: 'Flagged word/phrase:',
      value1: s.phrase,
      detail2: 'deliverability advice:',
      value2: 'Firewall Warning',
      message: s.message
    });
  });

  // Calculate Liquid conditional logic tags
  const liquidLogicTags = [];
  const htmlLines = (brazeHtml || '').split('\n');
  htmlLines.forEach((lineText, idx) => {
    const ifMatch = lineText.match(/\{%\s*if\s+([^%]+)%\}/);
    if (ifMatch) {
      liquidLogicTags.push({
        line: idx + 1,
        type: 'if',
        expression: ifMatch[1].trim(),
        text: `If: ${ifMatch[1].trim()}`
      });
    }
    const elseIfMatch = lineText.match(/\{%\s*elsif\s+([^%]+)%\}/);
    if (elseIfMatch) {
      liquidLogicTags.push({
        line: idx + 1,
        type: 'elsif',
        expression: elseIfMatch[1].trim(),
        text: `Elsif: ${elseIfMatch[1].trim()}`
      });
    }
    const elseMatch = lineText.match(/\{%\s*else\s*%\}/);
    if (elseMatch) {
      liquidLogicTags.push({
        line: idx + 1,
        type: 'else',
        expression: 'else',
        text: 'Else'
      });
    }
    const endifMatch = lineText.match(/\{%\s*endif\s*%\}/);
    if (endifMatch) {
      liquidLogicTags.push({
        line: idx + 1,
        type: 'endif',
        expression: 'endif',
        text: 'Endif'
      });
    }
  });

  // 3. Filters & Counters
  const counts = {
    all: allIssues.length,
    copy: allIssues.filter(i => i.category === 'copy').length,
    contrast: allIssues.filter(i => i.category === 'contrast').length,
    link: allIssues.filter(i => i.category === 'link').length,
    liquid: allIssues.filter(i => i.category === 'liquid').length,
    spam: allIssues.filter(i => i.category === 'spam').length
  };

  const filteredIssues = allIssues.filter(i => {
    if (activeFilter === 'all') return true;
    return i.category === activeFilter;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button 
          onClick={() => setIsExtensionView(!isExtensionView)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', width: 'auto' }}
        >
          <Monitor size={14} /> 
          {isExtensionView ? '🔌 Switch to Workspace View' : '🔌 Simulate Chrome Extension View'}
        </button>
      </div>

      {isExtensionView ? (
        /* CHROME BROWSER WINDOW SIMULATOR SHELL */
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '650px',
          animation: 'fadeIn 0.3s ease-out',
          marginBottom: '2rem'
        }}>
          {/* Browser Header Bar */}
          <div style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            userSelect: 'none'
          }}>
            {/* Window Controls */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            {/* Address Bar */}
            <div style={{
              background: '#0f172a',
              borderRadius: '6px',
              padding: '0.25rem 1rem',
              color: '#94a3b8',
              fontSize: '0.78rem',
              flex: 1,
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid #1e293b'
            }}>
              <span style={{ color: 'var(--success)' }}>🔒 https://</span>
              <span>dashboard.braze.com/campaigns/editor/blizzard_loyalty_promo</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>Chrome v120</span>
          </div>

          {/* Browser Body Split Pane */}
          <div className="extension-simulator-body" style={{ flex: 1, minHeight: '580px' }}>
            
            {/* Left 60%: Simulated Native Braze Email Campaign Builder */}
            <div className="extension-simulator-left" style={{
              background: '#0f172a',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              borderRight: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ color: '#ffffff', margin: 0, fontSize: '0.95rem' }}>Simulated Braze HTML Campaign Builder</h4>
                  <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>Editing draft assets for QSR Blizzard BOGO campaign.</p>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#312e81', color: '#c084fc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                  Braze HTML v2
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Email Subject Line</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={subjectLine} 
                  onChange={(e) => setSubjectLine(e.target.value)}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.5rem' }}>Compose Campaign HTML</label>
                <div style={{ border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden', flex: 1 }}>
                  <Editor
                    height="320px"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={brazeHtml}
                    onChange={(val) => setBrazeHtml(val || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 16,
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right 40%: Floating OmniQA Extension Panel Side-Overlay */}
            <div className="extension-simulator-right" style={{
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '650px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
                  OmniQA Extension
                </h4>
                <span className="api-badge simulated" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>Live Side-Audit</span>
              </div>

              {/* Mini counter dials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.4rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--error)', fontWeight: '700', fontSize: '1.1rem' }}>{counts.liquid + counts.link}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Code/Link</div>
                </div>
                <div style={{ padding: '0.4rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '1.1rem' }}>{counts.copy}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Copy Diff</div>
                </div>
                <div style={{ padding: '0.4rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '1.1rem' }}>{counts.contrast}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Contrast</div>
                </div>
              </div>

              {/* Quick Issue Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {allIssues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <CheckCircle size={24} style={{ color: 'var(--success)', marginBottom: '0.4rem', display: 'inline-block' }} />
                    <p>All campaign assets 100% compliant!</p>
                  </div>
                ) : (
                  allIssues.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${item.severity === 'high' ? 'var(--error)' : item.severity === 'medium' ? 'var(--warning)' : 'var(--accent-blue)'}`,
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.severity}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.3' }}>{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* STANDARD DIAGNOSTICS LOG VIEW */
        <div className="split-view" style={{ marginBottom: '2rem' }}>
        
        {/* Left Side: Campaign Input Fields */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Campaign Data & Mock Source</h3>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Subject Line</label>
            <input 
              type="text" 
              className="form-input" 
              value={subjectLine} 
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="e.g. Free Blizzard Alert! 🍦"
            />
          </div>

          <div className="form-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Figma Text Layers (one per line)</label>
              <button 
                type="button"
                className="btn btn-secondary"
                disabled={figmaSyncLoading}
                onClick={onSyncFigma}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto' }}
              >
                <RefreshCw size={12} className={figmaSyncLoading ? 'spin' : ''} />
                {figmaSyncLoading ? 'Syncing...' : 'Sync Figma API'}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              value={figmaTexts.join('\n')}
              onChange={handleFigmaChange}
              placeholder="Enter text layers as they appear in the Figma mockup..."
              style={{ flex: 1, minHeight: '120px', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Channel selector tabs inside Copy Auditor */}
          <div className="copy-auditor-tabs">
            <button 
              type="button"
              onClick={() => setEditorChannel('email')}
              className={`sub-tab ${editorChannel === 'email' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.72rem' }}
            >
              ✉️ Email HTML
            </button>
            <button 
              type="button"
              onClick={() => setEditorChannel('push')}
              className={`sub-tab ${editorChannel === 'push' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.72rem' }}
            >
              📱 Push Copy
            </button>
            <button 
              type="button"
              onClick={() => setEditorChannel('sms')}
              className={`sub-tab ${editorChannel === 'sms' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.72rem' }}
            >
              💬 SMS Copy
            </button>
            <button 
              type="button"
              onClick={() => setEditorChannel('iam')}
              className={`sub-tab ${editorChannel === 'iam' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.72rem' }}
            >
              ✨ In-App (IAM)
            </button>
          </div>

          {editorChannel === 'email' && (
            <div className="form-group" style={{ margin: 0, flex: 2, display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Braze Campaign HTML (Monaco Editor)</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', flex: 1 }}>
                <Editor
                  height="350px"
                  defaultLanguage="html"
                  theme="vs-dark"
                  value={brazeHtml}
                  onChange={(val) => setBrazeHtml(val || '')}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 18,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 10, bottom: 10 }
                  }}
                />
              </div>
            </div>
          )}

          {editorChannel === 'push' && (
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
              <label className="form-label">Push Notification Body Copy</label>
              <textarea
                className="form-textarea"
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Enter push notification body copy..."
                style={{ flex: 1, minHeight: '200px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {editorChannel === 'sms' && (
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
              <label className="form-label">SMS Message Body Copy</label>
              <textarea
                className="form-textarea"
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Enter SMS message body copy..."
                style={{ flex: 1, minHeight: '200px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {editorChannel === 'iam' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '380px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">IAM Header Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={iamHeader} 
                  onChange={(e) => setIamHeader(e.target.value)}
                  placeholder="Enter In-App Message title..."
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">IAM Message Body</label>
                <textarea
                  className="form-textarea"
                  value={iamBody}
                  onChange={(e) => setIamBody(e.target.value)}
                  placeholder="Enter In-App Message body copy..."
                  style={{ minHeight: '100px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="settings-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">IAM Button Text</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={iamButtonText} 
                    onChange={(e) => setIamButtonText(e.target.value)}
                    placeholder="e.g. Claim Offer"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">IAM Button Redirect URL</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={iamButtonLink} 
                    onChange={(e) => setIamButtonLink(e.target.value)}
                    placeholder="e.g. http://..."
                  />
                </div>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            onClick={() => onRunAudit(undefined, { 
              brazeHtml, 
              subjectLine, 
              figmaTexts,
              pushBody,
              smsBody,
              iamHeader,
              iamBody,
              iamButtonText,
              iamButtonLink
            })}
            disabled={isAuditing}
            style={{ width: '100%' }}
          >
            {isAuditing ? 'Auditing Campaign...' : 'Analyze Campaign Assets'}
          </button>
        </div>

        {/* Right Side: Copy Audit Log & Recommendations */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '680px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Master Diagnostics & Audit Log</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Powered by <Sparkles size={12} style={{ color: 'var(--accent-cyan)' }} /> Gemini 3.5
            </span>
          </div>

          {/* Interactive filter tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveFilter('all')}
              className={`sub-tab ${activeFilter === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              📋 All ({counts.all})
            </button>
            <button 
              onClick={() => setActiveFilter('copy')}
              className={`sub-tab ${activeFilter === 'copy' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              ✍️ Copy ({counts.copy})
            </button>
            <button 
              onClick={() => setActiveFilter('contrast')}
              className={`sub-tab ${activeFilter === 'contrast' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              🎨 Contrast ({counts.contrast})
            </button>
            <button 
              onClick={() => setActiveFilter('link')}
              className={`sub-tab ${activeFilter === 'link' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              🔗 Links ({counts.link})
            </button>
            <button 
              onClick={() => setActiveFilter('liquid')}
              className={`sub-tab ${activeFilter === 'liquid' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              🚨 Liquid ({counts.liquid})
            </button>
            <button 
              onClick={() => setActiveFilter('spam')}
              className={`sub-tab ${activeFilter === 'spam' ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              🛡️ Spam ({counts.spam})
            </button>
          </div>

          {/* Copy Mismatches list */}
          <div>
            {filteredIssues.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem' }}>No campaign discrepancies detected in this category!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredIssues.map((item, index) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: 'rgba(255,255,255,0.01)', 
                      borderRadius: 'var(--border-radius-md)', 
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${item.severity === 'high' ? 'var(--error)' : item.severity === 'medium' ? 'var(--warning)' : 'var(--accent-blue)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.category === 'copy' ? '✍️ Copy Discrepancy' : 
                         item.category === 'contrast' ? '🎨 Contrast & Dark Mode' : 
                         item.category === 'link' ? '🔗 Link Health & UTMs' : 
                         item.category === 'liquid' ? '🚨 Liquid Syntax Error' : '🛡️ Deliverability Alert'}
                      </span>
                      <span className={`audit-severity-tag ${getSeverityClass(item.severity)}`}>
                        {item.severity} severity
                      </span>
                    </div>

                    <div className="mismatch-detail-grid" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>{item.detail1}</span>
                        <span style={{ fontStyle: 'italic', wordBreak: 'break-all' }}>&ldquo;{item.value1}&rdquo;</span>
                      </div>
                      <div className="mismatch-detail-coded">
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>{item.detail2}</span>
                        <span style={{ fontStyle: 'italic', color: 'var(--text-primary)', wordBreak: 'break-all' }}>&ldquo;{item.value2}&rdquo;</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy suggestions */}
          {activeFilter === 'copy' && (
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                Copywriting & Alignment Recommendations
              </h4>

              {(!auditResults || !auditResults.suggestions || auditResults.suggestions.length === 0) ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No optimization recommendations. Copy layout is clean.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {auditResults.suggestions.map((item, index) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '0.75rem 1rem', 
                        backgroundColor: 'rgba(6, 182, 212, 0.03)', 
                        borderRadius: 'var(--border-radius-md)', 
                        border: '1px solid rgba(6, 182, 212, 0.1)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Info size={16} style={{ color: 'var(--accent-cyan)', marginTop: '0.15rem', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>{item.context}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{item.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liquid Logic Debugger AST Widget */}
          {activeFilter === 'liquid' && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
                Liquid Logic AST Debugger (Interactive)
              </h4>
              
              {liquidLogicTags.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No Liquid conditional blocks detected in the HTML template.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Click any tag below to automatically reveal and focus the corresponding line in the Monaco Code Editor.
                  </p>
                  {liquidLogicTags.map((tag, idx) => (
                    <div 
                      key={idx}
                      onClick={() => highlightLine(tag.line)}
                      style={{ 
                        padding: '0.6rem 0.85rem', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="liquid-debug-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.35rem', borderRadius: '4px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          L{tag.line}
                        </span>
                        <code style={{ fontSize: '0.8rem', color: tag.type === 'if' || tag.type === 'elsif' ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: '600' }}>
                          {tag.text}
                        </code>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Play size={10} /> Focus Line
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      )}
    </div>
  );
}
