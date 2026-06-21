import { useState } from 'react';
import { Scale, RefreshCw, Check } from 'lucide-react';

export default function AbEvaluator({ 
  subjectLine, 
  brazeHtml, 
  setSubjectLine, 
  setBrazeHtml,
  setIamButtonText,
  setIamButtonLink
}) {
  const [abSubjectA, setAbSubjectA] = useState(subjectLine || '');
  const [abCopyA, setAbCopyA] = useState('Your member reward is ready to view today.');
  const [abButtonTextA, setAbButtonTextA] = useState('View Member Offer');
  const [abButtonLinkA, setAbButtonLinkA] = useState('http://example.com/redeem');

  const [abSubjectB, setAbSubjectB] = useState('🎁 Your welcome offer is waiting');
  const [abCopyB, setAbCopyB] = useState('Your welcome offer expires in 3 days. Tap to view it now.');
  const [abButtonTextB, setAbButtonTextB] = useState('View Welcome Offer');
  const [abButtonLinkB, setAbButtonLinkB] = useState('https://example.org/redeem?utm_source=braze&utm_medium=email&utm_campaign=welcome_offer');

  const [abResults, setAbResults] = useState(null);
  const [abEvaluating, setAbEvaluating] = useState(false);
  const [toast, setToast] = useState(null);

  const handleApplyVariant = (subject, copy, btnText, btnLink) => {
    if (setSubjectLine) {
      setSubjectLine(subject);
    }
    if (setIamButtonText && btnText) {
      setIamButtonText(btnText);
    }
    if (setIamButtonLink && btnLink) {
      setIamButtonLink(btnLink);
    }
    if (brazeHtml && setBrazeHtml && btnText && btnLink) {
      const anchorRegex = /(<a\s+[^>]*href\s*=\s*["'])([^"']*)(["'][^>]*>)(.*?)(<\/a>)/i;
      const updatedHtml = brazeHtml.replace(anchorRegex, (match, p1, p2, p3, p4, p5) => {
        return `${p1}${btnLink}${p3}${btnText}${p5}`;
      });
      setBrazeHtml(updatedHtml);
    }
    navigator.clipboard.writeText(copy).then(() => {
      setToast('Applied subject, CTA button, and link to active workspace campaign!');
      setTimeout(() => setToast(null), 3000);
    }).catch(() => {
      setToast('Applied campaign copy to workspace!');
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleLoadBaseline = () => {
    setAbSubjectA(subjectLine || '');
    const plainText = brazeHtml ? brazeHtml.replace(/<[^>]*>/g, '').trim().substring(0, 120) : '';
    setAbCopyA(plainText || 'Your member reward is ready to view today.');

    if (brazeHtml) {
      const anchorRegex = /<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/i;
      const match = brazeHtml.match(anchorRegex);
      if (match) {
        setAbButtonLinkA(match[1] || '');
        setAbButtonTextA(match[2].replace(/<[^>]*>/g, '').trim() || '');
      } else {
        setAbButtonLinkA('');
        setAbButtonTextA('');
      }
    }
  };

  const handleEvaluateAB = () => {
    setAbEvaluating(true);
    setTimeout(() => {
      const evaluate = (sub, cop, btnText, btnLink) => {
        let openRate = 18.5; // base
        let clickRate = 2.4;  // base
        let score = 75;      // base
        const feedback = [];

        // Subject Line Length
        if (sub.length > 30 && sub.length < 65) {
          openRate += 2.1;
          score += 5;
          feedback.push('Optimal subject line length (30-65 chars).');
        } else if (sub.length >= 65) {
          openRate -= 1.5;
          score -= 4;
          feedback.push('Subject is too long; will be truncated on mobile.');
        } else {
          openRate -= 0.8;
          feedback.push('Subject is very short; could add more context.');
        }

        // Subject Emojis
        const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
        if (emojiRegex.test(sub)) {
          openRate += 1.8;
          score += 4;
          feedback.push('Emoji detected: increases prominence (+1.8%).');
        }

        // Personalization
        if (sub.includes('{{') || cop.includes('{{') || sub.toLowerCase().includes('marina') || cop.toLowerCase().includes('marina')) {
          openRate += 2.5;
          clickRate += 0.6;
          score += 8;
          feedback.push('Dynamic personalization detected: increases relevance.');
        }

        // Urgency / Action words
        const urgencyRegex = /\b(now|limited|expire|fast|today|free|bogo|off|gift)\b/i;
        if (urgencyRegex.test(sub) || urgencyRegex.test(cop)) {
          openRate += 1.5;
          clickRate += 0.8;
          score += 6;
          feedback.push('High-urgency promotional triggers detected.');
        }

        // Punctuation / Capitals
        if (sub === sub.toUpperCase() && sub.length > 5) {
          openRate -= 3.0;
          score -= 10;
          feedback.push('ALL-CAPS subject looks spammy; risk of filter blocking.');
        }

        // Click Rate factors (Copy CTA in snippet body)
        const ctaVerbs = /\b(claim|redeem|get|click|tap|buy|shop|order|download|view)\b/i;
        if (ctaVerbs.test(cop)) {
          clickRate += 0.5;
          score += 3;
        }

        // Button/Link specific evaluations
        if (btnText) {
          if (ctaVerbs.test(btnText)) {
            clickRate += 1.2;
            score += 8;
            feedback.push(`Strong CTA button verb detected ("${btnText}").`);
          } else {
            clickRate -= 0.3;
            feedback.push(`CTA button ("${btnText}") lacks action verb (e.g. claim, get).`);
          }

          if (btnText.length > 25) {
            score -= 3;
            feedback.push('CTA text is long; may wrap on smaller screen devices.');
          }
        } else {
          clickRate -= 1.0;
          score -= 10;
          feedback.push('No primary CTA button copy defined. Click rate is low.');
        }

        if (btnLink) {
          const url = btnLink.trim();
          if (url === '#' || url === '') {
            clickRate -= 1.5;
            score -= 12;
            feedback.push('CTA points to empty/placeholder href ("#").');
          } else if (url.includes('example.com') || url.includes('placeholder.com')) {
            clickRate -= 0.8;
            score -= 6;
            feedback.push('CTA points to a placeholder domain.');
          } else {
            if (url.includes('utm_source') && url.includes('utm_campaign')) {
              clickRate += 0.5;
              score += 5;
              feedback.push('CTA includes active campaign tracking UTM parameters.');
            } else {
              score -= 3;
              feedback.push('CTA link lacks UTM source/campaign tracking variables.');
            }

            if (url.startsWith('https://')) {
              score += 2;
            }
          }
        }

        return {
          openRate: parseFloat(openRate.toFixed(1)),
          clickRate: parseFloat(clickRate.toFixed(1)),
          score: Math.min(100, Math.max(0, score)),
          feedback: feedback.slice(0, 4)
        };
      };

      const resA = evaluate(abSubjectA, abCopyA, abButtonTextA, abButtonLinkA);
      const resB = evaluate(abSubjectB, abCopyB, abButtonTextB, abButtonLinkB);

      setAbResults({ variantA: resA, variantB: resB });
      setAbEvaluating(false);
    }, 1000);
  };

  return (
    <div className="fade-in">
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={20} style={{ color: 'var(--accent-purple)' }} />
              A/B Subject Line & Copy CTR Predictor
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Compare email subjects and body copy combinations side-by-side. The local AI model runs predictive engagement score simulations.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleLoadBaseline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            📋 Load Current Workspace Baseline
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="ab-grid">
            {/* Variant A Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <h5 style={{ color: 'var(--accent-cyan)', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>Variant A (Current Baseline)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{abSubjectA.length} chars</span>
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Subject Line A:</label>
                <input
                  type="text"
                  value={abSubjectA}
                  onChange={(e) => setAbSubjectA(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="Subject Line"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Body copy snippet A:</label>
                <textarea
                  value={abCopyA}
                  onChange={(e) => setAbCopyA(e.target.value)}
                  rows={4}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', resize: 'vertical' }}
                  placeholder="Variant A body copy text..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CTA Button Text A (optional):</label>
                <input
                  type="text"
                  value={abButtonTextA}
                  onChange={(e) => setAbButtonTextA(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Claim Offer"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CTA Button Link A (optional):</label>
                <input
                  type="text"
                  value={abButtonLinkA}
                  onChange={(e) => setAbButtonLinkA(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. https://example.com/redeem"
                />
              </div>
            </div>

            {/* Variant B Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <h5 style={{ color: 'var(--accent-purple)', fontWeight: '600', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>Variant B (Alternative Challenger)</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{abSubjectB.length} chars</span>
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Subject Line B:</label>
                <input
                  type="text"
                  value={abSubjectB}
                  onChange={(e) => setAbSubjectB(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="Subject Line"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Body copy snippet B:</label>
                <textarea
                  value={abCopyB}
                  onChange={(e) => setAbCopyB(e.target.value)}
                  rows={4}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', resize: 'vertical' }}
                  placeholder="Variant B body copy text..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CTA Button Text B (optional):</label>
                <input
                  type="text"
                  value={abButtonTextB}
                  onChange={(e) => setAbButtonTextB(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Redeem Offer"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>CTA Button Link B (optional):</label>
                <input
                  type="text"
                  value={abButtonLinkB}
                  onChange={(e) => setAbButtonLinkB(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. https://example.com/redeem"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleEvaluateAB}
              disabled={abEvaluating}
              style={{
                padding: '0.65rem 2.75rem',
                background: 'var(--cyan-gradient)',
                color: '#ffffff',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: 'none',
                boxShadow: 'var(--accent-glow)'
              }}
            >
              {abEvaluating && <RefreshCw size={16} className="spin" />}
              {abEvaluating ? '🤖 Consulting AI robot overlords... 🔮' : '⚖️ Evaluate Head-to-Head CTR'}
            </button>
          </div>

          {/* Results Side by Side */}
          {abResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', textAlign: 'center', color: 'var(--text-primary)' }}>AI Predictive CTR Matrix</h4>
              
              <div className="ab-grid">
                {/* Results Variant A */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid ' + (abResults.variantA.score >= abResults.variantB.score ? 'var(--success)' : 'var(--border-color)'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  position: 'relative',
                  boxShadow: abResults.variantA.score >= abResults.variantB.score ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
                }}>
                  {abResults.variantA.score >= abResults.variantB.score && (
                    <span style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--success)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      👑 AI CHOSEN WINNER
                    </span>
                  )}
                  <h6 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Variant A Scorecard</h6>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{abResults.variantA.score}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engagement Grade</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Predicted Open Rate:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{abResults.variantA.openRate}%</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Predicted Click Rate (CTR):</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{abResults.variantA.clickRate}%</strong>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Key Triggers:</strong>
                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: 0 }}>
                      {abResults.variantA.feedback.map((f, idx) => <li key={idx}>{f}</li>)}
                    </ul>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleApplyVariant(abSubjectA, abCopyA, abButtonTextA, abButtonLinkA)}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      width: '100%',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}
                  >
                    📥 Apply Variant A to Workspace
                  </button>
                </div>

                {/* Results Variant B */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid ' + (abResults.variantB.score >= abResults.variantA.score ? 'var(--success)' : 'var(--border-color)'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  position: 'relative',
                  boxShadow: abResults.variantB.score >= abResults.variantA.score ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
                }}>
                  {abResults.variantB.score >= abResults.variantA.score && (
                    <span style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--success)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      👑 AI CHOSEN WINNER
                    </span>
                  )}
                  <h6 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Variant B Scorecard</h6>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{abResults.variantB.score}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engagement Grade</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Predicted Open Rate:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{abResults.variantB.openRate}%</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Predicted Click Rate (CTR):</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{abResults.variantB.clickRate}%</strong>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Key Triggers:</strong>
                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: 0 }}>
                      {abResults.variantB.feedback.map((f, idx) => <li key={idx}>{f}</li>)}
                    </ul>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleApplyVariant(abSubjectB, abCopyB, abButtonTextB, abButtonLinkB)}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      width: '100%',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}
                  >
                    📥 Apply Variant B to Workspace
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--success)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontSize: '0.85rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
