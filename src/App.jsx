import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart2,
  Database,
  ListChecks,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

import Overview from './components/Overview';
import CopyAuditor from './components/CopyAuditor';
import TechnicalAuditor from './components/TechnicalAuditor';
import Settings from './components/Settings';
import Catalog from './components/Catalog';
import AutomatedQA from './components/AutomatedQA';
import ApprovalGate from './components/ApprovalGate';
import PreApprovalChecklist from './components/PreApprovalChecklist';

import { auditFigmaAndBrazeCopy, auditSpamAndDeliverability, predictCampaignEngagement } from './services/gemini';
import { fetchFigmaTextLayers } from './services/figma';
import { validateLiquidSyntax, auditHtmlLinks, checkWcagContrast, auditImages } from './utils/validators';

const DEFAULT_SUBJECT = 'Your welcome reward is ready';
const DEFAULT_FIGMA_TEXTS = [
  'Northstar Rewards',
  'Your welcome reward is ready',
  'Explore your new member benefits and available offers.',
  'Valid for 14 days'
];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Northstar Rewards Welcome</title>
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
      <h1 style="margin: 0; font-size: 24px;">Northstar Rewards</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #002d62;">Welcome, {{ user.first_name | default: 'Valued Customer' }}!</h2>
      <p>We loaded a special reward into your account to say thanks for being an app member.</p>
      
      <!-- Liquid conditional logic block -->
      {% if tier == 'Gold' %}
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <strong style="color: #b45309;">🌟 VIP GOLD MEMBERS-ONLY PERK:</strong><br>
          An exclusive welcome reward is available for Gold members. Enjoy your double-points day!
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
        <a href="http://example.com/redeem" style="background-color: #f43f5e; color: #ffffff;" class="btn">View Welcome Offer</a>
      </p>

      <p style="font-size: 14px; color: #475569; text-align: center; margin-top: 20px; border-top: 1px dashed #e5e7eb; padding-top: 15px;">
        Use offer code: <strong>{{ campaign.coupon_code | default: 'WELCOME-2026' }}</strong><br>
        Offer Expires: <strong>{{ campaign.expiry_date | default: 'December 31, 2026' }}</strong>
      </p>

      <p>This offer is valid for 7 days at participating locations.</p>
    </div>
    <div class="footer">
      <p>© 2026 Northstar Rewards. If you wish to unsubscribe, click <a href="#" style="color: #94a3b8;">here</a>.</p>
    </div>
  </div>
