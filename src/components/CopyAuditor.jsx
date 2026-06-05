import { Info, Sparkles, CheckCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function CopyAuditor({ 
  figmaTexts, 
  setFigmaTexts, 
  subjectLine, 
  setSubjectLine, 
  brazeHtml, 
  setBrazeHtml,
  auditResults,
  isAuditing,
  onRunAudit
}) {
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

          <button 
            className="btn btn-primary" 
            onClick={() => onRunAudit(undefined, { brazeHtml, subjectLine, figmaTexts })}
            disabled={isAuditing}
            style={{ width: '100%' }}
          >
            {isAuditing ? 'Auditing Copy...' : 'Analyze & Compare Copy'}
          </button>
        </div>

        {/* Right Side: Copy Audit Log & Recommendations */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '680px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Sync & Discrepancies Log</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Powered by <Sparkles size={12} style={{ color: 'var(--accent-cyan)' }} /> Gemini 3.5
            </span>
          </div>

          {/* Copy Mismatches list */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
              Detected Text Discrepancies
            </h4>
            
            {(!auditResults || !auditResults.mismatches || auditResults.mismatches.length === 0) ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <p>No major text mismatches detected. Figma design copy aligns with campaign HTML!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {auditResults.mismatches.map((item, index) => (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className={`audit-severity-tag ${getSeverityClass(item.severity)}`}>
                        {item.severity} severity
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>FIGMA DESIGN MOCK:</span>
                        <span style={{ fontStyle: 'italic' }}>&ldquo;{item.figmaText}&rdquo;</span>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>BRAZE HTML / SUBJECT:</span>
                        <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>&ldquo;{item.brazeText}&rdquo;</span>
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

        </div>

      </div>
    </div>
  );
}
