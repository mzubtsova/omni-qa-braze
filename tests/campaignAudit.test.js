import test from 'node:test';
import assert from 'node:assert/strict';
import { auditJourneyAutomatically, canApproveAudit, normalizeBrazePayload } from '../src/utils/campaignAudit.js';

test('normalizes all campaign message variants', () => {
  const journey = normalizeBrazePayload({
    name: 'Campaign test',
    draft: true,
    messages: {
      emailA: { channel: 'email', name: 'Email A', subject: 'Hello', body: '<p>Hello</p>', from: 'qa@example.org' },
      pushA: { channel: 'ios_push', name: 'Push A', alert: 'Open the app' }
    }
  }, { type: 'campaign', id: 'campaign-1' });

  assert.equal(journey.type, 'campaign');
  assert.equal(journey.steps.length, 1);
  assert.equal(journey.steps[0].messages.length, 2);
  assert.equal(journey.steps[0].messages[1].body, 'Open the app');
});

test('normalizes multistage Canvas messages', () => {
  const journey = normalizeBrazePayload({
    name: 'Canvas test',
    draft: true,
    steps: {
      stepA: { name: 'Welcome', messages: { emailA: { channel: 'email', subject: 'Welcome', body: '<p>Welcome</p>', from: 'qa@example.org' } } },
      stepB: { name: 'Reminder', messages: { smsA: { channel: 'sms', body: 'Reminder' } } }
    }
  }, { type: 'canvas', id: 'canvas-1' });

  assert.equal(journey.steps.length, 2);
  assert.equal(journey.steps.flatMap((step) => step.messages).length, 2);
  assert.equal(journey.steps[1].messages[0].stepName, 'Reminder');
});

test('labels non-message Canvas steps by their returned type', () => {
  const journey = normalizeBrazePayload({
    name: 'Canvas with delay',
    steps: [{ id: 'delay-1', type: 'delay', messages: {} }]
  }, { type: 'canvas', id: 'canvas-delay' });

  assert.equal(journey.steps[0].name, 'Delay 1');
  assert.equal(journey.steps[0].messages.length, 0);
});

test('blocks approval when deterministic blockers remain', () => {
  const journey = normalizeBrazePayload({
    name: 'Broken campaign',
    draft: true,
    conversion_behaviors: [{ type: 'Clicks Email', window: 86400 }],
    messages: {
      broken: { channel: 'email', name: 'Broken email', subject: '', body: '', from: '' }
    }
  }, { type: 'campaign', id: 'campaign-2' });
  const audit = auditJourneyAutomatically(journey);
  const approval = {
    reviewer: 'Reviewer',
    checks: { audience: true, content: true, personalization: true, evidence: true },
    confirmHumanReview: true
  };

  assert.ok(audit.counts.blocker > 0);
  assert.equal(audit.status, 'blocked');
  assert.equal(canApproveAudit(audit, approval), false);
});

test('allows a named reviewer to approve a clean campaign', () => {
  const journey = normalizeBrazePayload({
    name: 'Clean campaign',
    draft: true,
    conversion_behaviors: [{ type: 'Clicks Email', window: 86400 }],
    messages: {
      clean: {
        channel: 'email',
        name: 'Clean email',
        subject: 'Welcome',
        preheader: 'Start here',
        body: '<p>Welcome</p><a href="https://brand.example.org/start?utm_source=braze">Start</a>',
        from: 'Brand <hello@brand.example.org>'
      }
    }
  }, { type: 'campaign', id: 'campaign-3' });
  const audit = auditJourneyAutomatically(journey);
  const approval = {
    reviewer: 'Reviewer',
    checks: { audience: true, content: true, personalization: true, evidence: true },
    confirmHumanReview: true
  };

  assert.equal(audit.counts.blocker, 0);
  assert.equal(canApproveAudit(audit, approval), true);
});
