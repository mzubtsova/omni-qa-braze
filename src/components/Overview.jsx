import { CheckCircle2, AlertTriangle, AlertCircle, FileText, Smartphone, Code, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Overview({ 
  overallScore, 
  copyScore, 
  visualScore, 
  techScore, 
  spamScore, 
  issuesCount, 
  setActiveTab,
  onRunAudit,
  isAuditing
}) {
  // SVG Config for Circular Progress Ring
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Left Side: Radial Gauge Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Campaign Health</h3>
          
          <div className="progress-ring-container">
            <svg height={radius * 2} width={radius * 2}>
              {/* Background Track */}
              <circle
                stroke="rgba(255,255,255,0.03)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Foreground Glow */}
              <circle
                stroke={getScoreColor(overallScore)}
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
              <span>{overallScore}</span>
              <span className="progress-ring-label">Health Index</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: '2rem', width: '100%' }}
            onClick={onRunAudit}
            disabled={isAuditing}
          >
            {isAuditing ? 'Analyzing Campaign...' : 'Re-Run QA Audit'}
          </button>
        </div>

        {/* Right Side: Score Summary & Severity breakdown */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Automated Audit Results</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              OmniQA has cross-referenced Figma design assets against your coded HTML campaign body and Liquid attributes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={24} style={{ color: 'var(--error)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.high}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Severity</div>
                </div>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.medium}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium Severity</div>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{issuesCount.low}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low Severity</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Grid of Categories */}
      <h3 style={{ marginBottom: '1rem' }}>Audit Categories</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
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
    </div>
  );
}
