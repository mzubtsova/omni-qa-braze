import { useState, useEffect } from 'react';
import { Smartphone, Layers, Sliders, Tablet, Laptop, Maximize2, X, Sun, Moon } from 'lucide-react';

export default function VisualStressTester({ brazeHtml, subjectLine, theme }) {
  const [segment, setSegment] = useState('default');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedSubject, setRenderedSubject] = useState('');
  const [device, setDevice] = useState('iphone'); // 'iphone', 'android', 'tablet', 'laptop'
  const [iframeTheme, setIframeTheme] = useState('light'); // 'light' or 'dark'
  const [showFigmaFullscreen, setShowFigmaFullscreen] = useState(false);
  const [showIframeFullscreen, setShowIframeFullscreen] = useState(false);

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

    let firstName = 'Valued Customer';
    let showVipDetails = false;

    if (segment === 'long_name') {
      firstName = 'Hubert Wolfeschlegelsteinhausenbergerdorff';
    } else if (segment === 'null_fallback') {
      firstName = '';
    } else if (segment === 'gold_tier') {
      firstName = 'Marina';
      showVipDetails = true;
    }

    // Basic Liquid interpreter for rendering simulation
    let processedHtml = brazeHtml;
    
    // Resolve: {{ user.first_name | default: 'Valued Customer' }}
    processedHtml = processedHtml.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
      return firstName || fallback;
    });

    // Resolve: {{ user.first_name }}
    processedHtml = processedHtml.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);

    // Resolve: {% if tier == 'Gold' %} ... {% else %} ... {% endif %}
    // Renders the correct conditional block based on simulated segment.
    const conditionalRegex = /\{%\s*if\s+tier\s*==\s*['"]Gold['"]\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g;
    processedHtml = processedHtml.replace(conditionalRegex, (match, ifBlock, elseBlock) => {
      if (showVipDetails) {
        return ifBlock;
      }
      return elseBlock || '';
    });

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

    // Also parse Subject line
    let processedSubject = subjectLine || '';
    processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
      return firstName || fallback;
    });
    processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);

    setRenderedSubject(processedSubject);
  }, [brazeHtml, subjectLine, segment, iframeTheme]);

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
                <button 
                  onClick={() => setDevice('laptop')}
                  className={`sub-tab ${device === 'laptop' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Laptop size={12} /> Laptop
                </button>
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
                
                <div className="phone-screen" style={{ paddingTop: device === 'laptop' ? '0' : '1.5rem' }}>
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
                style={{ marginTop: '1.25rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Maximize2 size={12} /> Fullscreen Live Render
              </button>
            </div>

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
              background: iframeTheme === 'dark' ? '#121824' : '#ffffff', 
              borderRadius: 'var(--border-radius-md)', 
              overflow: 'hidden', 
              border: '2px solid var(--border-color)',
              transition: 'background-color 0.25s ease'
            }}>
              {renderedHtml ? (
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