</body>
</html>`;

const PRIMARY_TABS = ['overview', 'automation', 'review', 'library', 'settings'];
const REVIEW_TABS = ['copy', 'technical', 'preapproval', 'approval'];

function normalizePrimaryTab(hashTab) {
  if (PRIMARY_TABS.includes(hashTab)) return hashTab;
  if (hashTab === 'workspace' || hashTab === 'checklist') return 'automation';
  if (REVIEW_TABS.includes(hashTab)) return 'review';
  if (hashTab === 'catalog') return 'library';
  if (hashTab === 'visuals' || hashTab === 'ab_evaluator') return 'review';
  return 'overview';
}

function normalizeReviewTab(hashTab) {
  return REVIEW_TABS.includes(hashTab) ? hashTab : 'copy';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hashTab = window.location.hash.replace('#', '');
    return normalizePrimaryTab(hashTab);
  });
  const [activeReviewTab, setActiveReviewTab] = useState(() => {
    const hashTab = window.location.hash.replace('#', '');
    return normalizeReviewTab(hashTab);
  });
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

  useEffect(() => {
    const hashTarget = activeTab === 'review' ? activeReviewTab : activeTab;
    if (window.location.hash.replace('#', '') !== hashTarget) {
      window.history.replaceState(null, '', `#${hashTarget}`);
    }
  }, [activeTab, activeReviewTab]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openReviewTab = (tab) => {
    let nextTab = REVIEW_TABS.includes(tab) ? tab : tab === 'technical' ? 'technical' : 'copy';
    if (unifiedQAMode && (nextTab === 'copy' || nextTab === 'technical')) {
      nextTab = 'preapproval';
    }
    setActiveReviewTab(nextTab);
    setActiveTab('review');
  };

  const openPrimaryTab = (tab) => {
    if (tab === 'review') {
      openReviewTab(activeReviewTab);
      return;
    }
    setActiveTab(tab);
  };

  const handleOverviewNavigation = (tab) => {
    if (PRIMARY_TABS.includes(tab)) {
      setActiveTab(tab);
    } else {
      openReviewTab(tab);
    }
  };

  // Campaign data states
  const [subjectLine, setSubjectLine] = useState(DEFAULT_SUBJECT);
  const [figmaTexts, setFigmaTexts] = useState(DEFAULT_FIGMA_TEXTS);
  const [brazeHtml, setBrazeHtml] = useState(DEFAULT_HTML);
  const [pushBody, setPushBody] = useState('Your welcome reward is ready. Open the app to explore your new member benefits.');
  const [smsBody, setSmsBody] = useState('Northstar Rewards: Welcome {{ user.first_name | default: \'Valued Customer\' }}! Your member offer is ready: http://example.com/redeem');
  const [iamHeader, setIamHeader] = useState('Your welcome reward is ready');
  const [iamBody, setIamBody] = useState('Explore your new member benefits and available offers. Valid for 14 days.');
  const [iamButtonText, setIamButtonText] = useState('View Offer');
  const [iamButtonLink, setIamButtonLink] = useState('http://example.com/redeem');

  // API response logs
  const [copyAuditResults, setCopyAuditResults] = useState(null);
  const [spamAuditResults, setSpamAuditResults] = useState(null);

  // Scores state (initialized to the exact pre-calculated score of default campaign)
  const [scores, setScores] = useState({
    overall: 61,
    copy: 58,
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
  const [automationState, setAutomationState] = useState(null);
  const [preApprovalStatus, setPreApprovalStatus] = useState({ complete: 0, total: 0, ready: false });
  const [unifiedQAMode, setUnifiedQAMode] = useState(() => {
    return localStorage.getItem('omniqa_unified_qa') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('omniqa_unified_qa', unifiedQAMode);
    if (unifiedQAMode && (activeReviewTab === 'copy' || activeReviewTab === 'technical')) {
      setActiveReviewTab('preapproval');
    }
  }, [unifiedQAMode, activeReviewTab]);

  const handleAutomationAuditChange = useCallback((nextState) => setAutomationState(nextState), []);
  const handleApprovalChange = useCallback((approval) => setAutomationState((current) => current ? { ...current, approval } : current), []);
  const handlePreApprovalChange = useCallback((status) => setPreApprovalStatus(status), []);

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
    setActiveTab('review');
  };

  const handleSelectAutomatedMessage = (message, openReview = false) => {
    setFigmaTexts([]);
    if (!message) return;
    const channel = message.channel || '';
    if (channel === 'email') {
      setSubjectLine(message.subject || '');
      setBrazeHtml(message.body || '');
    } else if (channel === 'sms') {
      setSmsBody(message.body || '');
    } else if (channel === 'in_app_message') {
      setIamHeader(message.title || '');
      setIamBody(message.body || '');
      setIamButtonLink(message.actionUrl || '');
    } else if (channel && channel.includes('push')) {
      setPushBody(message.body || '');
    }
    if (openReview) {
      if (unifiedQAMode) {
        setActiveReviewTab('preapproval');
      } else {
        setActiveReviewTab('copy');
      }
      setActiveTab('review');
    }
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

      const overallScoreVal = Math.round(
        (copyScoreVal + techScoreVal + spamScoreVal) / 3
      );

      setScores({
        overall: overallScoreVal,
        copy: copyScoreVal,
        tech: techScoreVal,
        spam: spamScoreVal
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
  const activeTitle = {
    overview: 'Campaign Overview',
    automation: 'Automated QA',
    review: 'QA Review',
    library: 'Campaign Library',
    settings: 'Settings'
  }[activeTab];
  const activeDescription = {
    overview: 'See campaign health, open issues, channel readiness, and report actions in one place.',
    automation: '',
    review: 'Run focused checks for launch risk, copy alignment, Liquid, links, and deliverability.',
    library: 'Load campaign examples or save reusable campaign states for repeat review.',
    settings: 'Manage sandbox mode and secure integration settings.'
  }[activeTab];

  return (
    <>
      <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">OQ</div>
          <span className="sidebar-logo-text">OmniQA</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => openPrimaryTab('overview')}
          >
            <BarChart2 size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => openPrimaryTab('automation')}
          >
            <ListChecks size={18} />
            <span>Automated QA</span>
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => openPrimaryTab('review')}
          >
            <ShieldCheck size={18} />
            <span>QA Review</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => openPrimaryTab('library')}
          >
            <Database size={18} />
            <span>Library</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => openPrimaryTab('settings')}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="mode-pill">
            <div style={{
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: useMockMode ? 'var(--accent-cyan)' : 'var(--success)',
              boxShadow: `0 0 8px ${useMockMode ? 'var(--accent-cyan)' : 'var(--success)'}`
            }} />
            <span>
              {useMockMode ? 'Demo Sandbox Mode' : 'Live Connected Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>{activeTitle}</h1>
            {activeDescription && <p className="header-title-desc">{activeDescription}</p>}
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

        {activeTab === 'overview' && (
          <Overview
            overallScore={scores.overall}
            copyScore={scores.copy}
            techScore={scores.tech}
            spamScore={scores.spam}
            issuesCount={issuesCount}
            setActiveTab={handleOverviewNavigation}
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
            automationState={automationState}
            useMockMode={useMockMode}
          />
        )}

        {activeTab === 'automation' && (
          <AutomatedQA
            useMockMode={useMockMode}
            onAuditChange={handleAutomationAuditChange}
            onSelectMessage={handleSelectAutomatedMessage}
            figmaTexts={figmaTexts}
            unifiedQAMode={unifiedQAMode}
            setUnifiedQAMode={setUnifiedQAMode}
          />
        )}

        {activeTab === 'review' && (
          <section className="review-center">
            {(!automationState || !automationState.journey) ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', minHeight: '450px' }}>
                <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '600px', width: '100%', padding: '3rem 2rem' }}>
                  <div style={{ padding: '1.25rem', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.08)', color: 'var(--accent-cyan)', display: 'inline-flex' }}>
                    <ShieldCheck size={40} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: '700' }}>No Active Campaign Loaded</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                      Before running granular QA reviews, checklists, and approvals, please navigate to the Automated QA tab and import a Campaign/Canvas link or load a sandbox demo.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setActiveTab('automation')} style={{ minWidth: '200px' }}>
                    Go to Automated QA
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="review-tabs" aria-label="QA review tools">
                  {!unifiedQAMode && (
                    <>
                      <button className={`review-tab ${activeReviewTab === 'copy' ? 'active' : ''}`} onClick={() => setActiveReviewTab('copy')}>
                        Message QA
                      </button>
                      <button className={`review-tab ${activeReviewTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveReviewTab('technical')}>
                        Technical
                      </button>
                    </>
                  )}
                  <button className={`review-tab ${activeReviewTab === 'preapproval' ? 'active' : ''}`} onClick={() => setActiveReviewTab('preapproval')}>
                    Pre-Approval
                  </button>
                  <button className={`review-tab ${activeReviewTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveReviewTab('approval')}>
                    Approval
                  </button>
                </div>

                {activeReviewTab === 'copy' && !unifiedQAMode && (
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

                {activeReviewTab === 'technical' && !unifiedQAMode && (
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

                {activeReviewTab === 'approval' && (
                  <ApprovalGate automationState={automationState} preApprovalStatus={preApprovalStatus} onApprovalChange={handleApprovalChange} />
                )}

                {activeReviewTab === 'preapproval' && (
                  <PreApprovalChecklist automationState={automationState} onStatusChange={handlePreApprovalChange} />
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'library' && (
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
