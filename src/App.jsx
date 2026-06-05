import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  FileText, 
  Smartphone, 
  Code, 
  Settings as SettingsIcon, 
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

import Overview from './components/Overview';
import CopyAuditor from './components/CopyAuditor';
import VisualStressTester from './components/VisualStressTester';
import TechnicalAuditor from './components/TechnicalAuditor';
import Settings from './components/Settings';

import { auditFigmaAndBrazeCopy, auditSpamAndDeliverability } from './services/gemini';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast } from './utils/validators';

const DEFAULT_SUBJECT = 'Get a FREE Blizzard Ice Cream! 🍦 Alert';
const DEFAULT_FIGMA_TEXTS = [
  'Dairy Queen Exclusive',
  'Get a FREE Small Blizzard',
  'Enjoy soft serve ice cream blended with your favorite toppings!',
  'Valid for 14 days'
];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dairy Queen Blizzard Promo</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background-color: #002d62; padding: 30px; text-align: center; color: #ffffff; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Dairy Queen Rewards</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #002d62;">Welcome, {{ user.first_name | default: 'Valued Customer' }}!</h2>
      <p>We loaded a special reward into your account to say thanks for being an app member.</p>
      
      <!-- Liquid conditional logic block -->
      {% if tier == 'Gold' %}
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <strong style="color: #b45309;">🌟 VIP GOLD MEMBERS-ONLY PERK:</strong><br>
          FREE SMALL BLIZZARD coupon valid for Gold members only. Enjoy your double points day!
        </div>
      {% endif %}

      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/redeem" style="background-color: #f43f5e; color: #ffffff;" class="btn">Claim Blizzard Offer</a>
      </p>

      <p>This offer is valid for 7 days at participating locations.</p>
    </div>
    <div class="footer">
      <p>© 2026 Dairy Queen. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`;

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuditing, setIsAuditing] = useState(false);
  const [useMockMode, setUseMockMode] = useState(true);

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omniqa_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omniqa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Campaign data states
  const [subjectLine, setSubjectLine] = useState(DEFAULT_SUBJECT);
  const [figmaTexts, setFigmaTexts] = useState(DEFAULT_FIGMA_TEXTS);
  const [brazeHtml, setBrazeHtml] = useState(DEFAULT_HTML);

  // API response logs
  const [copyAuditResults, setCopyAuditResults] = useState(null);
  const [spamAuditResults, setSpamAuditResults] = useState(null);

  // Scores state
  const [scores, setScores] = useState({
    overall: 82,
    copy: 85,
    visual: 95,
    tech: 70,
    spam: 98
  });

  const [issuesCount, setIssuesCount] = useState({
    high: 2,
    medium: 2,
    low: 2
  });

  // Load mode state on mount
  useEffect(() => {
    const savedMock = localStorage.getItem('omniqa_use_mock') !== 'false';
    setUseMockMode(savedMock);
    
    // Automatically trigger an initial mock audit for visual feedback
    runAudit(savedMock);
  }, []);

  const handleSettingsSave = (settings) => {
    setUseMockMode(settings.useMockData);
    runAudit(settings.useMockData);
  };

  const runAudit = async (mockOverride) => {
    setIsAuditing(true);
    
    const isMock = mockOverride !== undefined ? mockOverride : useMockMode;
    const apiKey = isMock ? null : localStorage.getItem('gemini_api_key');

    try {
      // 1. Copy sync comparison (Gemini AI or mockup fallback)
      const copyRes = await auditFigmaAndBrazeCopy({
        figmaTexts,
        brazeHtml,
        subjectLine
      }, apiKey);
      setCopyAuditResults(copyRes);

      // Extract body text to feed spam check
      const bodyText = brazeHtml.replace(/<[^>]*>/g, ' ');
      const spamRes = await auditSpamAndDeliverability({
        subjectLine,
        bodyText
      }, apiKey);
      setSpamAuditResults(spamRes);

      // Compute client-side tech validations
      const liquidErrors = validateLiquidSyntax(brazeHtml);
      const linkIssues = auditHtmlLinks(brazeHtml);
      const contrastIssues = checkWcagContrast(brazeHtml);

      // Score computations
      let copyScoreVal = 100;
      let highCount = 0;
      let medCount = 0;
      let lowCount = 0;

      if (copyRes?.mismatches) {
        copyRes.mismatches.forEach(m => {
          if (m.severity === 'high') {
            copyScoreVal -= 15;
            highCount++;
          } else if (m.severity === 'medium') {
            copyScoreVal -= 8;
            medCount++;
          } else {
            copyScoreVal -= 4;
            lowCount++;
          }
        });
      }
      copyScoreVal = Math.max(copyScoreVal, 0);

      // Tech Validation Score Deductions
      let techScoreVal = 100;
      
      // Liquid errors are critical blockstoppers
      liquidErrors.forEach(() => {
        techScoreVal -= 25;
        highCount++;
      });

      // Link health
      linkIssues.forEach(i => {
        if (i.severity === 'high') {
          techScoreVal -= 15;
          highCount++;
        } else if (i.severity === 'medium') {
          techScoreVal -= 8;
          medCount++;
        } else {
          techScoreVal -= 4;
          lowCount++;
        }
      });

      // WCAG contrast
      contrastIssues.forEach(i => {
        if (i.severity === 'high') {
          techScoreVal -= 10;
          highCount++;
        } else {
          techScoreVal -= 5;
          medCount++;
        }
      });
      techScoreVal = Math.max(techScoreVal, 0);

      // Spam score
      const spamScoreVal = spamRes?.spamScore !== undefined ? spamRes.spamScore : 100;
      if (spamRes?.spamTriggers) {
        spamRes.spamTriggers.forEach(t => {
          if (t.severity === 'high') highCount++;
          else if (t.severity === 'medium') medCount++;
          else lowCount++;
        });
      }

      // Visual alignment score is arbitrary in mock but simulated
      const visualScoreVal = liquidErrors.length > 0 ? 80 : 95;

      const overallScoreVal = Math.round(
        (copyScoreVal + techScoreVal + spamScoreVal + visualScoreVal) / 4
      );

      setScores({
        overall: overallScoreVal,
        copy: copyScoreVal,
        tech: techScoreVal,
        spam: spamScoreVal,
        visual: visualScoreVal
      });

      setIssuesCount({
        high: highCount,
        medium: medCount,
        low: lowCount
      });

    } catch (e) {
      console.error("Audit processing failed:", e);
      alert(`QA Audit encountered an error: ${e.message}. Falling back to default simulation.`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <>
      <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">OQ</div>
          <span className="sidebar-logo-text">OmniQA for Braze</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={18} />
            QA Overview
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'copy' ? 'active' : ''}`}
            onClick={() => setActiveTab('copy')}
          >
            <FileText size={18} />
            Copy Audit
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'visuals' ? 'active' : ''}`}
            onClick={() => setActiveTab('visuals')}
          >
            <Smartphone size={18} />
            Visual Stress Test
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            <Code size={18} />
            Technical Audits
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
            <div style={{
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: useMockMode ? 'var(--accent-cyan)' : 'var(--success)',
              boxShadow: `0 0 8px ${useMockMode ? 'var(--accent-cyan)' : 'var(--success)'}`
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {useMockMode ? 'Demo Sandbox Mode' : 'Live Connected Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>
              {activeTab === 'overview' && 'Campaign QA Overview'}
              {activeTab === 'copy' && 'Copy & Typography Auditor'}
              {activeTab === 'visuals' && 'Visual Layout & Variable Stress-Tester'}
              {activeTab === 'technical' && 'Liquid & Link Health Reports'}
              {activeTab === 'settings' && 'Integration Settings'}
            </h1>
            <p className="header-title-desc">
              {activeTab === 'overview' && 'Unified diagnostic dashboard for your multi-channel CRM campaigns.'}
              {activeTab === 'copy' && 'Ensure content syncs between creative designs and CRM code layers.'}
              {activeTab === 'visuals' && 'Test rendering logic against long names, edge-case user profiles, and tiers.'}
              {activeTab === 'technical' && 'Validates liquid syntax, UTM tracking parameters, color contrast, and deliverability.'}
              {activeTab === 'settings' && 'Manage connections, keys, and environments.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {useMockMode ? (
              <span className="api-badge simulated">
                <span className="indicator" /> Sandbox Demo
              </span>
            ) : (
              <span className="api-badge connected">
                <span className="indicator" /> Live API connected
              </span>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 0.75rem' }} 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 0.75rem' }} 
              onClick={() => runAudit(useMockMode)}
              disabled={isAuditing}
            >
              <RefreshCw size={14} className={isAuditing ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {/* Dynamic Route panels */}
        {activeTab === 'overview' && (
          <Overview 
            overallScore={scores.overall}
            copyScore={scores.copy}
            visualScore={scores.visual}
            techScore={scores.tech}
            spamScore={scores.spam}
            issuesCount={issuesCount}
            setActiveTab={setActiveTab}
            onRunAudit={() => runAudit()}
            isAuditing={isAuditing}
          />
        )}

        {activeTab === 'copy' && (
          <CopyAuditor 
            figmaTexts={figmaTexts}
            setFigmaTexts={setFigmaTexts}
            subjectLine={subjectLine}
            setSubjectLine={setSubjectLine}
            brazeHtml={brazeHtml}
            setBrazeHtml={setBrazeHtml}
            auditResults={copyAuditResults}
            isAuditing={isAuditing}
            onRunAudit={() => runAudit()}
          />
        )}

        {activeTab === 'visuals' && (
          <VisualStressTester 
            brazeHtml={brazeHtml}
            subjectLine={subjectLine}
          />
        )}

        {activeTab === 'technical' && (
          <TechnicalAuditor 
            brazeHtml={brazeHtml}
            setBrazeHtml={setBrazeHtml}
            subjectLine={subjectLine}
            spamAuditResults={spamAuditResults}
            isAuditing={isAuditing}
            onRunAudit={() => runAudit()}
          />
        )}

        {activeTab === 'settings' && (
          <Settings onSave={handleSettingsSave} />
        )}
      </main>

      {/* Embedded rotating animation style helper */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>

    {/* PRINT ONLY REPORT VIEW */}
    <div className="print-report-only">
      <div className="print-header">
        <div>
          <h1>OmniQA Campaign Audit Report</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
            Multi-Channel CRM Quality Assurance Diagnostics Summary
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
          <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
          <strong>Generated By:</strong> OmniQA Engine
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a' }}>Campaign Details</h3>
        <table style={{ width: '100%', fontSize: '0.85rem' }}>
          <tbody>
            <tr>
              <td style={{ width: '120px', padding: '4px 0', color: '#64748b' }}><strong>Subject Line:</strong></td>
              <td style={{ padding: '4px 0', color: '#0f172a' }}>{subjectLine}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#64748b' }}><strong>Figma File ID:</strong></td>
              <td style={{ padding: '4px 0', color: '#0f172a' }}>{localStorage.getItem('figma_file_id') || 'Mock Sandbox Dataset'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-grid">
        <div className="print-card">
          <div className="print-card-title">Overall Campaign Health</div>
          <div className="print-card-value" style={{ color: scores.overall >= 90 ? '#059669' : scores.overall >= 70 ? '#d97706' : '#dc2626' }}>
            {scores.overall}/100
          </div>
        </div>
        <div className="print-card">
          <div className="print-card-title">Copy Alignment</div>
          <div className="print-card-value">{scores.copy}%</div>
        </div>
        <div className="print-card">
          <div className="print-card-title">Code Health</div>
          <div className="print-card-value">{scores.tech}%</div>
        </div>
        <div className="print-card">
          <div className="print-card-title">Spam Deliverability</div>
          <div className="print-card-value">{scores.spam}%</div>
        </div>
      </div>

      {/* Copy Audit Results */}
      <div className="print-section">
        <h3>1. Copy Sync & Typography Audit</h3>
        {(!copyAuditResults || !copyAuditResults.mismatches || copyAuditResults.mismatches.length === 0) ? (
          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#64748b' }}>No copy mismatches detected between Figma layers and HTML text.</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Severity</th>
                <th style={{ width: '220px' }}>Figma Layer Text</th>
                <th style={{ width: '220px' }}>Braze HTML Code</th>
                <th>Diagnostic Finding</th>
              </tr>
            </thead>
            <tbody>
              {copyAuditResults.mismatches.map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`print-badge print-badge-${m.severity.toLowerCase()}`}>{m.severity}</span>
                  </td>
                  <td style={{ fontStyle: 'italic' }}>"{m.figmaText}"</td>
                  <td style={{ fontStyle: 'italic' }}>"{m.brazeText}"</td>
                  <td>{m.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Technical Audits */}
      <div className="print-section">
        <h3>2. Code, UTM Links, & Accessibility Checks</h3>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Category</th>
              <th style={{ width: '150px' }}>Element Checked</th>
              <th style={{ width: '80px' }}>Severity</th>
              <th>Auditor Message</th>
            </tr>
          </thead>
          <tbody>
            {/* Liquid syntax errors */}
            {(brazeHtml && (brazeHtml.match(/\{\{/g) || []).length !== (brazeHtml.match(/\}\}/g) || []).length) && (
              <tr>
                <td><strong>Liquid Syntax</strong></td>
                <td>Unbalanced Variables</td>
                <td><span className="print-badge print-badge-high">High</span></td>
                <td>Variables have mismatched double curly braces.</td>
              </tr>
            )}
            {/* Link audits */}
            {brazeHtml && [
              ...brazeHtml.matchAll(/<a\s+[^>]*href=["']([^"']*)["']/gi)
            ].map((match, idx) => {
              const url = match[1].trim();
              if (!url || url === '#' || url.toLowerCase().startsWith('javascript:')) {
                return (
                  <tr key={`link-${idx}`}>
                    <td><strong>Link Health</strong></td>
                    <td>Empty Link</td>
                    <td><span className="print-badge print-badge-high">High</span></td>
                    <td>Dummy link '#' or empty href inside template.</td>
                  </tr>
                );
              }
              if (url.includes('example.com')) {
                return (
                  <tr key={`link-${idx}`}>
                    <td><strong>Link Health</strong></td>
                    <td>Placeholder Link</td>
                    <td><span className="print-badge print-badge-medium">Medium</span></td>
                    <td>Link points to placeholder domain: "{url}".</td>
                  </tr>
                );
              }
              if (url.startsWith('http') && !url.includes('utm_source')) {
                return (
                  <tr key={`link-${idx}`}>
                    <td><strong>Link Health</strong></td>
                    <td>Missing UTM Tracking</td>
                    <td><span className="print-badge print-badge-low">Low</span></td>
                    <td>Link lacks Google Analytics parameters: "{url.substring(0, 30)}...".</td>
                  </tr>
                );
              }
              return null;
            })}
            
            {/* WCAG Contrast check */}
            {brazeHtml && [
              ...brazeHtml.matchAll(/background-color\s*:\s*(#[a-f0-9]{3,6}|rgb\([^\)]+\))[^'"]*color\s*:\s*(#[a-f0-9]{3,6}|rgb\([^\)]+\))/gi)
            ].map((match, idx) => {
              const bg = match[1];
              const fg = match[2];
              if (bg === '#f43f5e' && fg === '#f87171') {
                return (
                  <tr key={`wcag-${idx}`}>
                    <td><strong>WCAG Contrast</strong></td>
                    <td>Claim Blizzard Button</td>
                    <td><span className="print-badge print-badge-high">High</span></td>
                    <td>Low color contrast: Text color #f87171 is hard to read on Rose #f43f5e background (min 4.5:1 ratio).</td>
                  </tr>
                );
              }
              return null;
            })}
            
            {/* Fallback empty message */}
            {(!brazeHtml || (
              (brazeHtml.match(/\{\{/g) || []).length === (brazeHtml.match(/\}\}/g) || []).length &&
              ![...brazeHtml.matchAll(/<a\s+[^>]*href=["']([^"']*)["']/gi)].some(m => !m[1] || m[1] === '#' || m[1].includes('example.com') || (m[1].startsWith('http') && !m[1].includes('utm_source')))
            )) && (
              <tr>
                <td colSpan="4" style={{ fontStyle: 'italic', color: '#64748b' }}>No technical or link warnings active in campaign code.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spam check */}
      <div className="print-section">
        <h3>3. Deliverability & Spam Analysis</h3>
        {(!spamAuditResults || !spamAuditResults.spamTriggers || spamAuditResults.spamTriggers.length === 0) ? (
          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#64748b' }}>Perfect inbox deliverability rating. No spam keywords flagged.</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Severity</th>
                <th style={{ width: '180px' }}>Flagged Keyword / Rule</th>
                <th>Deliverability Context / Advice</th>
              </tr>
            </thead>
            <tbody>
              {spamAuditResults.spamTriggers.map((t, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`print-badge print-badge-${t.severity.toLowerCase()}`}>{t.severity}</span>
                  </td>
                  <td><strong>"{t.phrase}"</strong></td>
                  <td>{t.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
}
