import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Link, Shield, Code, CheckSquare, Sparkles } from 'lucide-react';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast } from '../utils/validators';

export default function TechnicalAuditor({ 
  brazeHtml, 
  subjectLine, 
  spamAuditResults,
  isAuditing,
  onRunAudit 
}) {
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Compute local non-AI audits synchronously
  const liquidErrors = validateLiquidSyntax(brazeHtml);
  const linkIssues = auditHtmlLinks(brazeHtml);
  const contrastIssues = checkWcagContrast(brazeHtml);
  
  // Combine all alerts into one structured list
  const spamTriggers = spamAuditResults?.spamTriggers || [];
  const spamScore = spamAuditResults?.spamScore !== undefined ? spamAuditResults.spamScore : 100;

  const allAlerts = [
    ...liquidErrors.map(e => ({ ...e, category: 'Liquid Syntax' })),
    ...linkIssues.map(e => ({ ...e, category: 'Link Health' })),
    ...contrastIssues.map(e => ({ ...e, category: 'WCAG Contrast' })),
    ...spamTriggers.map(e => ({ ...e, category: 'Deliverability', type: 'spam' }))
  ];

  const filteredAlerts = allAlerts.filter(alert => {
    if (filterSeverity === 'all') return true;
    return alert.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  const getSeverityBadge = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <span className="audit-severity-tag severity-high">High</span>;
      case 'medium':
        return <span className="audit-severity-tag severity-medium">Medium</span>;
      case 'low':
        return <span className="audit-severity-tag severity-low">Low</span>;
      default:
        return <span className="audit-severity-tag severity-low">{severity}</span>;
    }
  };

  // Image-to-Text ratio analysis (deliverability rule of thumb: >60% text, <40% images)
  const imageCount = (brazeHtml.match(/<img\b/gi) || []).length;
  const rawTextLength = brazeHtml ? brazeHtml.replace(/<[^>]*>/g, '').trim().length : 0;
  
  let ratioStatus = 'Good';
  let ratioColor = 'var(--success)';
  if (imageCount > 0 && rawTextLength < 500) {
    ratioStatus = 'High Image Ratio';
    ratioColor = 'var(--warning)';
  } else if (imageCount > 5 && rawTextLength < 1000) {
    ratioStatus = 'Critical Ratio';
    ratioColor = 'var(--error)';
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Left Side Panel: Technical KPI cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Deliverability Status */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Deliverability</h4>
              <Shield size={20} style={{ color: spamScore >= 90 ? 'var(--success)' : 'var(--warning)' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: spamScore >= 90 ? 'var(--success)' : spamScore >= 70 ? 'var(--warning)' : 'var(--error)' }}>
                {spamScore}/100
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Spam Filter Score</span>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Analyzes words and exclamation counts to ensure inbox delivery rather than junk folder sorting.
            </p>
          </div>

          {/* Code Quality Card */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Code Execution</h4>
              <Code size={20} style={{ color: liquidErrors.length === 0 ? 'var(--success)' : 'var(--error)' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: liquidErrors.length === 0 ? 'var(--success)' : 'var(--error)' }}>
                {liquidErrors.length}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Liquid Parse Warning(s)</span>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Checks balanced delimiters, syntax structures, and unclosed tags that cause compilation failures.
            </p>
          </div>

          {/* Image & Text Stats */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Deliverability Ratios</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Image Tags (`&lt;img&gt;`):</span>
                <strong style={{ color: '#fff' }}>{imageCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Raw Copy Length:</span>
                <strong style={{ color: '#fff' }}>{rawTextLength} chars</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Text-to-Image Balance:</span>
                <strong style={{ color: ratioColor }}>{ratioStatus}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Panel: Complete audit log table */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Technical Issues Tracker</h3>
            
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setFilterSeverity('all')}
                className={`sub-tab ${filterSeverity === 'all' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                All
              </button>
              <button 
                onClick={() => setFilterSeverity('high')}
                className={`sub-tab ${filterSeverity === 'high' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                High
              </button>
              <button 
                onClick={() => setFilterSeverity('medium')}
                className={`sub-tab ${filterSeverity === 'medium' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Med
              </button>
              <button 
                onClick={() => setFilterSeverity('low')}
                className={`sub-tab ${filterSeverity === 'low' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Low
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px' }}>
            {filteredAlerts.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <p>No active issues found matching your selection!</p>
              </div>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Issue / Item</th>
                    <th>Severity</th>
                    <th>Audit Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '500', color: 'var(--accent-cyan)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {alert.category}
                      </td>
                      <td style={{ fontWeight: '600', color: '#fff', fontSize: '0.85rem' }}>
                        {alert.item || alert.phrase || 'Trigger Phrase'}
                      </td>
                      <td>
                        {getSeverityBadge(alert.severity)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {alert.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>
              Total Audited Elements: {imageCount + linkIssues.length + contrastIssues.length + liquidErrors.length}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              WCAG Contrast Min: 4.5:1 <CheckSquare size={12} style={{ color: 'var(--success)' }} />
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
