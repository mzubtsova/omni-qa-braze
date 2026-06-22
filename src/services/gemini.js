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
    return getMockEngagementPredictor({
      subjectLine,
      bodyText,
      pushBody,
      smsBody,
      iamHeader,
      iamBody
    });
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

function getMockEngagementPredictor({
  subjectLine = '',
  bodyText = '',
  pushBody = '',
  smsBody = '',
  iamHeader = '',
  iamBody = ''
} = {}) {
  let score = 75;
  const positives = [];
  const negatives = [];

  const safeSubject = subjectLine || '';
  const safeBody = bodyText || '';
  const safePush = pushBody || '';
  const safeSms = smsBody || '';
  const safeIamHeader = iamHeader || '';
  const safeIamBody = iamBody || '';

  const allText = [safeSubject, safeBody, safePush, safeSms, safeIamHeader, safeIamBody].join(' ').toLowerCase();

  // 1. Personalization Check (Liquid delimiters)
  const hasLiquid = /\{\{[\s\S]*?\}\}/.test(allText) || /\{%[\s\S]*?%\}/.test(allText);
  const openCurly = (allText.match(/\{\{/g) || []).length;
  const closeCurly = (allText.match(/\}\}/g) || []).length;
  const openPercent = (allText.match(/\{%/g) || []).length;
  const closePercent = (allText.match(/%\}/g) || []).length;
  const hasBrokenLiquid = openCurly !== closeCurly || openPercent !== closePercent || /\{\{[^}]*$/.test(safeSubject) || /\{\{[^}]*$/.test(safeBody);

  if (hasBrokenLiquid) {
    negatives.push("Personalization syntax is broken (unbalanced Liquid brackets), blocking template compilation.");
    score -= 15;
  } else if (hasLiquid) {
    positives.push("Dynamic personalization tags (e.g. name placeholders) increase user relevance.");
    score += 8;
  } else {
    negatives.push("Lacks dynamic personalization attributes. Static copy may reduce user conversion rates.");
    score -= 6;
  }

  // 2. Subject Line Length and Quality Check
  if (safeSubject) {
    if (safeSubject.length > 60) {
      negatives.push(`Subject line is long (${safeSubject.length} chars) and will likely be truncated on mobile viewports.`);
      score -= 8;
    } else if (safeSubject.length >= 20 && safeSubject.length <= 55) {
      positives.push(`Subject line length (${safeSubject.length} chars) is highly optimized for maximum mobile email client visibility.`);
      score += 5;
    } else {
      positives.push(`Subject line length (${safeSubject.length} chars) fits within mobile viewport constraints.`);
      score += 2;
    }

    const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(safeSubject) || /[\u2600-\u27BF]/.test(safeSubject);
    if (hasEmoji) {
      positives.push("Emoji usage in subject line adds strong visual cue in crowded user inboxes.");
      score += 3;
    }
  } else if (safeBody) {
    negatives.push("Email template is configured, but the subject line is missing. This blocks campaign delivery.");
    score -= 12;
  }

  // 3. Multi-channel Configuration Check
  const activeChannels = [];
  if (safeSubject || safeBody) activeChannels.push('Email');
  if (safePush) activeChannels.push('Push');
  if (safeSms) activeChannels.push('SMS');
  if (safeIamHeader || safeIamBody) activeChannels.push('In-App');

  if (activeChannels.length >= 3) {
    positives.push(`Excellent multi-channel orchestration (${activeChannels.join(', ')}). Cross-channel touchpoints boost CTR.`);
    score += 8;
  } else if (activeChannels.length === 1) {
    negatives.push(`Single-channel campaign (${activeChannels[0]}) limits user reach. Consider combining with Push or SMS.`);
    score -= 5;
  } else if (activeChannels.length === 2) {
    positives.push(`Good multi-channel orchestration (${activeChannels.join(' + ')}) targeting diverse subscriber channels.`);
    score += 4;
  }

  // 4. Spam words & Exclamation checks
  const spamTriggers = [];
  if (allText.includes('free')) spamTriggers.push('free');
  if (allText.includes('alert')) spamTriggers.push('alert');
  if (allText.includes('urgent')) spamTriggers.push('urgent');
  if (allText.includes('winner')) spamTriggers.push('winner');
  if (allText.includes('!!!')) spamTriggers.push('!!!');

  if (spamTriggers.length > 0) {
    negatives.push(`Copy contains potential spam-prone trigger terms ('${spamTriggers.join("', '")}'), posing deliverability risks.`);
    score -= (spamTriggers.length * 3);
  } else {
    positives.push("Copy design is clean and maintains high deliverability by avoiding hyper-salesy spam flags.");
    score += 4;
  }

  // 5. Call-To-Action (CTA) Verbs
  const ctaVerbs = ['click', 'redeem', 'shop', 'get', 'discover', 'explore', 'view', 'open', 'buy', 'claim', 'complete', 'download'];
  const hasCta = ctaVerbs.some(word => allText.includes(word)) || allText.includes('http');
  if (hasCta) {
    positives.push("Clear, action-oriented directives (e.g. 'Redeem', 'Explore') incentivize user click-through rate.");
    score += 6;
  } else {
    negatives.push("Calls-to-action (CTAs) are weak or absent; users may be unsure about target steps.");
    score -= 5;
  }

  // 6. Time Urgency
  const urgencyWords = ['now', 'limited time', 'expires', 'expire', 'soon', 'hours', 'today', 'flash', 'sale', 'fast'];
  const hasUrgency = urgencyWords.some(word => allText.includes(word));
  if (hasUrgency) {
    positives.push("Urgent or time-bound phrasing ('expires soon', 'flash sale') encourages immediate action.");
    score += 4;
  } else {
    negatives.push("Lacks time urgency context; subscribers may delay response without a clear campaign deadline.");
    score -= 3;
  }

  // Final Score Clamping & Rate Derivation
  score = Math.min(Math.max(score, 45), 98);
  const openRate = +(score * 0.3).toFixed(1);
  const clickRate = +(score * 0.06).toFixed(1);
  
  // Determine spam risk based on triggers and score
  let spamRisk = "Low";
  if (spamTriggers.length >= 2 || score < 60) {
    spamRisk = "High";
  } else if (spamTriggers.length > 0 || score < 75) {
    spamRisk = "Medium";
  }

  // Fallback checks
  if (positives.length === 0) {
    positives.push("Clean campaign typography layout and legible copy structure.");
  }
  if (negatives.length === 0) {
    negatives.push("Add secondary CTA link variations to target passive customer segments.");
  }

  return {
    engagementScore: score,
    predictedOpenRate: openRate,
    predictedClickRate: clickRate,
    spamRisk,
    positives,
    negatives
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
    if (figmaLineLower.includes('welcome reward') &&
        (lowercaseHtml.includes('gold members') || lowercaseHtml.includes('tier') || lowercaseHtml.includes('vip'))) {
      mismatches.push({
        severity: "high",
        figmaText: figmaLine,
        brazeText: "An exclusive welcome reward is available for Gold members",
        message: "The design presents a general welcome reward, but the coded message limits it to Gold members. Confirm that the eligibility language matches the intended audience."
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
        severity: figmaLineLower.includes('free') || figmaLineLower.includes('reward') || figmaLineLower.includes('offer') ? 'high' : 'medium',
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

  if (subjectLine && /[🎁✨]/u.test(subjectLine)) {
    suggestions.push({
      context: "Subject Line emoji",
      suggestion: "Keep the subject-line emoji consistent across variants so the campaign maintains one recognizable visual cue."
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
      phrase: 'Free reward alert',
      message: "The word 'Free' in the subject line can trigger spam filters if combined with urgent words like 'Alert'. Consider softer wording such as 'Your reward is ready'."
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
