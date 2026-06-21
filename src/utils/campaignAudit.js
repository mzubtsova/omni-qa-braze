import { auditHtmlLinks, auditImages, checkWcagContrast, validateLiquidSyntax } from './validators.js';

const CHANNEL_LABELS = {
  email: 'Email',
  ios_push: 'Push',
  android_push: 'Push',
  push: 'Push',
  sms: 'SMS',
  in_app_message: 'In-App Message',
  content_card: 'Content Card',
  content_cards: 'Content Card',
  webhook: 'Webhook',
  whatsapp: 'WhatsApp',
  control: 'Control'
};

const severityWeight = { blocker: 24, high: 14, medium: 7, low: 3 };

function safeObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.entries(value).map(([id, item]) => ({ id, ...safeObject(item) }));
  return [];
}

function textFrom(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
}

function normalizeChannel(channel = '') {
  const clean = String(channel).toLowerCase().replace(/-/g, '_');
  if (clean.includes('push')) return clean.includes('ios') ? 'ios_push' : clean.includes('android') ? 'android_push' : 'push';
  if (clean.includes('email')) return 'email';
  if (clean.includes('sms')) return 'sms';
  if (clean.includes('in_app') || clean === 'iam') return 'in_app_message';
  if (clean.includes('content_card')) return 'content_card';
  if (clean.includes('webhook')) return 'webhook';
  if (clean.includes('whatsapp')) return 'whatsapp';
  if (clean.includes('control')) return 'control';
  return clean || 'unknown';
}

export function normalizeMessage(rawMessage, context = {}) {
  const raw = safeObject(rawMessage);
  const channel = normalizeChannel(raw.channel || raw.type || context.channel);
  return {
    id: raw.id || raw.message_variation_id || context.id || crypto.randomUUID(),
    stepId: context.stepId || raw.step_id || '',
    stepName: context.stepName || raw.step_name || '',
    name: raw.name || raw.title || `${CHANNEL_LABELS[channel] || 'Message'} variant`,
    channel,
    subject: textFrom(raw.subject),
    preheader: textFrom(raw.preheader),
    title: channel.includes('push') ? textFrom(raw.title) : textFrom(raw.header || raw.title),
    body: textFrom(raw.body || raw.message || raw.alert || raw.body_text || raw.data),
    from: textFrom(raw.from),
    replyTo: textFrom(raw.reply_to || raw.replyTo),
    actionUrl: textFrom(raw.action || raw.url || raw.click_action || raw.uri),
    imageUrl: textFrom(raw.image_url || raw.large_image_url),
    extras: safeObject(raw.extras),
    raw
  };
}

function extractMessagesFromStep(step) {
  const rawStep = safeObject(step);
  const candidates = [];
  const messageContainers = [rawStep.messages, rawStep.variants, rawStep.message, rawStep.message_variations];
  messageContainers.forEach((container) => {
    asArray(container).forEach((message) => candidates.push(message));
  });

  if (!candidates.length && (rawStep.channel || rawStep.subject || rawStep.body || rawStep.message || rawStep.alert)) {
    candidates.push(rawStep);
  }

  return candidates.map((message, index) => normalizeMessage(message, {
    id: message.id || `${rawStep.id || 'step'}-${index + 1}`,
    stepId: rawStep.id || rawStep.step_id || '',
    stepName: rawStep.name || rawStep.step_name || rawStep.type || 'Canvas step',
    channel: message.channel || rawStep.channel
  }));
}

export function normalizeBrazePayload(payload, source = {}) {
  const raw = safeObject(payload);
  const inferredType = source.type || (raw.steps ? 'canvas' : 'campaign');
  let steps = [];

  if (inferredType === 'canvas') {
    steps = asArray(raw.steps).map((step, index) => {
      const stepType = String(step.type || 'canvas').replace(/[_-]+/g, ' ').trim();
      return {
      id: step.id || step.step_id || `step-${index + 1}`,
      name: step.name || step.step_name || `${stepType.replace(/\b\w/g, (letter) => letter.toUpperCase())} ${index + 1}`,
      type: step.type || 'step',
      messages: extractMessagesFromStep(step),
      raw: step
      };
    });
  } else {
    const messages = asArray(raw.messages).map((message, index) => normalizeMessage(message, {
      id: message.id || `message-${index + 1}`,
      stepId: 'campaign-messages',
      stepName: 'Campaign messages'
    }));
    steps = [{ id: 'campaign-messages', name: 'Campaign messages', type: 'message', messages }];
  }

  return {
    id: raw.id || raw.canvas_id || raw.campaign_id || source.id || '',
    type: inferredType,
    name: raw.name || `${inferredType === 'canvas' ? 'Canvas' : 'Campaign'} QA`,
    description: raw.description || '',
    source: source.source || 'braze',
    sourceUrl: source.url || '',
    draft: Boolean(raw.draft),
    enabled: Boolean(raw.enabled),
    archived: Boolean(raw.archived),
    scheduleType: raw.schedule_type || '',
    tags: asArray(raw.tags).map((tag) => typeof tag === 'string' ? tag : tag.name).filter(Boolean),
    conversionBehaviors: asArray(raw.conversion_behaviors),
    steps,
    raw
  };
}

