/**
 * Service client for Gemini API integrations in OmniQA for Braze.
 */

async function callGemini(prompt, apiKey, systemInstruction = '') {
  if (apiKey) {
    console.warn('Browser-provided Gemini keys are no longer used. Configure GEMINI_API_KEY on the server instead.');
  }

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Gemini request failed with status ${response.status}.`);
  }

  return data.result;
}

/**
 * Runs a comparative copy audit between Figma text and Braze HTML
 */
export async function auditFigmaAndBrazeCopy({ 
  figmaTexts, 
  brazeHtml, 
  subjectLine,
  pushBody,
  smsBody,
  iamHeader,
  iamBody,
  iamButtonText
}, apiKey) {
  if (!apiKey) {
    return getMockCopyAudit(
      figmaTexts, 
      brazeHtml, 
      subjectLine, 
      pushBody, 
      smsBody, 
      iamHeader, 
      iamBody, 
      iamButtonText
    );
  }

  const systemInstruction = `You are a professional copyeditor and campaign QA auditor.
Compare a list of text layers extracted from a Figma design mock against the HTML copy, subject line, push notification copy, SMS copy, and In-App Message (IAM) copy of a Braze campaign.
Identify discrepancies (e.g. typos, incorrect pricing/discounts, missing terms/disclaimers, punctuation errors) between the design spec (Figma) and the actual multi-channel copy.
Return your output ONLY as a JSON object matching this structure:
{
  "mismatches": [
    {
      "severity": "high", // high, medium, low
      "figmaText": "The text found in Figma",
      "brazeText": "The text found in Braze HTML or corresponding channel field",
      "message": "Detailed description explaining what is wrong (e.g. spelling mismatch, pricing typo)."
    }
  ],
  "suggestions": [
    {
      "context": "Subject line, Push notification, SMS, IAM, or section header",
      "suggestion": "Recommendation to improve clarity, grammar, or alignment."
    }
  ]
}`;

  const prompt = `Figma Design Text Nodes:
${figmaTexts.map((t, idx) => `${idx + 1}. "${t}"`).join('\n')}

Braze Campaign Subject Line:
"${subjectLine}"

Braze Campaign HTML Body:
${brazeHtml}

Braze Push Notification Body:
"${pushBody}"

Braze SMS Body:
"${smsBody}"

Braze In-App Message Header:
"${iamHeader}"

Braze In-App Message Body:
"${iamBody}"

Braze In-App Message Button Text:
"${iamButtonText}"

Perform a rigorous text comparison across all channels and return the logs inside the JSON structure.`;

  return callGemini(prompt, apiKey, systemInstruction);
}

/**
 * Runs an deliverability spam trigger check on subject and body text
 */
export async function auditSpamAndDeliverability({ subjectLine, bodyText }, apiKey) {
  if (!apiKey) {
    return getMockSpamAudit(subjectLine, bodyText);
  }

  const systemInstruction = `You are an email deliverability consultant and spam filter QA checker.
Scan the email subject line and text copy for common trigger words that alert filters (e.g., hyper-salesy, deceptive keywords, double symbols) and rate the spam deliverability health score (0 to 100).
Return your output ONLY as a JSON object matching this structure:
{
  "spamScore": 95, // 0 to 100 where 100 means perfectly clean and 0 means certain spam folder
  "spamTriggers": [
    {
      "severity": "medium", // high, medium, low
      "phrase": "The triggered word/phrase found",
      "message": "Why this word/phrase is risky and how to rewrite it."
    }
  ]
}`;

  const prompt = `Email Subject Line: "${subjectLine}"
Email Body Text: "${bodyText}"

Scan the copy and output the deliverability analysis in the JSON structure.`;

  return callGemini(prompt, apiKey, systemInstruction);
}

/**
 * Predicts open rate, CTR, and overall engagement of campaign assets.
 */
export async function predictCampaignEngagement({
  subjectLine,
  bodyText,
  pushBody,
  smsBody,
  iamHeader,
  iamBody
}, apiKey) {
  if (!apiKey) {
    return getMockEngagementPredictor(subjectLine);
  }

  const systemInstruction = `You are a campaign optimization and engagement forecast AI.
Predict marketing performance metrics (Predicted Open Rate, Click-Through Rate, and Overall Engagement Score from 0 to 100) based on subject lines, email template, push copy, SMS, and In-App messages.
Identify why it performs well, identify drag points, and offer concrete optimization recommendations.
Return output ONLY as a JSON object:
{
  "engagementScore": 85,
  "predictedOpenRate": 24.5,
  "predictedClickRate": 4.8,
  "spamRisk": "Low",
  "positives": ["Short description of strong point 1", "Strong point 2"],
  "negatives": ["Issue or friction point 1", "Friction point 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

  const prompt = `Email Subject Line: "${subjectLine}"
Email Body Text: "${bodyText}"
Push Body: "${pushBody}"
SMS Body: "${smsBody}"
IAM Header: "${iamHeader}"
IAM Body: "${iamBody}"

Analyze these channel assets and output predicted performance in the JSON structure.`;

  return callGemini(prompt, apiKey, systemInstruction);
}

function getMockEngagementPredictor(subjectLine) {
  let score = 78;
  const lowerSubject = subjectLine ? subjectLine.toLowerCase() : '';
  if (lowerSubject.includes('free')) score += 8;
  if (lowerSubject.includes('blizzard')) score += 5;
  if (lowerSubject.includes('🍦') || lowerSubject.includes('reward')) score += 4;
  if (subjectLine && subjectLine.length > 60) score -= 10;
  
  score = Math.min(Math.max(score, 45), 98);
  const openRate = +(score * 0.3).toFixed(1);
  const clickRate = +(score * 0.06).toFixed(1);

  return {
    engagementScore: score,
    predictedOpenRate: openRate,
    predictedClickRate: clickRate,
    spamRisk: score > 75 ? "Low" : score > 60 ? "Medium" : "High",
    positives: [
      "Dynamic personalization placeholder increases user relevance.",
      "Clear Blizzard branding triggers positive psychological associations."
    ],
    negatives: [
      "Subject line contains spam-prone triggers ('Free', 'Alert').",
      "Limited direct call-to-actions in secondary channels."
    ],
    recommendations: [
      "A/B test subject lines replacing 'Free' with 'On us' to prevent delivery blocks.",
      "Inject explicit urgency modifiers (e.g. 'Valid for 14 days' directly in subject)."
    ]
  };
}

// ==========================================
// MOCK DATA GENERATORS (FALLBACKS)
// ==========================================

function getMockCopyAudit(
  figmaTexts, 
  brazeHtml, 
  subjectLine, 
  pushBody = '', 
  smsBody = '', 
  iamHeader = '', 
  iamBody = '', 
  iamButtonText = ''
) {
  const lowercaseHtml = brazeHtml.toLowerCase();
  const mismatches = [];
  const suggestions = [];

  // Extract clean lines of figma text
  const cleanFigmaLines = figmaTexts
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Extract plain text from HTML (ignoring script/style blocks and tags)
  let plainHtmlText = brazeHtml
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const plainHtmlTextLower = plainHtmlText.toLowerCase();

  // Perform dynamic comparison
  cleanFigmaLines.forEach(figmaLine => {
    const figmaLineLower = figmaLine.toLowerCase();
    
    // Check if it's already exactly matched in the HTML, subject line, or other channels
    if (plainHtmlTextLower.includes(figmaLineLower) || 
        (subjectLine && subjectLine.toLowerCase().includes(figmaLineLower)) ||
        (pushBody && pushBody.toLowerCase().includes(figmaLineLower)) ||
        (smsBody && smsBody.toLowerCase().includes(figmaLineLower)) ||
        (iamHeader && iamHeader.toLowerCase().includes(figmaLineLower)) ||
        (iamBody && iamBody.toLowerCase().includes(figmaLineLower)) ||
        (iamButtonText && iamButtonText.toLowerCase().includes(figmaLineLower))) {
      return;
    }

    // Special case 1: Tier restriction discrepancy
    if (figmaLineLower.includes('free small blizzard') && 
        (lowercaseHtml.includes('gold members') || lowercaseHtml.includes('tier') || lowercaseHtml.includes('vip'))) {
      mismatches.push({
        severity: "high",
        figmaText: figmaLine,
        brazeText: "FREE SMALL BLIZZARD coupon valid for Gold members only",
        message: "Figma design shows a generic 'FREE Small Blizzard' without tier limits, but Braze HTML enforces VIP Gold restrictions. This could cause confusion for Bronze/Standard customers."
      });
      return;
    }

    // Special case 2: Expiration mismatch
    if (figmaLineLower.includes('14 days') && lowercaseHtml.includes('7 days') && !lowercaseHtml.includes('14 days')) {
      mismatches.push({
        severity: "medium",
        figmaText: figmaLine,
        brazeText: "This offer is valid for 7 days at participating locations.",
        message: "Expiration date discrepancy: Figma design specifies 14 days, but Braze template code restricts the offer to 7 days."
      });
      return;
    }

    // General dynamic comparison
    // Tokenize the figma line into words of length >= 3
    const words = figmaLineLower.split(/\s+/).filter(w => w.length >= 3);
    if (words.length === 0) return;

    // Check all channels for clause matching
    const allChannelTexts = [
      plainHtmlText, 
      subjectLine, 
      pushBody, 
      smsBody, 
      iamHeader, 
      iamBody, 
      iamButtonText
    ].filter(Boolean);

    let bestMatchClause = null;
    let maxOverlap = 0;
    let matchedChannel = '';

    allChannelTexts.forEach(channelText => {
      // Split channel text by punctuation to get clauses
      const clauses = channelText.split(/[.,;!|]|\s\s+/).map(c => c.trim()).filter(c => c.length > 0);
      
      clauses.forEach(clause => {
        const clauseLower = clause.toLowerCase();
        let overlap = 0;
        words.forEach(word => {
          if (clauseLower.includes(word)) {
            overlap++;
          }
        });
        
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestMatchClause = clause;
          matchedChannel = channelText === plainHtmlText ? 'HTML' :
                           channelText === subjectLine ? 'Subject Line' :
                           channelText === pushBody ? 'Push Body' :
                           channelText === smsBody ? 'SMS Body' :
                           channelText === iamHeader ? 'IAM Header' :
                           channelText === iamBody ? 'IAM Body' : 'IAM Button';
        }
      });
    });

    // If we found a clause with significant overlap
    if (maxOverlap > 0 && maxOverlap >= Math.min(2, words.length)) {
      mismatches.push({
        severity: figmaLineLower.includes('free') || figmaLineLower.includes('blizzard') || figmaLineLower.includes('offer') ? 'high' : 'medium',
        figmaText: figmaLine,
        brazeText: bestMatchClause,
        message: `Text discrepancy detected in ${matchedChannel}. Figma layer text "${figmaLine}" does not match the coded text "${bestMatchClause}".`
      });
    } else {
      // Entirely missing
      mismatches.push({
        severity: 'low',
        figmaText: figmaLine,
        brazeText: 'Missing from coded channels',
        message: `Creative layout text "${figmaLine}" was not found anywhere in Email, Push, SMS, or In-App Message templates.`
      });
    }
  });

  // Dynamic Subject Line Auditing
  if (subjectLine) {
    const subjectLower = subjectLine.toLowerCase();

    // 1. Character count limit
    if (subjectLine.length > 60) {
      mismatches.push({
        severity: 'medium',
        figmaText: 'Subject Line Character Limit (< 60 chars)',
        brazeText: `${subjectLine.length} chars: "${subjectLine}"`,
        message: 'Subject line is too long. Standard mobile email clients (like iOS Mail or Gmail app) will truncate subjects over 60 characters, hiding your offer content.'
      });
    }

    // 2. Excess exclamations / marks
    if ((subjectLine.match(/!/g) || []).length > 1) {
      mismatches.push({
        severity: 'low',
        figmaText: 'Subject Punctuation Check',
        brazeText: `"${subjectLine}"`,
        message: 'Subject line contains multiple exclamation marks. This can flag spam filters and looks unprofessional.'
      });
    }

    // 3. Subject Line vs Figma Text layout mismatches
    let bestSubjectMatch = null;
    let maxSubjectOverlap = 0;
    
    cleanFigmaLines.forEach(figmaLine => {
      const figmaLineLower = figmaLine.toLowerCase();
      const figmaWords = figmaLineLower.split(/\s+/).filter(w => w.length >= 3);
      
      let overlap = 0;
      figmaWords.forEach(w => {
        if (subjectLower.includes(w)) overlap++;
      });
      
      if (overlap > maxSubjectOverlap) {
        maxSubjectOverlap = overlap;
        bestSubjectMatch = figmaLine;
      }
    });

    if (bestSubjectMatch && subjectLower !== bestSubjectMatch.toLowerCase()) {
      mismatches.push({
        severity: 'medium',
        figmaText: bestSubjectMatch,
        brazeText: subjectLine,
        message: `Subject Line text mismatch: Figma layer spec text is "${bestSubjectMatch}" but coded Braze subject line is "${subjectLine}".`
      });
    }
  }

  // Dynamic duplicate spacing and punctuation marks check in HTML body (marks check)
  if (/\s\s+/.test(brazeHtml)) {
    mismatches.push({
      severity: 'low',
      figmaText: 'Typography Spacing Spec',
      brazeText: 'Duplicated whitespace spacing detected',
      message: 'Consecutive whitespaces found in campaign HTML template. Recommend cleaning spacing to avoid formatting inconsistencies.'
    });
  }

  if (/([.,!?])\1+/.test(brazeHtml)) {
    mismatches.push({
      severity: 'low',
      figmaText: 'Creative Punctuation standard',
      brazeText: 'Duplicated punctuation marks detected',
      message: 'Consecutive punctuation marks found (e.g. "!!" or ",,"). Recommend cleaning up punctuation spacing.'
    });
  }

  if (subjectLine && (subjectLine.includes('🍦') || subjectLine.includes('🍨'))) {
    suggestions.push({
      context: "Subject Line emoji",
      suggestion: "Variant A starts with 🍦 (soft serve) while Variant B starts with 🍨. To maintain consistent brand identity for Dairy Queen, recommend using the standard soft serve cup/cone icon."
    });
  }

  if (mismatches.length === 0) {
    suggestions.push({
      context: "Copy readability",
      suggestion: "Consider breaking the main body block into two smaller paragraphs to optimize mobile scannability."
    });
  }

  return {
    mismatches,
    suggestions
  };
}

function getMockSpamAudit(subjectLine, bodyText) {
  const subjectLower = subjectLine.toLowerCase();
  const triggers = [];
  let score = 98;

  if (subjectLower.includes('free') || subjectLower.includes('alert')) {
    triggers.push({
      severity: 'medium',
      phrase: 'Free Blizzard Alert',
      message: "The word 'Free' in the subject line can trigger spam filters if combined with urgent words like 'Alert'. Recommend soft-selling (e.g. 'Get your Blizzard on us' or 'We've loaded a reward')."
    });
    score -= 10;
  }

  if (bodyText.includes('!!!') || subjectLine.includes('!')) {
    triggers.push({
      severity: 'low',
      phrase: '!!! / ! (Multiple exclamation marks)',
      message: "Excessive exclamation marks can flag spam firewalls (especially in Microsoft Exchange/Outlook filters). Try to restrict usage to a single '!' per email."
    });
    score -= 5;
  }

  return {
    spamScore: score,
    spamTriggers: triggers
  };
}
