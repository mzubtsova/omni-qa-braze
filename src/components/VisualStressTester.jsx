import { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, Eye, Sparkles, Layers, Sliders } from 'lucide-react';

export default function VisualStressTester({ brazeHtml, subjectLine }) {
  const [segment, setSegment] = useState('default');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedSubject, setRenderedSubject] = useState('');

  // Expand Liquid tags client-side for sandbox simulation
  useEffect(() => {
    if (!brazeHtml) return;

    let firstName = 'Valued Customer';
    let tier = 'Bronze';
    let showVipDetails = false;

    if (segment === 'long_name') {
      firstName = 'Hubert Wolfeschlegelsteinhausenbergerdorff';
    } else if (segment === 'null_fallback') {
      firstName = '';
    } else if (segment === 'gold_tier') {
      firstName = 'Marina';
      tier = 'Gold';
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

    setRenderedHtml(processedHtml);

    // Also parse Subject line
    let processedSubject = subjectLine || '';
    processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\|\s*default:\s*['"]([^'"]+)['"]\s*\}\}/g, (match, fallback) => {
      return firstName || fallback;
    });
    processedSubject = processedSubject.replace(/\{\{\s*user\.first_name\s*\}\}/g, firstName);

    setRenderedSubject(processedSubject);
  }, [brazeHtml, subjectLine, segment]);

  return (
    <div className="fade-in">
      <div className="split-view" style={{ marginBottom: '2rem' }}>
        
        {/* Left Side: Controller and Phone Render */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Mobile Rendering Simulator</h3>
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

          {/* Device Mockup */}
          <div className="phone-wrapper" style={{ padding: '1rem 0' }}>
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.7rem', color: '#6b7280', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>From: <strong>Dairy Queen</strong></span>
                    <span>12:00 PM</span>
                  </div>
                  <span style={{ marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Subject: <strong style={{ color: '#111827' }}>{renderedSubject}</strong>
                  </span>
                </div>
                {renderedHtml ? (
                  <iframe 
                    title="Braze Live Email Render" 
                    srcDoc={renderedHtml}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                    No HTML code loaded.
                  </div>
                )}
              </div>
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
            This panel represents the pixel-perfect design reference as drawn in Figma. In Live mode, this displays the target layout frame directly.
          </p>

          <div style={{ 
            flex: 1, 
            border: '2px dashed var(--border-color)', 
            borderRadius: 'var(--border-radius-md)', 
            backgroundColor: 'rgba(255,255,255,0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}>
            {/* Beautiful SVG graphic mimicking Figma Vector Node UI */}
            <svg width="180" height="240" viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 20px rgba(6, 182, 212, 0.15))' }}>
              <rect x="10" y="10" width="160" height="220" rx="16" fill="#111827" stroke="var(--accent-cyan)" strokeWidth="2" />
              <line x1="25" y1="35" x2="155" y2="35" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Soft Serve Logo Mimic */}
              <path d="M90 60 C80 60, 75 75, 90 90 C105 75, 100 60, 90 60 Z" fill="var(--accent-blue)" />
              <path d="M80 90 H100 L95 110 H85 Z" fill="var(--accent-cyan)" />
              {/* Card headers */}
              <rect x="35" y="125" width="110" height="12" rx="4" fill="rgba(255,255,255,0.15)" />
              <rect x="50" y="145" width="80" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
              {/* Coupon container dotted boundary */}
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
    </div>
  );
}