function finding({ id, scope = 'message', severity, category, title, evidence, remediation, messageId = '', stepId = '' }) {
  return { id, scope, severity, category, title, evidence, remediation, messageId, stepId };
}

function auditLiquid(message, findings) {
  const fields = [message.subject, message.preheader, message.title, message.body].filter(Boolean);
  fields.forEach((field, fieldIndex) => {
    validateLiquidSyntax(field).forEach((issue, issueIndex) => findings.push(finding({
      id: `${message.id}-liquid-${fieldIndex}-${issueIndex}`,
      severity: 'blocker',
      category: 'Liquid',
      title: 'Invalid Liquid syntax',
      evidence: issue.message,
      remediation: 'Correct the Liquid delimiters or control-flow pairing before approval.',
      messageId: message.id,
      stepId: message.stepId
    })));
  });
}

function auditMessage(message) {
  const findings = [];
  const channel = message.channel;
  const body = message.body || '';

  if (channel !== 'control' && channel !== 'webhook' && !body.trim()) {
    findings.push(finding({ id: `${message.id}-body`, severity: 'blocker', category: 'Content', title: 'Message body is empty', evidence: `${message.name} has no body content.`, remediation: 'Add final message content or remove the empty variant.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel === 'email' && !message.subject.trim()) {
    findings.push(finding({ id: `${message.id}-subject`, severity: 'blocker', category: 'Email', title: 'Email subject is missing', evidence: message.name, remediation: 'Add the approved subject line.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel === 'email' && !message.preheader.trim()) {
    findings.push(finding({ id: `${message.id}-preheader`, severity: 'medium', category: 'Email', title: 'Email preheader is missing', evidence: message.name, remediation: 'Add a preheader that supports the subject line.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel === 'email' && !message.from.trim()) {
    findings.push(finding({ id: `${message.id}-from`, severity: 'high', category: 'Email', title: 'Sender is missing', evidence: message.name, remediation: 'Configure the approved sender name and address.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel === 'sms' && body.length > 320) {
    findings.push(finding({ id: `${message.id}-sms-length`, severity: 'high', category: 'Channel limits', title: 'SMS exceeds 320 characters', evidence: `${body.length} characters`, remediation: 'Shorten the message and re-check segment count.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel.includes('push') && body.length > 178) {
    findings.push(finding({ id: `${message.id}-push-length`, severity: 'medium', category: 'Channel limits', title: 'Push body may truncate', evidence: `${body.length} characters`, remediation: 'Shorten the push body and verify platform previews.', messageId: message.id, stepId: message.stepId }));
  }
  if (channel === 'in_app_message' && !message.actionUrl && /button|tap|click|complete|start/i.test(body)) {
    findings.push(finding({ id: `${message.id}-iam-link`, severity: 'high', category: 'Links', title: 'IAM CTA has no action URL', evidence: body.slice(0, 120), remediation: 'Add the final deep link or web destination.', messageId: message.id, stepId: message.stepId }));
  }

  auditLiquid(message, findings);

  if (channel === 'email') {
    auditHtmlLinks(body).forEach((issue, index) => findings.push(finding({
      id: `${message.id}-link-${index}`,
      severity: issue.severity === 'high' ? 'blocker' : issue.severity,
      category: 'Links',
      title: issue.item || 'Link issue',
      evidence: issue.message,
      remediation: 'Replace placeholders, confirm the destination, and add approved tracking parameters.',
      messageId: message.id,
      stepId: message.stepId
    })));
    auditImages(body).forEach((issue, index) => findings.push(finding({
      id: `${message.id}-image-${index}`,
      severity: issue.severity,
      category: 'Images',
      title: issue.item || 'Image issue',
      evidence: issue.message,
      remediation: 'Use an approved HTTPS asset and meaningful alt text.',
      messageId: message.id,
      stepId: message.stepId
    })));
    checkWcagContrast(body).forEach((issue, index) => findings.push(finding({
      id: `${message.id}-contrast-${index}`,
      severity: issue.severity,
      category: 'Accessibility',
      title: issue.item || 'Contrast issue',
      evidence: issue.message,
      remediation: 'Update foreground or background colors to meet the approved contrast target.',
      messageId: message.id,
      stepId: message.stepId
    })));
  }

  if (message.actionUrl && /placeholder\.com|example\.com/i.test(message.actionUrl)) {
    findings.push(finding({ id: `${message.id}-action-placeholder`, severity: 'blocker', category: 'Links', title: 'Action uses a placeholder URL', evidence: message.actionUrl, remediation: 'Replace it with the approved production destination.', messageId: message.id, stepId: message.stepId }));
  }

  return findings;
}

function auditJourney(journey, messages) {
  const findings = [];
  if (!journey.name) findings.push(finding({ id: 'journey-name', scope: 'journey', severity: 'high', category: 'Configuration', title: 'Campaign name is missing', evidence: 'No campaign or Canvas name was returned.', remediation: 'Name the asset before approval.' }));
  if (!journey.draft && journey.enabled) findings.push(finding({ id: 'journey-live', scope: 'journey', severity: 'high', category: 'Safety', title: 'Imported asset is already enabled', evidence: 'The Braze response indicates that this asset is enabled.', remediation: 'Confirm that QA is being performed against the intended draft or post-launch draft.' }));
  if (!journey.conversionBehaviors.length) findings.push(finding({ id: 'journey-conversion', scope: 'journey', severity: 'medium', category: 'Measurement', title: 'No conversion behavior detected', evidence: 'The imported metadata did not include a conversion behavior.', remediation: 'Confirm the primary conversion event and window in Braze.' }));
  if (!messages.length) findings.push(finding({ id: 'journey-empty', scope: 'journey', severity: 'blocker', category: 'Configuration', title: 'No messages were imported', evidence: 'No auditable message variants were found.', remediation: 'Check the ID, API permissions, and draft version.' }));

  const signatures = new Map();
  messages.forEach((message) => {
    const signature = `${message.channel}:${message.subject}:${message.body}`.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!signature) return;
    if (signatures.has(signature)) {
      findings.push(finding({ id: `duplicate-${message.id}`, scope: 'journey', severity: 'medium', category: 'Journey logic', title: 'Duplicate message content detected', evidence: `${message.name} matches ${signatures.get(signature)}.`, remediation: 'Confirm the duplicate is intentional or update the variant.', messageId: message.id, stepId: message.stepId }));
    } else {
      signatures.set(signature, message.name);
    }
  });
  return findings;
}

export function auditJourneyAutomatically(journey) {
  const messages = journey.steps.flatMap((step) => step.messages || []);
  const findings = [...auditJourney(journey, messages), ...messages.flatMap(auditMessage)];
  const counts = findings.reduce((acc, item) => ({ ...acc, [item.severity]: (acc[item.severity] || 0) + 1 }), { blocker: 0, high: 0, medium: 0, low: 0 });
  const totalDeduction = findings.reduce((sum, item) => sum + (severityWeight[item.severity] || 0), 0);
  const score = Math.max(0, 100 - totalDeduction);
  const status = counts.blocker > 0 ? 'blocked' : counts.high > 0 ? 'needs-review' : 'ready-for-approval';
  return {
    id: `audit-${journey.id || 'journey'}`,
    journeyId: journey.id,
    generatedAt: new Date().toISOString(),
    score,
    status,
    counts,
    messageCount: messages.length,
    stepCount: journey.steps.length,
    channelCount: new Set(messages.map((message) => message.channel)).size,
    findings,
    messages
  };
}

export function getChannelLabel(channel) {
  return CHANNEL_LABELS[channel] || channel || 'Unknown';
}

export function canApproveAudit(audit, approval) {
  const allChecksComplete = Object.values(approval.checks || {}).every(Boolean);
  return Boolean(
    audit &&
    audit.counts.blocker === 0 &&
    approval.reviewer?.trim() &&
    allChecksComplete &&
    approval.confirmHumanReview
  );
}
