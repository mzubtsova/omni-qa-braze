import { useState, useEffect, useRef } from 'react';
import { 
  BarChart2, 
  FileText, 
  Smartphone, 
  Code, 
  Settings as SettingsIcon, 
  RefreshCw,
  Sun,
  Moon,
  Database,
  Scale
} from 'lucide-react';

import Overview from './components/Overview';
import CopyAuditor from './components/CopyAuditor';
import VisualStressTester from './components/VisualStressTester';
import TechnicalAuditor from './components/TechnicalAuditor';
import Settings from './components/Settings';
import Catalog from './components/Catalog';
import AbEvaluator from './components/AbEvaluator';

import { auditFigmaAndBrazeCopy, auditSpamAndDeliverability, predictCampaignEngagement } from './services/gemini';
import { fetchFigmaTextLayers } from './services/figma';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast, auditImages } from './utils/validators';

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

      <!-- Abandoned Cart Items Loop -->
      {% if cart.items %}
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h4 style="margin-top: 0; color: #002d62; display: flex; align-items: center; gap: 0.25rem;">Items Left in Your Cart:</h4>
          <ul style="padding-left: 20px; margin: 0; font-size: 14px;">
            {% for item in cart.items %}
              <li style="margin-bottom: 5px;"><strong>{{ item.qty }}x</strong> {{ item.name }} - {{ item.price }}</li>
            {% endfor %}
          </ul>
        </div>
      {% endif %}

      <p style="text-align: center; margin: 30px 0;">
        <a href="http://example.com/redeem" style="background-color: #f43f5e; color: #ffffff;" class="btn">Claim Blizzard Offer</a>
      </p>

      <p style="font-size: 14px; color: #475569; text-align: center; margin-top: 20px; border-top: 1px dashed #e5e7eb; padding-top: 15px;">
        Use coupon code: <strong>{{ campaign.coupon_code | default: 'DQ-WELCOME-2026' }}</strong><br>
        Offer Expires: <strong>{{ campaign.expiry_date | default: 'December 31, 2026' }}</strong>
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
  
  const isFirstRender = useRef(true);

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
  const [pushBody, setPushBody] = useState('Get a FREE Small Blizzard! 🍦 Valid for 14 days. Claim your exclusive app reward today.');
  const [smsBody, setSmsBody] = useState('Dairy Queen: Welcome {{ user.first_name | default: \'Valued Customer\' }}! We loaded a FREE Blizzard reward into your account. Redeem here: http://example.com/redeem');
  const [iamHeader, setIamHeader] = useState('Get a FREE Small Blizzard');
  const [iamBody, setIamBody] = useState('Enjoy soft serve ice cream blended with your favorite toppings! Valid for 14 days.');
  const [iamButtonText, setIamButtonText] = useState('Claim Offer');
  const [iamButtonLink, setIamButtonLink] = useState('http://example.com/redeem');

  // API response logs
  const [copyAuditResults, setCopyAuditResults] = useState(null);
  const [spamAuditResults, setSpamAuditResults] = useState(null);

  // Scores state (initialized to the exact pre-calculated score of default campaign)
  const [scores, setScores] = useState({
    overall: 70,
    copy: 58,
    visual: 95,
    tech: 43,
    spam: 83
  });

  const [issuesCount, setIssuesCount] = useState({
    high: 4,
    medium: 6,
    low: 4
  });

  const [figmaSyncLoading, setFigmaSyncLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResults, setPredictionResults] = useState(null);

  // Lifted severity filter state for campaign issues tracking
  const [filterSeverity, setFilterSeverity] = useState('all');

  const handleSyncFigma = async () => {
    setFigmaSyncLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const token = useMockMode ? null : 'server';
    const fileId = useMockMode ? null : localStorage.getItem('figma_file_id');
    try {
      const layers = await fetchFigmaTextLayers(fileId, token);
      setFigmaTexts(layers);
      runAudit(useMockMode, { figmaTexts: layers });
    } catch (err) {
      alert(`Figma Sync Failed: ${err.message}. Make sure your token and file key are configured in Settings.`);
    } finally {
      setFigmaSyncLoading(false);
    }
  };

  const handlePredictEngagement = async () => {
    setIsPredicting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const apiKey = useMockMode ? null : 'server';
    const bodyText = brazeHtml.replace(/<[^>]*>/g, ' ');
    try {
      const res = await predictCampaignEngagement({
        subjectLine,
        bodyText,
        pushBody,
        smsBody,
        iamHeader,
        iamBody
      }, apiKey);
      setPredictionResults(res);
    } catch (err) {
      console.error("AI engagement forecast failed:", err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleLoadCampaign = (campaign) => {
    if (campaign.subjectLine !== undefined) setSubjectLine(campaign.subjectLine);
    if (campaign.brazeHtml !== undefined) setBrazeHtml(campaign.brazeHtml);
    if (campaign.pushBody !== undefined) setPushBody(campaign.pushBody);
    if (campaign.smsBody !== undefined) setSmsBody(campaign.smsBody);
    if (campaign.iamHeader !== undefined) setIamHeader(campaign.iamHeader);
    if (campaign.iamBody !== undefined) setIamBody(campaign.iamBody);
    if (campaign.iamButtonText !== undefined) setIamButtonText(campaign.iamButtonText);
    if (campaign.iamButtonLink !== undefined) setIamButtonLink(campaign.iamButtonLink);
    if (campaign.figmaTexts !== undefined) setFigmaTexts(campaign.figmaTexts);
    setActiveTab('overview');
  };

  // Load mode state on mount
  useEffect(() => {
    const savedMock = localStorage.getItem('omniqa_use_mock') !== 'false';
    setUseMockMode(savedMock);
    
    // Automatically trigger an initial mock audit instantly on mount (no 1-second delay for smooth load)
    runAudit(savedMock, {}, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Automatically re-run the audit when campaign inputs change (only in mock sandbox mode for instant responsiveness)
  useEffect(() => {
    if (!useMockMode) return;
    
    // Skip the very first render since the initial mount useEffect already runs it instantly
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const delayDebounceFn = setTimeout(() => {
      runAudit(true);
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [brazeHtml, subjectLine, figmaTexts, pushBody, smsBody, iamHeader, iamBody, iamButtonText, iamButtonLink, useMockMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettingsSave = (settings) => {
    setUseMockMode(settings.useMockData);
    runAudit(settings.useMockData);
  };

  const runAudit = async (mockOverride, customData = {}, skipDelay = false) => {
    setIsAuditing(true);
    if (!skipDelay) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const isMock = mockOverride !== undefined ? mockOverride : useMockMode;
    const apiKey = isMock ? null : 'server';

    const currentHtml = customData.brazeHtml !== undefined ? customData.brazeHtml : brazeHtml;
    const currentSubject = customData.subjectLine !== undefined ? customData.subjectLine : subjectLine;
    const currentFigma = customData.figmaTexts !== undefined ? customData.figmaTexts : figmaTexts;
    const currentPushBody = customData.pushBody !== undefined ? customData.pushBody : pushBody;
    const currentSmsBody = customData.smsBody !== undefined ? customData.smsBody : smsBody;
    const currentIamHeader = customData.iamHeader !== undefined ? customData.iamHeader : iamHeader;
    const currentIamBody = customData.iamBody !== undefined ? customData.iamBody : iamBody;
    const currentIamButtonText = customData.iamButtonText !== undefined ? customData.iamButtonText : iamButtonText;
    const currentIamButtonLink = customData.iamButtonLink !== undefined ? customData.iamButtonLink : iamButtonLink;

    try {
      // 1. Copy sync comparison (Gemini AI or mockup fallback)
      const copyRes = await auditFigmaAndBrazeCopy({
        figmaTexts: currentFigma,
        brazeHtml: currentHtml,
        subjectLine: currentSubject,
        pushBody: currentPushBody,
        smsBody: currentSmsBody,
        iamHeader: currentIamHeader,
        iamBody: currentIamBody,
        iamButtonText: currentIamButtonText
      }, apiKey);

      // 2. Fetch AI performance predictions
      const cleanBodyText = currentHtml.replace(/<[^>]*>/g, ' ');
      const predRes = await predictCampaignEngagement({
        subjectLine: currentSubject,
        bodyText: cleanBodyText,
        pushBody: currentPushBody,
        smsBody: currentSmsBody,
        iamHeader: currentIamHeader,
        iamBody: currentIamBody
      }, apiKey);
      setPredictionResults(predRes);

      // Compute client-side tech validations
      const liquidErrors = [
        ...validateLiquidSyntax(currentHtml),
        ...validateLiquidSyntax(currentSubject).map(e => ({ ...e, item: `Subject: ${e.item}` })),
        ...validateLiquidSyntax(currentPushBody).map(e => ({ ...e, item: `Push: ${e.item}` })),
        ...validateLiquidSyntax(currentSmsBody).map(e => ({ ...e, item: `SMS: ${e.item}` })),
        ...validateLiquidSyntax(currentIamHeader).map(e => ({ ...e, item: `IAM Header: ${e.item}` })),
        ...validateLiquidSyntax(currentIamBody).map(e => ({ ...e, item: `IAM Body: ${e.item}` })),
      ];

      const linkIssues = [
        ...auditHtmlLinks(currentHtml),
      ];

      if (currentIamButtonLink) {
        const url = currentIamButtonLink.trim();
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

      const contrastIssues = checkWcagContrast(currentHtml);
      const imageIssues = auditImages(currentHtml);

      // Merge color/contrast issues into Copy Auditor mismatches list
      const contrastMismatches = contrastIssues.map(issue => ({
        severity: issue.severity,
        figmaText: issue.item === 'Dark Mode Risk' ? 'Dark Mode Contrast Risk' : 'Figma Color / Design Compliance',
        brazeText: issue.item,
        message: issue.message
      }));

      if (copyRes) {
        copyRes.mismatches = [
          ...(copyRes.mismatches || []),
          ...contrastMismatches
        ];
      }
      setCopyAuditResults(copyRes);

      // Extract body text to feed spam check
      const bodyText = currentHtml.replace(/<[^>]*>/g, ' ');
      const spamRes = await auditSpamAndDeliverability({
        subjectLine: currentSubject,
        bodyText
      }, apiKey);
      setSpamAuditResults(spamRes);

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

      // Image health checks
      imageIssues.forEach(i => {
        if (i.severity === 'high') {
          techScoreVal -= 10;
          highCount++;
        } else if (i.severity === 'medium') {
          techScoreVal -= 5;
          medCount++;
        } else {
          techScoreVal -= 2;
          lowCount++;
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

  const printLiquidErrors = validateLiquidSyntax(brazeHtml);
  const printLinkIssues = auditHtmlLinks(brazeHtml);
  const printContrastIssues = checkWcagContrast(brazeHtml);
  const printImageIssues = auditImages(brazeHtml);

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
            <span>QA Overview</span>
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'copy' ? 'active' : ''}`}
            onClick={() => setActiveTab('copy')}
          >
            <FileText size={18} />
            <span>Copy Audit</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'visuals' ? 'active' : ''}`}
            onClick={() => setActiveTab('visuals')}
          >
            <Smartphone size={18} />
            <span>Visual Stress Test</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => {
              setFilterSeverity('all');
              setActiveTab('technical');
            }}
          >
            <Code size={18} />
            <span>Technical Audits</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'ab_evaluator' ? 'active' : ''}`}
            onClick={() => setActiveTab('ab_evaluator')}
          >
            <Scale size={18} />
            <span>A/B Copy Compare</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Database size={18} />
            <span>Campaign Catalog</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
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
              {activeTab === 'ab_evaluator' && 'A/B Performance Engine'}
              {activeTab === 'catalog' && 'Braze Campaign Catalog'}
              {activeTab === 'settings' && 'Integration Settings'}
            </h1>
            <p className="header-title-desc">
              {activeTab === 'overview' && 'Unified diagnostic dashboard for your multi-channel CRM campaigns.'}
              {activeTab === 'copy' && 'Ensure content syncs between creative designs and CRM code layers.'}
              {activeTab === 'visuals' && 'Test rendering logic against long names, edge-case user profiles, and tiers.'}
              {activeTab === 'technical' && 'Validates liquid syntax, UTM tracking parameters, color contrast, and deliverability.'}
              {activeTab === 'ab_evaluator' && 'Predictively evaluate and score competing campaign copy versions.'}
              {activeTab === 'catalog' && 'Manage staging states and version controls for your campaign assets.'}
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
            onRunAudit={runAudit}
            isAuditing={isAuditing}
            subjectLine={subjectLine}
            copyAuditResults={copyAuditResults}
            spamAuditResults={spamAuditResults}
            brazeHtml={brazeHtml}
            onPredictEngagement={handlePredictEngagement}
            isPredicting={isPredicting}
            predictionResults={predictionResults}
            setFilterSeverity={setFilterSeverity}
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
            pushBody={pushBody}
            setPushBody={setPushBody}
            smsBody={smsBody}
            setSmsBody={setSmsBody}
            iamHeader={iamHeader}
            setIamHeader={setIamHeader}
            iamBody={iamBody}
            setIamBody={setIamBody}
            iamButtonText={iamButtonText}
            setIamButtonText={setIamButtonText}
            iamButtonLink={iamButtonLink}
            setIamButtonLink={setIamButtonLink}
            auditResults={copyAuditResults}
            spamAuditResults={spamAuditResults}
            isAuditing={isAuditing}
            onRunAudit={runAudit}
            onSyncFigma={handleSyncFigma}
            figmaSyncLoading={figmaSyncLoading}
          />
        )}

        {activeTab === 'visuals' && (
          <VisualStressTester 
            brazeHtml={brazeHtml}
            setBrazeHtml={setBrazeHtml}
            subjectLine={subjectLine}
            setSubjectLine={setSubjectLine}
            theme={theme}
            pushBody={pushBody}
            setPushBody={setPushBody}
            smsBody={smsBody}
            setSmsBody={setSmsBody}
            iamHeader={iamHeader}
            setIamHeader={setIamHeader}
            iamBody={iamBody}
            setIamBody={setIamBody}
            iamButtonText={iamButtonText}
            setIamButtonText={setIamButtonText}
            iamButtonLink={iamButtonLink}
            setIamButtonLink={setIamButtonLink}
          />
        )}

        {activeTab === 'technical' && (
          <TechnicalAuditor 
            brazeHtml={brazeHtml}
            setBrazeHtml={setBrazeHtml}
            subjectLine={subjectLine}
            pushBody={pushBody}
            smsBody={smsBody}
            iamHeader={iamHeader}
            iamBody={iamBody}
            iamButtonLink={iamButtonLink}
            setIamButtonLink={setIamButtonLink}
            spamAuditResults={spamAuditResults}
            isAuditing={isAuditing}
            onRunAudit={runAudit}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
          />
        )}

        {activeTab === 'catalog' && (
          <Catalog 
            onLoadCampaign={handleLoadCampaign}
            currentCampaignState={{
              subjectLine,
              brazeHtml,
              pushBody,
              smsBody,
              iamHeader,
              iamBody,
              iamButtonText,
              iamButtonLink,
              figmaTexts
            }}
          />
        )}

        {activeTab === 'ab_evaluator' && (
          <AbEvaluator 
            subjectLine={subjectLine}
            brazeHtml={brazeHtml}
            setSubjectLine={setSubjectLine}
            setBrazeHtml={setBrazeHtml}
            setIamButtonText={setIamButtonText}
            setIamButtonLink={setIamButtonLink}
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
                    <span className={`print-badge print-badge-${(m.severity || 'low').toLowerCase()}`}>{m.severity}</span>
                  </td>
                  <td style={{ fontStyle: 'italic' }}>&ldquo;{m.figmaText}&rdquo;</td>
                  <td style={{ fontStyle: 'italic' }}>&ldquo;{m.brazeText}&rdquo;</td>
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
            {printLiquidErrors.map((err, idx) => (
              <tr key={`liq-${idx}`}>
                <td><strong>Liquid Syntax</strong></td>
                <td>{err.item}</td>
                <td><span className={`print-badge print-badge-${err.severity.toLowerCase()}`}>{err.severity}</span></td>
                <td>{err.message}</td>
              </tr>
            ))}
            {printLinkIssues.map((issue, idx) => (
              <tr key={`link-${idx}`}>
                <td><strong>Link Health</strong></td>
                <td>{issue.item}</td>
                <td><span className={`print-badge print-badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td>
                <td>{issue.message}</td>
              </tr>
            ))}
            {printContrastIssues.map((issue, idx) => (
              <tr key={`contrast-${idx}`}>
                <td><strong>WCAG Contrast</strong></td>
                <td>{issue.item}</td>
                <td><span className={`print-badge print-badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td>
                <td>{issue.message}</td>
              </tr>
            ))}
            {printImageIssues.map((issue, idx) => (
              <tr key={`image-${idx}`}>
                <td><strong>Image Health</strong></td>
                <td>{issue.item}</td>
                <td><span className={`print-badge print-badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span></td>
                <td>{issue.message}</td>
              </tr>
            ))}
            {printLiquidErrors.length === 0 && printLinkIssues.length === 0 && printContrastIssues.length === 0 && printImageIssues.length === 0 && (
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
                    <span className={`print-badge print-badge-${(t.severity || 'low').toLowerCase()}`}>{t.severity}</span>
                  </td>
                  <td><strong>&ldquo;{t.phrase}&rdquo;</strong></td>
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
