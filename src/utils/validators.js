/**
 * Custom QA Validation Engines for Campaign HTML and Liquid Markup.
 */

/**
 * 1. Checks for unbalanced Liquid tags and syntax errors
 */
export function validateLiquidSyntax(html) {
  const errors = [];
  if (!html) return errors;

  // Check 1: Balanced braces {{ and }}
  const openBraces = (html.match(/\{\{/g) || []).length;
  const closeBraces = (html.match(/\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push({
      type: 'liquid',
      severity: 'high',
      item: `Unbalanced variables`,
      message: `Found ${openBraces} opening '{{' tags but ${closeBraces} closing '}}' tags.`
    });
  }

  // Check 2: Unbalanced {% and %}
  const openBlocks = (html.match(/\{%/g) || []).length;
  const closeBlocks = (html.match(/%\}/g) || []).length;
  if (openBlocks !== closeBlocks) {
    errors.push({
      type: 'liquid',
      severity: 'high',
      item: `Unbalanced logic tags`,
      message: `Found ${openBlocks} opening '{%' tags but ${closeBlocks} closing '%}' tags.`
    });
  }

  // Check 3: Nested depth check for {% if %} and {% endif %}
  let depth = 0;
  
  // Find all conditional tags sequentially
  const regex = /\{%\s*(if|endif)\b.*?%\}/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const tag = match[1];
    if (tag === 'if') {
      depth++;
    } else if (tag === 'endif') {
      depth--;
      if (depth < 0) {
        errors.push({
          type: 'liquid',
          severity: 'high',
          item: `Orphan {% endif %}`,
          message: `Found a closing '{% endif %}' tag without a matching opening '{% if %}' at character ${match.index}.`
        });
        depth = 0; // reset
      }
    }
  }

  if (depth > 0) {
    errors.push({
      type: 'liquid',
      severity: 'high',
      item: `Unclosed {% if %}`,
      message: `Found ${depth} unclosed '{% if %}' statement(s) at the end of the template.`
    });
  }

  return errors;
}

/**
 * 2. Extracts and audits all links in the HTML
 */
export function auditHtmlLinks(html) {
  const issues = [];
  if (!html) return issues;

  // Regex to extract href attributes from <a> tags
  const hrefRegex = /<a\s+[^>]*href=["']([^"']*)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1].trim();
    const tagMatch = html.substring(match.index, html.indexOf('>', match.index) + 1);

    if (!url || url === '#' || url.toLowerCase().startsWith('javascript:')) {
      issues.push({
        type: 'link',
        severity: 'high',
        item: `Empty Link`,
        message: `Found empty or dummy href ("${url}") inside tag: ${tagMatch.substring(0, 50)}...`
      });
      continue;
    }

    if (url.includes('example.com') || url.includes('placeholder.com')) {
      issues.push({
        type: 'link',
        severity: 'medium',
        item: `Placeholder Link`,
        message: `Link points to a placeholder domain: "${url}"`
      });
    }

    // Check for UTM Parameters
    if (url.startsWith('http') && !url.includes('utm_source')) {
      issues.push({
        type: 'link',
        severity: 'low',
        item: `Missing Tracking`,
        message: `Link lacks UTM campaign parameters (utm_source): "${url.substring(0, 40)}..."`
      });
    }
  }

  return issues;
}

/**
 * 3. Audits color contrast of inline buttons
 */
export function checkWcagContrast(html) {
  const issues = [];
  if (!html) return issues;

  // Regex to extract tags with background colors and text colors in styles
  // E.g., style="background-color: #ffffff; color: #000000;"
  const styleRegex = /<([a-z0-9]+)\s+[^>]*style=["']([^"']*)["'][^>]*>(.*?)<\/\1>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const styleAttr = match[2];
    const textContent = match[3].replace(/<[^>]*>/g, '').trim(); // Strip inner HTML tags

    if (!textContent || textContent.length > 50) continue; // Only check labels/buttons

    // Try to extract background-color (or background) and color
    const bgMatch = styleAttr.match(/background-color\s*:\s*(#[a-f0-9]{3,6}|rgb\([^)]+\))/i);
    const colorMatch = styleAttr.match(/color\s*:\s*(#[a-f0-9]{3,6}|rgb\([^)]+\))/i);

    if (bgMatch && colorMatch) {
      const bgColor = bgMatch[1];
      const textColor = colorMatch[1];

      const ratio = calculateContrastRatio(bgColor, textColor);
      
      if (ratio < 4.5 && ratio > 1) {
        const severity = ratio < 3.0 ? 'high' : 'medium';
        issues.push({
          type: 'wcag',
          severity: severity,
          item: `Low Color Contrast`,
          message: `Label "${textContent}" has a low contrast ratio of ${ratio.toFixed(2)}:1 (Min required: 4.5:1). BG: ${bgColor}, Text: ${textColor}`
        });
      }
    } else if (colorMatch && !bgMatch) {
      const textColor = colorMatch[1];
      const rgb = parseColorToRgb(textColor);
      if (rgb) {
        const lum = getLuminance(rgb);
        // If the text color is dark (luminance < 0.35)
        if (lum < 0.35) {
          issues.push({
            type: 'wcag',
            severity: 'low',
            item: `Dark Mode Risk`,
            message: `Element <${tagName}> "${textContent.substring(0, 30)}" has a hardcoded dark color (${textColor}) without a background-color. It may become invisible when email clients invert the background in Dark Mode.`
          });
        }
      }
    }
  }

  return issues;
}

// ==========================================
// CONTRAST CALCULATION UTILS
// ==========================================

function getLuminance(rgb) {
  const a = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function hexToRgb(hex) {
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function parseColorToRgb(colorStr) {
  const clean = colorStr.trim().toLowerCase();
  if (clean.startsWith('#')) {
    return hexToRgb(clean);
  }
  // Try parsing rgb(r, g, b) format
  const rgbMatch = clean.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  
  // Standard simple color fallbacks
  if (clean === 'white') return [255, 255, 255];
  if (clean === 'black') return [0, 0, 0];
  if (clean === 'red') return [255, 0, 0];
  
  return null;
}

function calculateContrastRatio(color1, color2) {
  const rgb1 = parseColorToRgb(color1);
  const rgb2 = parseColorToRgb(color2);

  if (!rgb1 || !rgb2) return 5; // default fail-safe

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 4. Audits all images in the HTML for accessibility and transparent dark mode risks
 */
export function auditImages(html) {
  const issues = [];
  if (!html) return issues;

  // Regex to extract <img> tags
  const imgRegex = /<img\s+([^>]*?)>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const imgAttrs = match[1];
    const tagMatch = match[0];

    // Check 1: Missing alt attribute
    const hasAlt = /alt\s*=\s*["']/i.test(imgAttrs);
    if (!hasAlt) {
      issues.push({
        type: 'image',
        severity: 'medium',
        item: `Missing Alt Tag`,
        message: `Image tag lacks an 'alt' attribute for screen reader accessibility: ${tagMatch.substring(0, 50)}...`
      });
    }

    // Check 2: Transparent PNG Dark Mode Inversion Risk
    const srcMatch = imgAttrs.match(/src\s*=\s*["']([^"']*)["']/i);
    if (srcMatch) {
      const srcUrl = srcMatch[1].toLowerCase();
      if (srcUrl.endsWith('.png') && !imgAttrs.includes('dark-protect') && !imgAttrs.includes('bg-') && !imgAttrs.includes('background')) {
        issues.push({
          type: 'image',
          severity: 'low',
          item: `Transparent Image Inversion`,
          message: `Image "${srcUrl.split('/').pop()}" is a transparent PNG. It may become unreadable against inverted dark backgrounds in dark clients. Consider adding a white border or protective background.`
        });
      }
    }
  }

  return issues;
}

/**
 * Extracts a clean Braze Campaign/Canvas ID from a dashboard URL or raw string.
 * Supports 24-character hexadecimal campaign IDs and 36-character UUID canvas IDs.
 */
export function extractBrazeId(val) {
  if (!val) return '';
  
  // 1. Decode URL encoding (very common in mobile sharing sheets and messaging clients)
  let trimmed = String(val).trim();
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    // Ignore decode error and proceed with original
  }
  
  // 2. Remove invisible control characters / zero-width spaces (common on mobile clipboards)
  trimmed = trimmed.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 3. Match standard Braze URL path patterns first
  const urlMatch = trimmed.match(/\/(?:campaigns|canvas)(?:\/editor|\/details)?\/([a-fA-F0-9]{24}|[0-9a-fA-F-]{36})/i) ||
                   trimmed.match(/\/([a-fA-F0-9]{24}|[0-9a-fA-F-]{36})(?:\/|$|\?)/i);
  
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }
  
  // 4. Fallback: Scan the entire string for any 36-character UUID or 24-character hexadecimal string.
  // This handles deep links, shortened links, or cases where extra text surrounds the URL (like share sheet prefixes)
  const uuidMatch = trimmed.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  if (uuidMatch) {
    return uuidMatch[0].toLowerCase();
  }
  
  const hexMatch = trimmed.match(/\b[a-fA-F0-9]{24}\b/);
  if (hexMatch) {
    return hexMatch[0].toLowerCase();
  }
  
  // 5. Final fallback: return cleaned, lowercase string
  return trimmed.toLowerCase();
}

