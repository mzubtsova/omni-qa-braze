import { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, FileText, Smartphone, Code, ShieldCheck, ArrowRight, Mail, X, RefreshCw, Sparkles } from 'lucide-react';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast } from '../utils/validators';

export default function Overview({ 
  overallScore, 
  copyScore, 
  visualScore, 
  techScore, 
  spamScore, 
  issuesCount, 
  setActiveTab,
  onRunAudit,
  isAuditing,
  subjectLine,
  copyAuditResults,
  spamAuditResults,
  brazeHtml,
  onPredictEngagement,
  isPredicting,
  predictionResults,
  setFilterSeverity
}) {
  // SVG Config for Circular Progress Ring
  const radius = 80;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  const getScoreGradient = (score) => {
    if (score >= 90) return 'url(#score-success-grad)';
    if (score >= 70) return 'url(#score-warning-grad)';
    return 'url(#score-error-grad)';
  };

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successSent, setSuccessSent] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--score-success)';
    if (score >= 70) return 'var(--score-warning)';
    return 'var(--score-error)';
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!recipientEmail) return;

    setIsSending(true);

    const statusLabel = overallScore >= 90 ? '🟢 READY TO DEPLOY' : overallScore >= 70 ? '🟡 WARNINGS DETECTED' : '🔴 ACTION REQUIRED';
    
    // Calculate dynamic list of real issues
    const htmlToAudit = brazeHtml || '';
    const liquidErrors = validateLiquidSyntax(htmlToAudit);
    const linkIssues = auditHtmlLinks(htmlToAudit);
    const contrastIssues = checkWcagContrast(htmlToAudit);
    const copyMismatches = copyAuditResults?.mismatches || [];
    const spamTriggers = spamAuditResults?.spamTriggers || [];

    const issueBullets = [];
    
    if (liquidErrors.length > 0) {
      issueBullets.push('🚨 CRITICAL LIQUID ERRORS:');
      liquidErrors.forEach(err => {
        issueBullets.push(`  - [${err.severity.toUpperCase()}] ${err.item}: ${err.message}`);
      });
    }

    if (copyMismatches.length > 0) {
      issueBullets.push('\n✍️ COPY & DESIGN MISMATCHES:');
      copyMismatches.forEach(m => {
        issueBullets.push(`  - [${m.severity.toUpperCase()}] Figma: "${m.figmaText}" vs Braze: "${m.brazeText}"\n    Details: ${m.message}`);
      });
    }

    if (linkIssues.length > 0) {
      issueBullets.push('\n🔗 LINK HEALTH ISSUES:');
      linkIssues.forEach(l => {
        issueBullets.push(`  - [${l.severity.toUpperCase()}] ${l.item}: ${l.message}`);
      });
    }

    if (contrastIssues.length > 0) {
      issueBullets.push('\n🎨 ACCESSIBILITY & CONTRAST ISSUES:');
      contrastIssues.forEach(c => {
        issueBullets.push(`  - [${c.severity.toUpperCase()}] ${c.item}: ${c.message}`);
      });
    }

    if (spamTriggers.length > 0) {
      issueBullets.push('\n🛡️ SPAM & DELIVERABILITY TRIGGERS:');
      spamTriggers.forEach(s => {
        issueBullets.push(`  - [${s.severity.toUpperCase()}] Flagged "${s.phrase}": ${s.message}`);
      });
    }

    const issuesSection = issueBullets.length > 0 
      ? issueBullets.join('\n') 
      : '🎉 No issues detected! The campaign code, links, and copy are 100% compliant.';

    const subject = `OmniQA Campaign Audit Report: ${overallScore}/100 Health Index`;
    const body = `📬 OMNIQA CAMPAIGN DIAGNOSTICS REPORT
--------------------------------------------------
Hi there,

Here is your automated Campaign QA Diagnostic Report:
Campaign Subject: "${subjectLine}"

🎯 OVERALL HEALTH INDEX: ${overallScore} / 100
Status: ${statusLabel}

--------------------------------------------------
📊 DIAGNOSTICS SCORECARD:
--------------------------------------------------
• Copy Sync Accuracy:   ${copyScore}%
• Visual Simulator Score: ${visualScore}%
• Code Syntax & links:   ${techScore}%
• Spam Filter Safety:     ${spamScore}%

--------------------------------------------------
🚨 DETECTED CAMPAIGN ISSUES (REAL-TIME AUDIT):
--------------------------------------------------
${issuesSection}

--------------------------------------------------
👉 NEXT STEPS / ACTIONS TO TAKE:
1. Review Figma vs Code copy differences in the 'Copy Audit' panel.
2. Click the 'Auto-Fix HTML' button in 'Technical Audits' to resolve contrast and UTM tags.
3. Attach the exported PDF report to this email before sending.

Best regards,
OmniQA Quality Assurance Engine`;

    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Trigger mailto immediately so mobile browsers do not block it
    window.location.href = mailtoUrl;
    setSuccessSent(true);
    
    // Automatically launch print window to save PDF (Desktop only)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  };

  return (
    <div className="fade-in">
      <div className="overview-main-grid">
        
        {/* Left Side: Radial Gauge Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Campaign Health</h3>
          
          <div className="progress-ring-container">
            <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
              <defs>
                <linearGradient id="score-success-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--score-success-start)" />
                  <stop offset="100%" stopColor="var(--score-success)" />
                </linearGradient>
                <linearGradient id="score-warning-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--score-warning-start)" />
                  <stop offset="100%" stopColor="var(--score-warning)" />
                </linearGradient>
                <linearGradient id="score-error-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--score-error-start)" />
                  <stop offset="100%" stopColor="var(--score-error)" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <circle
                stroke="var(--ring-bg)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Foreground Glow / Track */}
              <circle
                stroke={getScoreGradient(overallScore)}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="progress-ring-circle"
              />
            </svg>
            <div className="progress-ring-text">
              <span style={{ color: getScoreColor(overallScore) }}>{overallScore}</span>
              <span className="progress-ring-label">Health Index</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => onRunAudit()}
              disabled={isAuditing}
            >
              {isAuditing ? '🕵️‍♂️ Hunting down campaign bugs...' : 'Re-Run QA Audit'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
              onClick={() => {
                setShowEmailModal(true);
                setSuccessSent(false);
                setRecipientEmail('');
              }}
              disabled={isAuditing}
            >
              <Mail size={16} /> Send Report via Email
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              onClick={() => window.print()}
              disabled={isAuditing}
            >
              <Sparkles size={14} /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Right Side: Score Summary & Severity breakdown */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Automated Audit Results</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              OmniQA has cross-referenced Figma design assets against your coded HTML campaign body and Liquid attributes.
            </p>

            <div className="overview-stats-grid">
              <div 
                className="severity-card"
                onClick={() => {
                  if (setFilterSeverity) setFilterSeverity('high');
                  setActiveTab('technical');
                }}
                title="View High Severity Issues"
              >
                <AlertCircle size={24} style={{ color: 'var(--error)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.high}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Severity</div>
                </div>
              </div>
              
              <div 
                className="severity-card"
                onClick={() => {
                  if (setFilterSeverity) setFilterSeverity('medium');
                  setActiveTab('technical');
                }}
                title="View Medium Severity Issues"
              >
                <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.medium}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium Severity</div>
                </div>
              </div>

              <div 
                className="severity-card"
                onClick={() => {
                  if (setFilterSeverity) setFilterSeverity('low');
                  setActiveTab('technical');
                }}
                title="View Low Severity Issues"
              >
                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.low}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low Severity</div>
                </div>
              </div>
            </div>
          </div>

          <div className="overview-footer-stats" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {issuesCount.high + issuesCount.medium === 0 
                ? '🎉 Campaign is in perfect shape to deploy!' 
                : `⚠️ Found ${issuesCount.high + issuesCount.medium} issues requiring attention.`}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Checked 6 standard deliverables <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
            </span>
          </div>
        </div>

      </div>

      {/* AI Campaign Engagement Predictor */}
      <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>AI Campaign Engagement Forecast</h3>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Predictive Engagement Index</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Simulates delivery & reads subscriber behavioral features to forecast CTR, opens, and deliverability ratings.
            </p>
          </div>
          <button 
            className="btn btn-primary"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            disabled={isPredicting || isAuditing}
            onClick={onPredictEngagement}
          >
            {isPredicting ? '🔮 Gazing into crystal ball...' : 'Run Performance Predictor'}
          </button>
        </div>

        {predictionResults ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Engagement Score</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{predictionResults.engagementScore}/100</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Grade Benchmark</span>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicted Open Rate</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{predictionResults.predictedOpenRate}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Industry Avg: ~18.5%</span>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicted Click Rate (CTR)</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{predictionResults.predictedClickRate}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Industry Avg: ~2.4%</span>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Spam Risk</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: predictionResults.spamRisk === 'Low' ? 'var(--success)' : predictionResults.spamRisk === 'Medium' ? 'var(--warning)' : 'var(--error)' }}>
                  {predictionResults.spamRisk}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spam Filter Check</span>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }} className="settings-grid">
              
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ color: 'var(--success)', fontWeight: '700', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>🌟 Strength Factors (Positives)</h5>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {predictionResults.positives?.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>⚠️ Friction Barriers (Drag Points)</h5>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {predictionResults.negatives?.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>

            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h5 style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.9rem' }}>🎯 AI Copywriting Recommendations</h5>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {predictionResults.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
            No prediction logs loaded. Click the button above to run AI campaign simulation diagnostics.
          </div>
        )}
      </div>


      {/* Grid of Categories */}
      <h3 style={{ marginBottom: '1rem' }}>Audit Categories</h3>
      <div className="overview-categories-grid">
        
        {/* Copy sync */}
        <div className="category-card" onClick={() => setActiveTab('copy')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="category-icon-bg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', color: 'var(--accent-blue)' }}>
              <FileText size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>Copy & Content Auditor</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Figma extraction text vs Braze HTML tags</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="category-score" style={{ color: getScoreColor(copyScore) }}>{copyScore}%</span>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Visual stress */}
        <div className="category-card" onClick={() => setActiveTab('visuals')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="category-icon-bg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-purple)' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>Visual Stress-Tester</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Renders customization fallbacks & previews</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="category-score" style={{ color: getScoreColor(visualScore) }}>{visualScore}%</span>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Code & liquid */}
        <div className="category-card" onClick={() => setActiveTab('technical')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="category-icon-bg" style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', color: 'var(--accent-cyan)' }}>
              <Code size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>Liquid & Link Health</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Liquid parsing, dead URL checks, UTM tags</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="category-score" style={{ color: getScoreColor(techScore) }}>{techScore}%</span>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Deliverability & WCAG */}
        <div className="category-card" onClick={() => setActiveTab('technical')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="category-icon-bg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>Spam & WCAG Auditing</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Calculates contrast ratio & filters spam triggers</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="category-score" style={{ color: getScoreColor(spamScore) }}>{spamScore}%</span>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

      </div>

      {/* EMAIL MODAL OVERLAY */}
      {showEmailModal && (
        <div 
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
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '2.5rem 2rem 2rem 2rem',
              borderRadius: 'var(--border-radius-lg)',
              position: 'relative',
              width: '90%',
              maxWidth: '450px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
          >
            <button 
              onClick={() => setShowEmailModal(false)}
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
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Mail size={22} style={{ color: 'var(--accent-cyan)' }} /> Send Campaign QA Report
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Deliver the complete copy, visual, and technical diagnostics audit to your inbox.
            </p>

            {successSent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '1rem', display: 'inline-block' }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Report Dispatched Successfully!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  A detailed HTML report has been sent to <strong style={{ color: 'var(--text-primary)' }}>{recipientEmail}</strong>.
                </p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowEmailModal(false)}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  Close Panel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Recipient Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="name@company.com" 
                    value={recipientEmail} 
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    disabled={isSending}
                    style={{ background: 'var(--bg-tertiary)' }}
                  />
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                    <Sparkles size={14} /> Audit Dispatch Checklist
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Campaign Health Index:</span>
                      <strong style={{ color: overallScore >= 90 ? 'var(--success)' : overallScore >= 70 ? 'var(--warning)' : 'var(--error)' }}>{overallScore}/100</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Figma Copy Mismatches:</span>
                      <strong style={{ color: (issuesCount.high + issuesCount.medium) === 0 ? 'var(--success)' : 'var(--warning)' }}>{issuesCount.high + issuesCount.medium} flag(s)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Link & Contrast Warnings:</span>
                      <strong style={{ color: issuesCount.low === 0 ? 'var(--success)' : 'var(--text-primary)' }}>{issuesCount.low} flag(s)</strong>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }} 
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={14} className="spin" style={{ marginRight: '0.25rem' }} /> Dispatching Report...
                    </>
                  ) : (
                    'Send QA Report'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
