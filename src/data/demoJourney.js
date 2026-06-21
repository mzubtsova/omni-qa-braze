export const demoJourney = {
  id: 'demo-onboarding-canvas',
  type: 'canvas',
  name: 'New Member Onboarding Journey',
  description: 'A safe multistage fixture used to demonstrate automated pre-deployment QA.',
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
