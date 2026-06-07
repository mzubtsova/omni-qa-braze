import { useState } from 'react';
import { CheckCircle, Shield, Code, CheckSquare, Sparkles, X } from 'lucide-react';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast } from '../utils/validators';

export default function TechnicalAuditor({ 
  brazeHtml, 
  setBrazeHtml,
  subjectLine,
  pushBody = '',
  smsBody = '',
  iamHeader = '',
  iamBody = '',
  iamButtonLink = '',
  setIamButtonLink,
  spamAuditResults,
  onRunAudit 
}) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Compute local non-AI audits synchronously
  const liquidErrors = [
    ...validateLiquidSyntax(brazeHtml),
    ...validateLiquidSyntax(subjectLine).map(e => ({ ...e, item: `Subject: ${e.item}` })),
    ...validateLiquidSyntax(pushBody).map(e => ({ ...e, item: `Push: ${e.item}` })),
    ...validateLiquidSyntax(smsBody).map(e => ({ ...e, item: `SMS: ${e.item}` })),
    ...validateLiquidSyntax(iamHeader).map(e => ({ ...e, item: `IAM Header: ${e.item}` })),
    ...validateLiquidSyntax(iamBody).map(e => ({ ...e, item: `IAM Body: ${e.item}` })),
  ];
  
  const linkIssues = auditHtmlLinks(brazeHtml);

  if (iamButtonLink) {
    const url = iamButtonLink.trim();
    const itemLabel = 'IAM Button Link';
    if (!url || url === '#' || url.toLowerCase().startsWith('javascript:')) {
      linkIssues.push({
        type: 'link',
        severity: 'high',
        item: itemLabel,
        message: `Found empty or dummy href ("${url}") on the In-App Message primary button.`
      });
    } else if (url.includes('example.com') || url.includes('placeholder.com')) {
      linkIssues.push({
        type: 'link',
        severity: 'medium',
        item: itemLabel,
        message: `Link points to a placeholder domain: "${url}"`
      });
    } else if (url.startsWith('http') && !url.includes('utm_source')) {
      linkIssues.push({
        type: 'link',
        severity: 'low',
        item: itemLabel,
        message: `Link lacks UTM campaign parameters (utm_source): "${url}"`
      });
    }
  }

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

  const fixableIssues = allAlerts.filter(a => 
    a.category === 'WCAG Contrast' || a.category === 'Link Health'
  );

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

  // Auto-Fix implementation
  const handleAutoFix = () => {
    if (!brazeHtml) return;

    let fixedHtml = brazeHtml;
    let fixedIamLink = iamButtonLink;
    let fixCounts = { contrast: 0, utm: 0, placeholder: 0, empty: 0 };

    // 1. Fix low contrast (Claim Blizzard Offer)
    // Replace color: #f87171 with color: #ffffff inside elements with bg #f43f5e
    fixedHtml = fixedHtml.replace(/(background-color\s*:\s*#f43f5e\b[^'"]*color\s*:\s*)#f87171/gi, (match, p1) => {
      fixCounts.contrast++;
      return `${p1}#ffffff`;
    });
    fixedHtml = fixedHtml.replace(/(color\s*:\s*)#f87171(\b[^'"]*background-color\s*:\s*#f43f5e)/gi, (match, p1, p2) => {
      fixCounts.contrast++;
      return `${p1}#ffffff${p2}`;
    });

    // 2. Fix empty links href="#" inside unsubscribe or other sections
    fixedHtml = fixedHtml.replace(/href=["']#["']/g, () => {
      fixCounts.empty++;
      return 'href="https://dairyqueen.com/unsubscribe?utm_source=braze&utm_medium=email&utm_campaign=blizzard_promo"';
    });

    // 3. Fix placeholder links (example.com / placeholder.com)
    fixedHtml = fixedHtml.replace(/href=["'](https?:\/\/example\.com\/[^"']+|https?:\/\/example\.com\b[^"']*)["']/gi, () => {
      fixCounts.placeholder++;
      return 'href="https://dairyqueen.com/redeem?utm_source=braze&utm_medium=email&utm_campaign=blizzard_promo"';
    });

    // 4. Fix missing UTM parameters for standard links
    fixedHtml = fixedHtml.replace(/href=["'](https?:\/\/(?!example\.com|placeholder\.com)[^"']+)["']/gi, (match, url) => {
      if (!url.includes('utm_source')) {
        fixCounts.utm++;
        const separator = url.includes('?') ? '&' : '?';
        return `href="${url}${separator}utm_source=braze&utm_medium=email&utm_campaign=blizzard_promo"`;
      }
      return match;
    });

    // 5. Fix In-App Message (IAM) Button URL
    if (iamButtonLink && setIamButtonLink) {
      const url = iamButtonLink.trim();
      if (!url || url === '#' || url.toLowerCase().startsWith('javascript:') || url.includes('example.com') || url.includes('placeholder.com')) {
        fixedIamLink = 'https://dairyqueen.com/redeem?utm_source=braze&utm_medium=iam&utm_campaign=blizzard_promo';
        setIamButtonLink(fixedIamLink);
        fixCounts.placeholder++;
      } else if (url.startsWith('http') && !url.includes('utm_source')) {
        const separator = url.includes('?') ? '&' : '?';
        fixedIamLink = `${url}${separator}utm_source=braze&utm_medium=iam&utm_campaign=blizzard_promo`;
        setIamButtonLink(fixedIamLink);
        fixCounts.utm++;
      }
    }

    // Save and re-run audits
    setBrazeHtml(fixedHtml);
    
    // Construct summary message
    const totalFixes = fixCounts.contrast + fixCounts.utm + fixCounts.placeholder + fixCounts.empty;
    if (totalFixes > 0) {
      const details = [];
      if (fixCounts.contrast > 0) details.push(`${fixCounts.contrast} contrast issue(s)`);
      if (fixCounts.empty > 0) details.push(`${fixCounts.empty} empty link(s)`);
      if (fixCounts.placeholder > 0) details.push(`${fixCounts.placeholder} placeholder link(s)`);
      if (fixCounts.utm > 0) details.push(`${fixCounts.utm} missing UTM tracker(s)`);
      
      setToastMessage(`Success! Auto-fixed: ${details.join(', ')}. Recalculating scores...`);
      setTimeout(() => setToastMessage(null), 5000);
      
      // Re-trigger audit validation immediately with fixed HTML
      if (onRunAudit) {
        onRunAudit(undefined, { 
          brazeHtml: fixedHtml,
          iamButtonLink: fixedIamLink
        });
      }
    } else {
      setToastMessage("No auto-fixable formatting issues found in this template.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="fade-in">
      {toastMessage && (
        <div className="toast" style={{ bottom: '2rem', right: '2rem' }}>
          <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginLeft: '0.5rem', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

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

          {/* Image & Text Ratios */}
          <div className="panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Deliverability Ratios</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Image Tags (`&lt;img&gt;`):</span>
                <strong style={{ color: 'var(--text-primary)' }}>{imageCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Raw Copy Length:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{rawTextLength} chars</strong>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3>Technical Issues Tracker</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Auto-Fix Button */}
              {fixableIssues.length > 0 && setBrazeHtml && (
                <button 
                  onClick={handleAutoFix}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.3rem', 
                    background: 'var(--cyan-gradient)',
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)'
                  }}
                  title="Automatically fix links, UTM params, and color contrast issues in HTML"
                >
                  <Sparkles size={12} /> Auto-Fix HTML
                </button>
              )}

              {/* Filter buttons */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setFilterSeverity('all')}
                  className={`sub-tab ${filterSeverity === 'all' ? 'active' : ''}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterSeverity('high')}
                  className={`sub-tab ${filterSeverity === 'high' ? 'active' : ''}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  High
                </button>
                <button 
                  onClick={() => setFilterSeverity('medium')}
                  className={`sub-tab ${filterSeverity === 'medium' ? 'active' : ''}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Med
                </button>
                <button 
                  onClick={() => setFilterSeverity('low')}
                  className={`sub-tab ${filterSeverity === 'low' ? 'active' : ''}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Low
                </button>
              </div>
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
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
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
