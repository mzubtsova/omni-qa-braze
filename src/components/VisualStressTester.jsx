import { useState, useEffect } from 'react';
import { Smartphone, Layers, Sliders, Tablet, Laptop, Maximize2, X, Sun, Moon, Bell, MessageSquare, Mail, Sparkles } from 'lucide-react';

const isGSM7 = (str) => {
  const gsm7Regex = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡¿ÄÖÑÜ§à^{}[\\\]~|€]*$/;
  return gsm7Regex.test(str);
};

export default function VisualStressTester({ 
  brazeHtml, 
  subjectLine, 
  theme,
  pushBody,
  setPushBody,
  smsBody,
  setSmsBody,
  iamHeader,
  setIamHeader,
  iamBody,
  setIamBody,
  iamButtonText,
  setIamButtonText,
  iamButtonLink,
  setIamButtonLink
}) {
  const [segment, setSegment] = useState('default');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedSubject, setRenderedSubject] = useState('');
  const [renderedPushBody, setRenderedPushBody] = useState('');
  const [renderedSmsBody, setRenderedSmsBody] = useState('');
  const [renderedIamHeader, setRenderedIamHeader] = useState('');
  const [renderedIamBody, setRenderedIamBody] = useState('');
  const [renderedIamButtonText, setRenderedIamButtonText] = useState('');
  
  const [device, setDevice] = useState('iphone'); // 'iphone', 'android', 'tablet', 'laptop'
  const [iframeTheme, setIframeTheme] = useState('light'); // 'light' or 'dark'
  const [showFigmaFullscreen, setShowFigmaFullscreen] = useState(false);
  const [showIframeFullscreen, setShowIframeFullscreen] = useState(false);
  
  const [activeChannel, setActiveChannel] = useState('email'); // 'email', 'push', 'sms', 'iam'
  const [pushOS, setPushOS] = useState('ios'); // 'ios' or 'android'
  const [customName, setCustomName] = useState('');
  const [pushFullScreen, setPushFullScreen] = useState(true); // true = Lockscreen, false = Banner
  const [iamStyle, setIamStyle] = useState('modal'); // 'modal', 'slideup', 'fullscreen'

  useEffect(() => {
    if (activeChannel === 'push' && device === 'laptop') {
      setDevice('iphone');
    }
  }, [activeChannel, device]);

  const isDarkTheme = theme === 'dark';
  const figmaBg = isDarkTheme ? '#111827' : '#ffffff';
  const figmaStroke = 'var(--accent-cyan)';
  const figmaLineColor = isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(15, 23, 42, 0.15)';
  const figmaRectColor1 = isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(15, 23, 42, 0.08)';
  const figmaRectColor2 = isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.04)';
  const figmaDashBg = isDarkTheme ? 'rgba(255,255,255,0.01)' : 'rgba(15, 23, 42, 0.01)';
  const figmaOverlayBg = isDarkTheme ? 'rgba(6, 182, 212, 0.05)' : 'rgba(6, 182, 212, 0.02)';

  // Expand Liquid tags client-side for sandbox simulation
  useEffect(() => {
    if (!brazeHtml) return;

    let firstName = customName ? customName : 'Valued Customer';
    let showVipDetails = false;
    let cartItems = [];
    let isSpanish = false;

    if (segment === 'long_name' && !customName) {
      firstName = 'Hubert Wolfeschlegelsteinhausenbergerdorff';
    } else if (segment === 'null_fallback' && !customName) {
      firstName = '';
    } else if (segment === 'gold_tier') {
      if (!customName) {
        firstName = 'Marina';
      }
      showVipDetails = true;
    } else if (segment === 'cart_loop') {
      firstName = customName ? customName : 'Alex';
      cartItems = [
        { name: 'Oreo Blizzard 🍦', price: '$4.99', qty: 1 },
        { name: 'Choco Brownie Blizzard 🍫', price: '$5.49', qty: 2 },
        { name: 'Strawberry Cheesecake Blizzard 🍓', price: '$5.99', qty: 1 }
      ];
    } else if (segment === 'localization_es') {
      firstName = customName ? customName : 'Carlos';
      isSpanish = true;
    }

    // Basic Liquid interpreter for rendering simulation
    let processedHtml = brazeHtml;
    
    // Resolve: {{ user.first_name | default: 'Valued Customer' }}
    processedHtml = processedHtml.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
      return firstName || fallback;
    });

    // Resolve: {{ user.first_name }}
    processedHtml = processedHtml.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);

    // Resolve: {{ campaign.coupon_code | default: '...' }}
    processedHtml = processedHtml.replace(/\{\{\s*campaign\.coupon_code\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, 'DQ-BLIZZARD-SUMMER26');
    // Resolve: {{ campaign.coupon_code }}
    processedHtml = processedHtml.replace(/\{\{\s*campaign\.coupon_code\s*\}\}/g, 'DQ-BLIZZARD-SUMMER26');

    // Resolve: {{ campaign.expiry_date | default: '...' }}
    const expiryDateStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    processedHtml = processedHtml.replace(/\{\{\s*campaign\.expiry_date\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, expiryDateStr);
    // Resolve: {{ campaign.expiry_date }}
    processedHtml = processedHtml.replace(/\{\{\s*campaign\.expiry_date\s*\}\}/g, expiryDateStr);

    // Resolve: {% if cart.items %} ... {% endif %}
    const cartConditionalRegex = /\{%\s*if\s+cart\.items\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
    processedHtml = processedHtml.replace(cartConditionalRegex, (match, innerContent) => {
      if (cartItems.length > 0) {
        return innerContent;
      }
      return '';
    });

    // Resolve: {% for item in cart.items %} ... {% endfor %}
    const forLoopRegex = /\{%\s*for\s+item\s+in\s+cart\.items\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g;
    processedHtml = processedHtml.replace(forLoopRegex, (match, innerTemplate) => {
      return cartItems.map(item => {
        let block = innerTemplate;
        block = block.replace(/\{\{\s*item\.name\s*\}\}/g, item.name);
        block = block.replace(/\{\{\s*item\.price\s*\}\}/g, item.price);
        block = block.replace(/\{\{\s*item\.qty\s*\}\}/g, item.qty);
        return block;
      }).join('');
    });

    // Resolve: {% if tier == 'Gold' %} ... {% else %} ... {% endif %}
    const conditionalRegex = /\{%\s*if\s+tier\s*==\s*['"]Gold['"]\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g;
    processedHtml = processedHtml.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
      if (showVipDetails) {
        return ifBlock;
      }
      return elseBlock || '';
    });

    // Translate if segment is Spanish Locale
    if (isSpanish) {
      processedHtml = processedHtml
        .replace(/Welcome,/gi, '¡Bienvenido/a,')
        .replace(/We loaded a special reward into your account to say thanks for being an app member\./gi, 'Hemos cargado una recompensa especial en tu cuenta para agradecerte que seas miembro de la aplicación.')
        .replace(/Claim Blizzard Offer/gi, 'Reclamar Oferta de Blizzard')
        .replace(/This offer is valid for 7 days at participating locations\./gi, 'Esta oferta es válida durante 7 días en los establecimientos participantes.')
        .replace(/VIP GOLD MEMBERS-ONLY PERK:/gi, '🌟 BENEFICIO EXCLUSIVO PARA MIEMBROS DE ORO VIP:')
        .replace(/FREE SMALL BLIZZARD coupon valid for Gold members only\. Enjoy your double points day!/gi, 'Cupón de BLIZZARD PEQUEÑO GRATIS válido únicamente para miembros Gold. ¡Disfruta de tu día de doble puntuación!')
        .replace(/Items Left in Your Cart:/gi, 'Artículos que quedan en tu carrito:')
        .replace(/Use coupon code:/gi, 'Utilice el código de cupón:')
        .replace(/Offer Expires:/gi, 'La oferta vence el:')
        .replace(/If you wish to unsubscribe, click/gi, 'Si desea darse de baja, haga clic')
        .replace(/here/gi, 'aquí')
        .replace(/Dairy Queen Rewards/gi, 'Recompensas de Dairy Queen');
    }

    // Inject simulated dark mode styles when in dark preview mode
    if (iframeTheme === 'dark') {
      const darkStyles = `
        <style id="dark-mode-simulation">
          body, html { background-color: #121824 !important; color: #f1f5f9 !important; }
          .card, [class*="card"] { background-color: #1e293b !important; color: #f1f5f9 !important; border-color: #334155 !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
          .header, .header * { background-color: #0f172a !important; color: #ffffff !important; }
          .content { background-color: #1e293b !important; color: #e2e8f0 !important; }
          .footer, .footer * { background-color: #121824 !important; color: #94a3b8 !important; border-top-color: #334155 !important; }
          
          /* Force heading and text colors with inline color styling to invert */
          h1, h2, h3, h4, h5, h6, strong, b, [style*="color"] { color: #ffffff !important; }
          table, td, tr, div, p { background-color: transparent !important; }
          
          /* Body and secondary copy */
          p, span, li, td, [style*="color"]:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(strong):not(b):not(.btn) { color: #cbd5e1 !important; }
          a:not(.btn) { color: #38bdf8 !important; }
          a.btn, .btn, [class*="btn"] { background-color: #f43f5e !important; color: #ffffff !important; }
        </style>
      `;
      if (processedHtml.includes('</body>')) {
        processedHtml = processedHtml.replace('</body>', `${darkStyles}</body>`);
      } else if (processedHtml.includes('</head>')) {
        processedHtml = processedHtml.replace('</head>', `${darkStyles}</head>`);
      } else {
        processedHtml += darkStyles;
      }
    }

    setRenderedHtml(processedHtml);

    // Parse Subject line
    let processedSubject = subjectLine || '';
    if (isSpanish) {
      processedSubject = '¡Consigue un Blizzard GRATIS! 🍦 Alerta';
    } else {
      processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
    }
    setRenderedSubject(processedSubject);

    // Parse Push notification body
    let processedPush = pushBody || '';
    if (isSpanish) {
      processedPush = '¡Consigue un Blizzard Pequeño GRATIS! 🍦 Válido durante 14 días. Reclama tu recompensa hoy.';
    } else {
      processedPush = processedPush.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedPush = processedPush.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
      processedPush = processedPush.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
        return showVipDetails ? ifBlock : (elseBlock || '');
      });
    }
    setRenderedPushBody(processedPush);

    // Parse SMS body
    let processedSms = smsBody || '';
    if (isSpanish) {
      processedSms = `Dairy Queen: ¡Bienvenido/a Carlos! Cargamos una recompensa de Blizzard GRATIS en tu cuenta. Canjea aquí: http://example.com/redeem`;
    } else {
      processedSms = processedSms.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedSms = processedSms.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
      processedSms = processedSms.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
        return showVipDetails ? ifBlock : (elseBlock || '');
      });
    }
    setRenderedSmsBody(processedSms);

    // Parse IAM Header
    let processedIamHeader = iamHeader || '';
    if (isSpanish) {
      processedIamHeader = 'Consigue un Blizzard Pequeño GRATIS';
    } else {
      processedIamHeader = processedIamHeader.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedIamHeader = processedIamHeader.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
      processedIamHeader = processedIamHeader.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
        return showVipDetails ? ifBlock : (elseBlock || '');
      });
    }
    setRenderedIamHeader(processedIamHeader);

    // Parse IAM Body
    let processedIamBody = iamBody || '';
    if (isSpanish) {
      processedIamBody = 'Cargamos una recompensa de Blizzard GRATIS en tu cuenta.';
    } else {
      processedIamBody = processedIamBody.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedIamBody = processedIamBody.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
      processedIamBody = processedIamBody.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
        return showVipDetails ? ifBlock : (elseBlock || '');
      });
    }
    setRenderedIamBody(processedIamBody);

    // Parse IAM Button Text
    let processedIamButtonText = iamButtonText || '';
    if (isSpanish) {
      processedIamButtonText = 'Reclamar Oferta';
    } else {
      processedIamButtonText = processedIamButtonText.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
        return firstName || fallback;
      });
      processedIamButtonText = processedIamButtonText.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);
      processedIamButtonText = processedIamButtonText.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
        return showVipDetails ? ifBlock : (elseBlock || '');
      });
    }
    setRenderedIamButtonText(processedIamButtonText);
  }, [brazeHtml, subjectLine, segment, iframeTheme, pushBody, smsBody, iamHeader, iamBody, iamButtonText, customName]);

  const getDeviceStyle = () => {
    switch (device) {
      case 'android':
        return {
          width: '320px',
          height: '520px',
          borderRadius: '30px',
          border: '8px solid #1f2937',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000',
          transition: 'all 0.3s ease-in-out'
        };
      case 'tablet':
        return {
          width: '480px',
          height: '620px',
          borderRadius: '24px',
          border: '14px solid #1f2937',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000',
          transition: 'all 0.3s ease-in-out'
        };
      case 'laptop':
        return {
          width: '100%',
          maxWidth: '640px',
          height: '380px',
          borderRadius: '12px',
          border: '12px solid #1f2937',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000',
          transition: 'all 0.3s ease-in-out'
        };
      case 'iphone':
      default:
        return {
          width: '320px',
          height: '520px',
          borderRadius: '36px',
          border: '10px solid #1f2937',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000',
          transition: 'all 0.3s ease-in-out'
        };
    }
  };

  const renderSmsBillingAuditor = () => {
    const text = renderedSmsBody || '';
    const length = text.length;
    const usesUnicode = !isGSM7(text);
    
    let segmentLimit = usesUnicode ? 70 : 160;
    let concatLimit = usesUnicode ? 67 : 153;
    let segments = 1;
    
    if (length > segmentLimit) {
      segments = Math.ceil(length / concatLimit);
    }
    
    const isMultiSegment = segments > 1;
    
    return (
      <div style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-color)',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>SMS Encoding:</span>
          <span style={{ 
            fontWeight: '600', 
            color: usesUnicode ? 'var(--warning)' : 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {usesUnicode ? 'Unicode (UCS-2) ⚠️' : 'Standard (GSM-7)'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Message Length:</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {length} / {segmentLimit} chars
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Billing Segment Count:</span>
          <span style={{ 
            fontWeight: '700', 
            color: isMultiSegment ? 'var(--error)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {segments} SMS Message{segments > 1 ? 's ⚠️' : ''}
          </span>
        </div>
        
        {usesUnicode && (
          <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: '0.4rem', lineHeight: '1.25' }}>
            * Emojis, smart quotes or non-latin characters force UCS-2 encoding (limits segments to 70 chars).
          </div>
        )}
        
        {isMultiSegment && (
          <div style={{ fontSize: '0.72rem', color: 'var(--error)', marginTop: '0.35rem', lineHeight: '1.25', fontWeight: '500' }}>
            * Message exceeds segment limit. Will trigger multi-part SMS billing ({segments}x charges).
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="split-view" style={{ marginBottom: '2rem' }}>
        
        {/* Left Side: Controller and Phone Render */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Multi-Device Rendering Simulator</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="api-badge connected" style={{ fontSize: '0.75rem' }}>
                <span className="indicator" /> Active Sandbox
              </span>
            </div>
          </div>

          {/* Channel Select Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setActiveChannel('email')}
              className={`sub-tab ${activeChannel === 'email' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
            >
              <Mail size={12} /> Email Preview
            </button>
            <button 
              onClick={() => setActiveChannel('push')}
              className={`sub-tab ${activeChannel === 'push' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
            >
              <Bell size={12} /> Push Preview
            </button>
            <button 
              onClick={() => setActiveChannel('sms')}
              className={`sub-tab ${activeChannel === 'sms' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
            >
              <MessageSquare size={12} /> SMS Preview
            </button>
            <button 
              onClick={() => setActiveChannel('iam')}
              className={`sub-tab ${activeChannel === 'iam' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
            >
              <Sparkles size={12} /> IAM Preview
            </button>
          </div>

          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              <Sliders size={14} />
              Simulate Personalization Segment
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                onClick={() => setSegment('default')}
                className={`sub-tab ${segment === 'default' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Standard Fallback
              </button>
              <button 
                onClick={() => setSegment('long_name')}
                className={`sub-tab ${segment === 'long_name' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Extreme Name Length
              </button>
              <button 
                onClick={() => setSegment('null_fallback')}
                className={`sub-tab ${segment === 'null_fallback' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Null Variable (Empty)
              </button>
              <button 
                onClick={() => setSegment('gold_tier')}
                className={`sub-tab ${segment === 'gold_tier' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Gold VIP Member
              </button>
              <button 
                onClick={() => setSegment('cart_loop')}
                className={`sub-tab ${segment === 'cart_loop' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                🛒 Abandoned Cart
              </button>
              <button 
                onClick={() => setSegment('localization_es')}
                className={`sub-tab ${segment === 'localization_es' ? 'active' : ''}`}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                🇪🇸 Spanish Locale
              </button>
            </div>

            {/* Custom Name Override Input */}
            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Type Custom Subscriber Name (Overrides preset):</label>
              <input
                type="text"
                className="form-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Marina"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.45rem 0.65rem', 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--border-radius-sm)', 
                  width: '100%', 
                  boxSizing: 'border-box' 
                }}
              />
            </div>
          </div>

          {/* Device Mockup with Preset Controllers */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              {/* Device Selector Buttons */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setDevice('iphone')}
                  className={`sub-tab ${device === 'iphone' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Smartphone size={12} /> iPhone
                </button>
                <button 
                  onClick={() => setDevice('android')}
                  className={`sub-tab ${device === 'android' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Smartphone size={12} /> Android
                </button>
                <button 
                  onClick={() => setDevice('tablet')}
                  className={`sub-tab ${device === 'tablet' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Tablet size={12} /> Tablet
                </button>
                {activeChannel !== 'push' && (
                  <button 
                    onClick={() => setDevice('laptop')}
                    className={`sub-tab ${device === 'laptop' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    <Laptop size={12} /> Laptop
                  </button>
                )}
              </div>

              {/* Email Mode Theme Toggle */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setIframeTheme('light')}
                  className={`sub-tab ${iframeTheme === 'light' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  title="Simulate email client light mode"
                >
                  <Sun size={12} /> Light
                </button>
                <button 
                  onClick={() => setIframeTheme('dark')}
                  className={`sub-tab ${iframeTheme === 'dark' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  title="Simulate email client dark mode inversion"
                >
                  <Moon size={12} /> Dark
                </button>
              </div>
            </div>

            <div className="phone-wrapper" style={{ padding: '0.5rem 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={getDeviceStyle()}>
                {device === 'iphone' && <div className="phone-notch"></div>}
                {device === 'android' && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#1f2937',
                    zIndex: 10
                  }} />
                )}
                
                <div className="phone-screen" style={{ 
                  paddingTop: (device === 'laptop' || activeChannel !== 'email') ? '0' : '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  background: activeChannel === 'push' 
                    ? 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)' // Lockscreen wallpaper
                    : (activeChannel === 'sms' 
                      ? (iframeTheme === 'dark' ? '#121824' : '#ffffff') 
                      : 'transparent'),
                  transition: 'background 0.25s ease'
                }}>
                  {activeChannel === 'email' && (
                    <>
                      {device !== 'laptop' && (
                        <div style={{ 
                          padding: '0.5rem 0.75rem', 
                          borderBottom: iframeTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', 
                          backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#f9fafb', 
                          fontSize: '0.7rem', 
                          color: iframeTheme === 'dark' ? '#9ca3af' : '#6b7280', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>From: <strong style={{ color: iframeTheme === 'dark' ? '#f3f4f6' : '#374151' }}>Dairy Queen</strong></span>
                            <span>12:00 PM</span>
                          </div>
                          <span style={{ marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Subject: <strong style={{ color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedSubject}</strong>
                          </span>
                        </div>
                      )}
                      {renderedHtml ? (
                        <iframe 
                          title="Braze Live Email Render" 
                          srcDoc={renderedHtml}
                          sandbox="allow-same-origin"
                          style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                          No HTML code loaded.
                        </div>
                      )}
                    </>
                  )}

                  {activeChannel === 'push' && (
                    !pushFullScreen ? (
                      /* Home Screen / Not Full Screen Banner */
                      <div style={{
                        flex: 1,
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        paddingBottom: '2.5rem',
                        position: 'relative',
                        height: '100%',
                        boxSizing: 'border-box',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Home Screen Wallpaper
                      }}>
                        {/* Mock Floating Banner Notification at top */}
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '0.75rem',
                          right: '0.75rem',
                          zIndex: 10,
                        }}>
                          {pushOS === 'ios' ? (
                            /* iOS Banner */
                            <div style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.88)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              textAlign: 'left',
                              color: '#111827'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ background: '#f43f5e', width: '12px', height: '12px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: '800' }}>DQ</span>
                                  <span style={{ fontWeight: '600', color: '#374151' }}>DAIRY QUEEN</span>
                                </div>
                                <span>now</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{renderedSubject}</div>
                              <div style={{ fontSize: '0.75rem', color: '#1f2937', lineHeight: '1.3' }}>{renderedPushBody}</div>
                            </div>
                          ) : (
                            /* Android Banner */
                            <div style={{
                              backgroundColor: '#1f2937',
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                              border: '1px solid #374151',
                              textAlign: 'left',
                              color: '#f9fafb'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ background: 'var(--accent-blue)', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} />
                                  <span>Dairy Queen Rewards</span>
                                </div>
                                <span>now</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{renderedSubject}</div>
                              <div style={{ fontSize: '0.75rem', color: '#d1d5db', lineHeight: '1.3' }}>{renderedPushBody}</div>
                            </div>
                          )}
                        </div>

                        {/* App Icons Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '1.2rem 0.5rem',
                          width: '100%',
                          opacity: 0.85
                        }}>
                          {[
                            { label: 'Mail', color: '#3b82f6' },
                            { label: 'Safari', color: '#10b981' },
                            { label: 'Photos', color: '#f59e0b' },
                            { label: 'Maps', color: '#ef4444' },
                            { label: 'Settings', color: '#6b7280' },
                            { label: 'Weather', color: '#06b6d4' },
                            { label: 'Notes', color: '#eab308' },
                            { label: 'App Store', color: '#2563eb' }
                          ].map((app, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: app.color,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: '700'
                              }}>
                                {app.label.substring(0, 1)}
                              </div>
                              <span style={{ fontSize: '0.55rem', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)', fontWeight: '500' }}>
                                {app.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Full Screen Lockscreen View */
                      <div style={{ 
                        flex: 1, 
                        padding: '1.25rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '1.5rem',
                        height: '100%',
                        boxSizing: 'border-box',
                        color: '#ffffff',
                        position: 'relative'
                      }}>
                        {/* iOS Lockscreen Top Time Display */}
                        {pushOS === 'ios' && (
                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '1.5rem', opacity: 0.9 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Friday, June 5</span>
                            <span style={{ fontSize: '2.25rem', fontWeight: '300', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>12:00</span>
                          </div>
                        )}

                        {/* Mock Notification Card */}
                        {pushOS === 'ios' ? (
                          /* iOS Notification Card */
                          <div style={{
                            width: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.18)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            padding: '0.75rem 1rem',
                            boxSizing: 'border-box',
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            textAlign: 'left'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', opacity: 0.7, marginBottom: '0.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ background: 'var(--accent-cyan)', width: '12px', height: '12px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '8px', fontWeight: '800' }}>DQ</span>
                                <span style={{ fontWeight: '600' }}>DAIRY QUEEN</span>
                              </div>
                              <span>now</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>{renderedSubject}</div>
                            <div style={{ fontSize: '0.75rem', color: '#e0e7ff', lineHeight: '1.3' }}>{renderedPushBody}</div>
                            
                            {/* Rich Push Image */}
                            <img 
                              src="blizzard_push_banner.png" 
                              alt="Push Campaign Banner" 
                              style={{
                                width: '100%',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginTop: '0.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            />
                          </div>
                        ) : (
                          /* Android Notification Card */
                          <div style={{
                            width: '100%',
                            backgroundColor: '#1f2937',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            boxSizing: 'border-box',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                            border: '1px solid #374151',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            textAlign: 'left',
                            marginTop: '2.5rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ background: 'var(--accent-blue)', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }} />
                                <span>Dairy Queen Rewards</span>
                              </div>
                              <span>12:00 PM</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f9fafb' }}>{renderedSubject}</div>
                            <div style={{ fontSize: '0.75rem', color: '#d1d5db', lineHeight: '1.3' }}>{renderedPushBody}</div>
                            
                            {/* Rich Push Image */}
                            <img 
                              src="blizzard_push_banner.png" 
                              alt="Push Campaign Banner" 
                              style={{
                                width: '100%',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginTop: '0.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {activeChannel === 'sms' && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {/* SMS Contact Header */}
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        borderBottom: iframeTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                        backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: iframeTheme === 'dark' ? '#f3f4f6' : '#111827'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-blue)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: '700'
                        }}>
                          DQ
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Dairy Queen Promo</span>
                          <span style={{ fontSize: '0.55rem', color: iframeTheme === 'dark' ? '#94a3b8' : '#64748b' }}>+1 (833) 247-3367</span>
                        </div>
                      </div>

                      {/* SMS Chat Stream */}
                      <div style={{
                        flex: 1,
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        gap: '1rem',
                        overflowY: 'auto'
                      }}>
                        <div style={{
                          alignSelf: 'center',
                          fontSize: '0.6rem',
                          color: iframeTheme === 'dark' ? '#94a3b8' : '#64748b',
                          backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '10px'
                        }}>
                          Text Message &bull; Today 12:00 PM
                        </div>

                        {/* Incoming Text Bubble */}
                        <div style={{
                          alignSelf: 'flex-start',
                          maxWidth: '85%',
                          backgroundColor: iframeTheme === 'dark' ? '#26262b' : '#e9e9eb',
                          color: iframeTheme === 'dark' ? '#f3f4f6' : '#000000',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '16px 16px 16px 4px',
                          fontSize: '0.75rem',
                          lineHeight: '1.4',
                          textAlign: 'left',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                        }}>
                          {renderedSmsBody}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeChannel === 'iam' && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box',
                      position: 'relative',
                      background: iframeTheme === 'dark' 
                        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
                        : 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '1.25rem'
                    }}>
                      {/* Mock App Interface Background */}
                      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontSize: '0.65rem', color: iframeTheme === 'dark' ? '#94a3b8' : '#475569', fontWeight: '600' }}>
                        Dairy Queen App
                      </div>

                      {/* Modal Style IAM Preview */}
                      {iamStyle === 'modal' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          zIndex: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1.25rem',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          <div style={{
                            backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#ffffff',
                            color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '240px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            padding: '1.25rem',
                            position: 'relative',
                            textAlign: 'center',
                            border: iframeTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {/* Close icon */}
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.6, cursor: 'pointer' }}>
                              <X size={12} />
                            </div>

                            {/* Campaign icon */}
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#f43f5e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '0.8rem',
                              fontWeight: '800',
                              marginBottom: '0.25rem'
                            }}>
                              DQ
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0, color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</h4>
                            <p style={{ fontSize: '0.75rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', lineHeight: '1.3', margin: 0 }}>
                              {renderedIamBody}
                            </p>
                            
                            <a 
                              href={iamButtonLink} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{
                                display: 'block',
                                width: '100%',
                                backgroundColor: '#f43f5e',
                                color: '#ffffff',
                                textAlign: 'center',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                textDecoration: 'none',
                                marginTop: '0.5rem'
                              }}
                            >
                              {renderedIamButtonText}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Slideup Style IAM Preview */}
                      {iamStyle === 'slideup' && (
                        <div style={{
                          position: 'absolute',
                          bottom: '1rem',
                          left: '0.75rem',
                          right: '0.75rem',
                          backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#ffffff',
                          color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                          borderRadius: '10px',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                          padding: '0.75rem 1rem',
                          border: iframeTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                          zIndex: 20,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          animation: 'slideUp 0.3s ease'
                        }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: '#f43f5e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            flexShrink: 0
                          }}>
                            DQ
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</div>
                            <div style={{ fontSize: '0.65rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderedIamBody}</div>
                          </div>
                          <a 
                            href={iamButtonLink} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              backgroundColor: '#f43f5e',
                              color: '#ffffff',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              textDecoration: 'none',
                              flexShrink: 0
                            }}
                          >
                            {renderedIamButtonText}
                          </a>
                        </div>
                      )}

                      {/* Fullscreen Style IAM Preview */}
                      {iamStyle === 'fullscreen' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: iframeTheme === 'dark' ? '#0f172a' : '#f8fafc',
                          color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                          zIndex: 20,
                          padding: '2rem 1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '1rem',
                          textAlign: 'center',
                          animation: 'fadeIn 0.25s ease'
                        }}>
                          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', opacity: 0.7, cursor: 'pointer' }}>
                            <X size={14} />
                          </div>

                          {/* Hero Mascot Icon */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: '#f43f5e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            boxShadow: '0 8px 16px rgba(244,63,94,0.3)'
                          }}>
                            DQ
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</h3>
                            <p style={{ fontSize: '0.75rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', lineHeight: '1.4', margin: 0 }}>
                              {renderedIamBody}
                            </p>
                          </div>

                          <a 
                             href={iamButtonLink} 
                             target="_blank" 
                             rel="noreferrer"
                            style={{
                              display: 'block',
                              width: '100%',
                              maxWidth: '180px',
                              backgroundColor: '#f43f5e',
                              color: '#ffffff',
                              textAlign: 'center',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textDecoration: 'none',
                              boxShadow: '0 4px 12px rgba(244,63,94,0.4)',
                              marginTop: '0.75rem'
                            }}
                          >
                            {renderedIamButtonText}
                          </a>
                          
                          <span style={{ fontSize: '0.65rem', color: iframeTheme === 'dark' ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                            Maybe Later
                          </span>
                        </div>
                      )}

                      {/* App Mock Home UI (Decorative behind popup/slideup) */}
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: (iamStyle === 'fullscreen') ? 0 : 0.35, pointerEvents: 'none' }}>
                        <div style={{ height: '32px', backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '6px' }} />
                        <div style={{ height: '80px', backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '8px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div style={{ height: '60px', backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '6px' }} />
                          <div style={{ height: '60px', backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '6px' }} />
                        </div>
                        <div style={{ height: '40px', backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '6px' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {device === 'laptop' && (
                <div className="laptop-base" style={{ 
                  height: '10px', 
                  background: '#374151', 
                  width: '90%', 
                  maxWidth: '580px',
                  borderRadius: '0 0 8px 8px',
                  borderBottom: '4px solid #1f2937',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                  zIndex: 5
                }} />
              )}

              <button 
                className="btn btn-secondary" 
                onClick={() => setShowIframeFullscreen(true)}
                style={{ marginTop: '1.25rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'auto' }}
              >
                <Maximize2 size={12} /> Fullscreen Live Render
              </button>
            </div>

            {/* Dynamic Copy Input fields below Device Simulator based on active Channel */}
            {activeChannel === 'push' && (
              <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Push Notification Body Copy</label>
                  <textarea
                    className="form-textarea"
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    placeholder="Enter push notification body copy..."
                    style={{ minHeight: '70px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setPushOS('ios')}
                    className={`sub-tab ${pushOS === 'ios' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    🍎 iOS UI Frame
                  </button>
                  <button 
                    onClick={() => setPushOS('android')}
                    className={`sub-tab ${pushOS === 'android' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    🤖 Android UI Frame
                  </button>
                </div>
                {/* Push preview style toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => setPushFullScreen(true)}
                    className={`sub-tab ${pushFullScreen ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    📱 Locked Phone (Full Screen)
                  </button>
                  <button 
                    onClick={() => setPushFullScreen(false)}
                    className={`sub-tab ${!pushFullScreen ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    🔔 Unlocked Phone (App Banner)
                  </button>
                </div>
              </div>
            )}

            {activeChannel === 'sms' && (
              <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>SMS Message Body Copy</label>
                  <textarea
                    className="form-textarea"
                    value={smsBody}
                    onChange={(e) => setSmsBody(e.target.value)}
                    placeholder="Enter SMS body copy..."
                    style={{ minHeight: '70px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
                  />
                </div>
                {renderSmsBillingAuditor()}
              </div>
            )}

            {activeChannel === 'iam' && (
              <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>IAM Header Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={iamHeader}
                    onChange={(e) => setIamHeader(e.target.value)}
                    placeholder="Enter IAM header..."
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>IAM Message Body</label>
                  <textarea
                    className="form-textarea"
                    value={iamBody}
                    onChange={(e) => setIamBody(e.target.value)}
                    placeholder="Enter IAM body..."
                    style={{ minHeight: '60px', fontSize: '0.85rem', padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="settings-grid">
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Button Text</label>
                    <input
                      type="text"
                      className="form-input"
                      value={iamButtonText}
                      onChange={(e) => setIamButtonText(e.target.value)}
                      placeholder="e.g. Claim Offer"
                      style={{ fontSize: '0.85rem', padding: '0.45rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Button Link</label>
                    <input
                      type="text"
                      className="form-input"
                      value={iamButtonLink}
                      onChange={(e) => setIamButtonLink(e.target.value)}
                      placeholder="e.g. http://..."
                      style={{ fontSize: '0.85rem', padding: '0.45rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                
                {/* IAM Layout Style Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => setIamStyle('modal')}
                    className={`sub-tab ${iamStyle === 'modal' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    💬 Center Modal
                  </button>
                  <button 
                    onClick={() => setIamStyle('slideup')}
                    className={`sub-tab ${iamStyle === 'slideup' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    🔔 Slide-up Banner
                  </button>
                  <button 
                    onClick={() => setIamStyle('fullscreen')}
                    className={`sub-tab ${iamStyle === 'fullscreen' ? 'active' : ''}`}
                    style={{ flex: 1, padding: '0.35rem 0', fontSize: '0.75rem' }}
                  >
                    📱 Full Screen Takeover
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Figma Design Reference & Layout Checks */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Figma Spec Blueprint</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Layers size={14} /> Layer Outlines
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            This panel represents the pixel-perfect design reference as drawn in Figma. Click the mockup below to zoom full screen.
          </p>

          <div 
            onClick={() => setShowFigmaFullscreen(true)}
            style={{ 
              flex: 1, 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--border-radius-md)', 
              backgroundColor: figmaDashBg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'zoom-in',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.backgroundColor = figmaOverlayBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = figmaDashBg; }}
          >
            {/* Beautiful SVG graphic mimicking Figma Vector Node UI */}
            <svg width="150" height="200" viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 20px rgba(6, 182, 212, 0.15))' }}>
              <rect x="10" y="10" width="160" height="220" rx="16" fill={figmaBg} stroke={figmaStroke} strokeWidth="2" />
              <line x1="25" y1="35" x2="155" y2="35" stroke={figmaLineColor} strokeWidth="2" strokeDasharray="4 4" />
              <path d="M90 60 C80 60, 75 75, 90 90 C105 75, 100 60, 90 60 Z" fill="var(--accent-blue)" />
              <path d="M80 90 H100 L95 110 H85 Z" fill="var(--accent-cyan)" />
              <rect x="35" y="125" width="110" height="12" rx="4" fill={figmaRectColor1} />
              <rect x="50" y="145" width="80" height="8" rx="4" fill={figmaRectColor2} />
              <rect x="25" y="165" width="130" height="40" rx="6" fill="rgba(6, 182, 212, 0.05)" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="40" y="177" width="100" height="8" rx="4" fill="var(--accent-cyan)" fillOpacity="0.4" />
              <rect x="55" y="191" width="70" height="6" rx="3" fill="var(--accent-blue)" fillOpacity="0.6" />
            </svg>

            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Figma Frame: Campaign Mockup</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '300px' }}>
              Reference node <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>#4329:104</code> (DQ Blizzard Campaign Mock).
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Figma Viewport Spec:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>375px × 812px</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Visual Health Check:</span>
              <span style={{ color: 'var(--success)' }}>Passed (Aspect Match)</span>
            </div>
          </div>
        </div>

      </div>

      {/* FIGMA FULLSCREEN OVERLAY MODAL */}
      {showFigmaFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 8, 15, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '2.5rem',
              borderRadius: 'var(--border-radius-lg)',
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
          >
            <button 
              onClick={() => setShowFigmaFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
            >
              <X size={18} />
            </button>

            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Figma Blueprint Specification</h3>

            <div style={{ background: figmaBg, border: '1px solid var(--border-color)', padding: '2.5rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem', transition: 'background-color 0.25s ease' }}>
              <svg width="240" height="320" viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 15px 30px rgba(6, 182, 212, 0.25))' }}>
                <rect x="10" y="10" width="160" height="220" rx="16" fill={figmaBg} stroke={figmaStroke} strokeWidth="2.5" />
                <line x1="25" y1="35" x2="155" y2="35" stroke={figmaLineColor} strokeWidth="2" strokeDasharray="4 4" />
                <path d="M90 60 C80 60, 75 75, 90 90 C105 75, 100 60, 90 60 Z" fill="var(--accent-blue)" />
                <path d="M80 90 H100 L95 110 H85 Z" fill="var(--accent-cyan)" />
                <rect x="35" y="125" width="110" height="12" rx="4" fill={figmaRectColor1} />
                <rect x="50" y="145" width="80" height="8" rx="4" fill={figmaRectColor2} />
                <rect x="25" y="165" width="130" height="40" rx="6" fill="rgba(6, 182, 212, 0.05)" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="3 3" />
                <rect x="40" y="177" width="100" height="8" rx="4" fill="var(--accent-cyan)" fillOpacity="0.4" />
                <rect x="55" y="191" width="70" height="6" rx="3" fill="var(--accent-blue)" fillOpacity="0.6" />
              </svg>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong>Dairy Queen Blizzard Promo mockup spec blueprint</strong><br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Render Node #4329:104 &bull; 375px &times; 812px &bull; SVG Outline Vector layer mapping</span>
            </div>
          </div>
        </div>
      )}

      {/* LIVE RENDERING IFRAME FULLSCREEN OVERLAY MODAL */}
      {showIframeFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 8, 15, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '2.5rem 1.5rem 1.5rem 1.5rem',
              borderRadius: 'var(--border-radius-lg)',
              position: 'relative',
              width: '95vw',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
          >
            <button 
              onClick={() => setShowIframeFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
            >
              <X size={18} />
            </button>

            <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', textAlign: 'center' }}>
              Full Resolution Email Render Frame
            </h3>

            <div style={{ 
              flex: 1, 
              width: '100%', 
              background: activeChannel === 'push'
                ? 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)'
                : (iframeTheme === 'dark' ? '#121824' : '#ffffff'), 
              borderRadius: 'var(--border-radius-md)', 
              overflow: 'hidden', 
              border: '2px solid var(--border-color)',
              transition: 'background-color 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: activeChannel === 'push' ? 'center' : 'stretch',
              alignItems: 'center',
              padding: activeChannel === 'push' ? '2rem' : '0'
            }}>
              {activeChannel === 'email' && (
                renderedHtml ? (
                  <iframe 
                    title="Braze Live Email Render Fullscreen" 
                    srcDoc={renderedHtml}
                    sandbox="allow-same-origin"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    No HTML code loaded.
                  </div>
                )
              )}

              {activeChannel === 'push' && (
                <div style={{
                  maxWidth: '400px',
                  width: '100%',
                  backgroundColor: pushOS === 'ios' ? 'rgba(255, 255, 255, 0.18)' : '#1f2937',
                  backdropFilter: pushOS === 'ios' ? 'blur(20px)' : 'none',
                  WebkitBackdropFilter: pushOS === 'ios' ? 'blur(20px)' : 'none',
                  borderRadius: pushOS === 'ios' ? '16px' : '8px',
                  padding: '1rem 1.25rem',
                  boxSizing: 'border-box',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  border: pushOS === 'ios' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #374151',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: pushOS === 'ios' ? 'rgba(255, 255, 255, 0.7)' : '#9ca3af', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {pushOS === 'ios' ? (
                        <span style={{ background: 'var(--accent-cyan)', width: '14px', height: '14px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '9px', fontWeight: '800' }}>DQ</span>
                      ) : (
                        <span style={{ background: 'var(--accent-blue)', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }} />
                      )}
                      <span style={{ fontWeight: '600' }}>Dairy Queen Rewards</span>
                    </div>
                    <span>now</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff' }}>{renderedSubject}</div>
                  <div style={{ fontSize: '0.85rem', color: pushOS === 'ios' ? '#e0e7ff' : '#d1d5db', lineHeight: '1.4' }}>{renderedPushBody}</div>
                  
                  {pushFullScreen && (
                    <img 
                      src="blizzard_push_banner.png" 
                      alt="Push Campaign Banner" 
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginTop: '0.65rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  )}
                </div>
              )}

              {activeChannel === 'sms' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%'
                }}>
                  {/* SMS Contact Header */}
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    borderBottom: iframeTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                    backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: iframeTheme === 'dark' ? '#f3f4f6' : '#111827'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-blue)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '700'
                    }}>
                      DQ
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Dairy Queen Promo</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+1 (833) 247-3367</span>
                    </div>
                  </div>

                  {/* SMS Chat Stream */}
                  <div style={{
                    flex: 1,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: '1.5rem',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      alignSelf: 'center',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      backgroundColor: iframeTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px'
                    }}>
                      Text Message &bull; Today 12:00 PM
                    </div>

                    {/* Incoming Text Bubble */}
                    <div style={{
                      alignSelf: 'flex-start',
                      maxWidth: '75%',
                      backgroundColor: iframeTheme === 'dark' ? '#26262b' : '#e9e9eb',
                      color: iframeTheme === 'dark' ? '#f3f4f6' : '#000000',
                      padding: '0.8rem 1.1rem',
                      borderRadius: '18px 18px 18px 4px',
                      fontSize: '0.85rem',
                      lineHeight: '1.45',
                      textAlign: 'left',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}>
                      {renderedSmsBody}
                    </div>
                  </div>
                </div>
              )}

              {activeChannel === 'iam' && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem'
                }}>
                  {/* Modal Style IAM Preview */}
                  {iamStyle === 'modal' && (
                    <div style={{
                      backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#ffffff',
                      color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                      borderRadius: '12px',
                      width: '100%',
                      maxWidth: '320px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      padding: '2rem',
                      position: 'relative',
                      textAlign: 'center',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', opacity: 0.6, cursor: 'pointer' }}>
                        <X size={14} />
                      </div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '800',
                        marginBottom: '0.5rem'
                      }}>
                        DQ
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</h4>
                      <p style={{ fontSize: '0.85rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', lineHeight: '1.4', margin: 0 }}>
                        {renderedIamBody}
                      </p>
                      <a 
                        href={iamButtonLink} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          width: '100%',
                          backgroundColor: '#f43f5e',
                          color: '#ffffff',
                          textAlign: 'center',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          marginTop: '0.75rem'
                        }}
                      >
                        {renderedIamButtonText}
                      </a>
                    </div>
                  )}

                  {iamStyle === 'slideup' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2rem',
                      left: '2rem',
                      right: '2rem',
                      backgroundColor: iframeTheme === 'dark' ? '#1f2937' : '#ffffff',
                      color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      padding: '1rem 1.5rem',
                      border: '1px solid var(--border-color)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        DQ
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</div>
                        <div style={{ fontSize: '0.75rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderedIamBody}</div>
                      </div>
                      <a 
                        href={iamButtonLink} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#f43f5e',
                          color: '#ffffff',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          flexShrink: 0
                        }}
                      >
                        {renderedIamButtonText}
                      </a>
                    </div>
                  )}

                  {iamStyle === 'fullscreen' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: iframeTheme === 'dark' ? '#0f172a' : '#f8fafc',
                      color: iframeTheme === 'dark' ? '#ffffff' : '#111827',
                      padding: '3rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.7, cursor: 'pointer' }}>
                        <X size={20} />
                      </div>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        boxShadow: '0 8px 20px rgba(244,63,94,0.3)'
                      }}>
                        DQ
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: iframeTheme === 'dark' ? '#ffffff' : '#111827' }}>{renderedIamHeader}</h3>
                        <p style={{ fontSize: '0.95rem', color: iframeTheme === 'dark' ? '#cbd5e1' : '#374151', lineHeight: '1.5', margin: 0, maxWidth: '400px' }}>
                          {renderedIamBody}
                        </p>
                      </div>
                      <a 
                        href={iamButtonLink} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          width: '100%',
                          maxWidth: '240px',
                          backgroundColor: '#f43f5e',
                          color: '#ffffff',
                          textAlign: 'center',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(244,63,94,0.4)',
                          marginTop: '1.5rem'
                        }}
                      >
                        {renderedIamButtonText}
                      </a>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>
                        Maybe Later
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Simulating segment: <strong style={{ color: 'var(--accent-cyan)' }}>{segment.toUpperCase().replace('_', ' ')}</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
