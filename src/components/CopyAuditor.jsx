import { useState } from 'react';
import { Info, Sparkles, CheckCircle } from 'lucide-react';
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
  onRunAudit
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [editorChannel, setEditorChannel] = useState('email'); // 'email', 'push', 'sms', 'iam'

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
            <label className="form-label">Figma Text Layers (one per line)</label>
            <textarea 
              className="form-textarea" 
              value={figmaTexts.join('\n')}
              onChange={handleFigmaChange}
              placeholder="Enter text layers as they appear in the Figma mockup..."
              style={{ flex: 1, minHeight: '120px', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Channel selector tabs inside Copy Auditor */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>{item.detail1}</span>
                        <span style={{ fontStyle: 'italic', wordBreak: 'break-all' }}>&ldquo;{item.value1}&rdquo;</span>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
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

        </div>

      </div>
    </div>
  );
}
