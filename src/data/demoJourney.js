export const onboardingDemo = {
  id: 'demo-onboarding-canvas',
  type: 'canvas',
  name: 'New Member Onboarding Journey',
  description: 'A multi-channel onboarding flow with copy discrepancy checks.',
  source: 'sandbox',
  draft: true,
  enabled: false,
  scheduleType: 'action_based',
  tags: ['onboarding', 'qa-demo'],
  conversionBehaviors: [
    { type: 'Performs Custom Event', window: 604800, custom_event_name: 'first_purchase' }
  ],
  steps: [
    {
      id: 'step-welcome',
      name: 'Day 0 Welcome',
      type: 'message',
      messages: [
        {
          id: 'welcome-email-a',
          stepId: 'step-welcome',
          stepName: 'Day 0 Welcome',
          name: 'Welcome Email - Variant A',
          channel: 'email',
          subject: 'Welcome, {{${first_name} | default: "there"}}',
          preheader: 'Your membership benefits are ready.',
          body: '<html><body><h1>Welcome!</h1><p>Explore your new benefits.</p><a href="https://example.org/benefits?utm_source=braze&utm_medium=email&utm_campaign=onboarding">View benefits</a><img src="https://images.example.org/welcome.jpg" alt="Welcome offer"></body></html>',
          from: 'Brand Rewards <rewards@example.org>',
          replyTo: 'support@example.org'
        },
        {
          id: 'welcome-push-a',
          stepId: 'step-welcome',
          stepName: 'Day 0 Welcome',
          name: 'Welcome Push',
          channel: 'push',
          title: 'Your benefits are ready',
          body: 'Open the app to see your new member benefits.',
          actionUrl: 'app://benefits'
        }
      ]
    },
    {
      id: 'step-offer',
      name: 'Day 2 Offer',
      type: 'message',
      messages: [
        {
          id: 'offer-email',
          stepId: 'step-offer',
          stepName: 'Day 2 Offer',
          name: 'Offer Email',
          channel: 'email',
          subject: 'A member offer selected for you',
          preheader: '',
          body: '<html><body><h1>Your offer is here</h1><p>Valid for 7 days.</p><a href="https://placeholder.com/redeem">Redeem now</a><img src="https://images.example.org/offer.jpg"></body></html>',
          from: 'Brand Rewards <rewards@example.org>',
          replyTo: 'support@example.org'
        },
        {
          id: 'offer-sms',
          stepId: 'step-offer',
          stepName: 'Day 2 Offer',
          name: 'Offer SMS',
          channel: 'sms',
          body: 'Your member offer is ready: https://example.org/redeem'
        }
      ]
    },
    {
      id: 'step-survey',
      name: 'Day 42 Survey',
      type: 'message',
      messages: [
        {
          id: 'survey-iam',
          stepId: 'step-survey',
          stepName: 'Day 42 Survey',
          name: 'Feedback Survey',
          channel: 'in_app_message',
          title: 'Tell us what you think',
          body: 'Complete a short survey about your onboarding experience.',
          actionUrl: 'https://example.org/survey?utm_source=braze&utm_medium=iam&utm_campaign=onboarding'
        }
      ]
    }
  ]
};

export const reengagementDemo = {
  id: 'demo-reengagement-campaign',
  type: 'campaign',
  name: 'Flash Sale Re-engagement Campaign',
  description: 'An urgent promotional push/SMS campaign with liquid warnings.',
  source: 'sandbox',
  draft: true,
  enabled: false,
  scheduleType: 'scheduled',
  tags: ['promo', 're-engage'],
  conversionBehaviors: [
    { type: 'Performs Custom Event', window: 86400, custom_event_name: 'purchase' }
  ],
  steps: [
    {
      id: 'campaign-messages',
      name: 'Campaign Messages',
      type: 'message',
      messages: [
        {
          id: 'reengage-push',
          stepId: 'campaign-messages',
          stepName: 'Campaign Messages',
          name: 'Urgent Push Alert',
          channel: 'push',
          title: '🔥 FLASH SALE: 24 Hours Only!!!',
          body: 'Hey {{user.first_name}}! Don\'t miss out on free shipping and 30% off your next checkout order. Delays will block your rewards!',
          actionUrl: 'app://flash-sale'
        },
        {
          id: 'reengage-sms',
          stepId: 'campaign-messages',
          stepName: 'Campaign Messages',
          name: 'Urgent SMS Variant',
          channel: 'sms',
          body: 'OmniQA Rewards: Use code REENGAGE30 for 30% off! Closes soon! Redeem at http://example.com/reengage'
        }
      ]
    }
  ]
};

export const abandonmentDemo = {
  id: 'demo-abandonment-canvas',
  type: 'canvas',
  name: 'Cart Abandonment Rescue Canvas',
  description: 'A checkout recovery flow containing broken liquid delimiters.',
  source: 'sandbox',
  draft: true,
  enabled: false,
  scheduleType: 'action_based',
  tags: ['lifecycle', 'cart-abandonment'],
  conversionBehaviors: [
    { type: 'Performs Custom Event', window: 172800, custom_event_name: 'checkout' }
  ],
  steps: [
    {
      id: 'step-cart-email',
      name: 'Abandoned Cart Email Step',
      type: 'message',
      messages: [
        {
          id: 'cart-email-1',
          stepId: 'step-cart-email',
          stepName: 'Abandoned Cart Email Step',
          name: 'Cart Recovery Email',
          channel: 'email',
          subject: 'Did you forget something? {{user.first_name',
          preheader: 'Your cart is waiting for you.',
          body: '<div style="color:#ffffff; background:#ffffff;"><h1>Complete your order</h1><p>We saved your cart items.</p><a href="http://example.com/checkout">Return to Checkout</a></div>',
          from: 'support@brand.com'
        }
      ]
    },
    {
      id: 'step-cart-push',
      name: 'Abandoned Cart Push Step',
      type: 'message',
      messages: [
        {
          id: 'cart-push-1',
          stepId: 'step-cart-push',
          stepName: 'Abandoned Cart Push Step',
          name: 'Cart Recovery Push',
          channel: 'push',
          title: 'Still interested?',
          body: 'We are holding your items for a limited time. Return to checkout now!'
        }
      ]
    }
  ]
};

export const demoJourneys = [onboardingDemo, reengagementDemo, abandonmentDemo];
