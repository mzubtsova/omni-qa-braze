// Automatically sanitize localStorage on app initialization to remove legacy Dairy Queen/Blizzard/DQ mentions.
(function sanitizeLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // 1. Sanitize the main catalog
    const catalogRaw = localStorage.getItem('omniqa_braze_catalog');
    if (catalogRaw && (
      catalogRaw.toLowerCase().includes('dairy') ||
      catalogRaw.toLowerCase().includes('queen') ||
      catalogRaw.toLowerCase().includes('blizzard') ||
      catalogRaw.toLowerCase().includes('dq')
    )) {
      let sanitized = catalogRaw
        .replace(/dairy\s+queen/gi, 'Northstar')
        .replace(/blizzard/gi, 'Welcome Reward')
        .replace(/\bdq\b/gi, 'Northstar')
        .replace(/dq-/gi, 'welcome-')
        .replace(/dairy-/gi, 'welcome-')
        .replace(/blizzard-/gi, 'welcome-');
      localStorage.setItem('omniqa_braze_catalog', sanitized);
    }

    // 2. Sanitize specific key-value pairs in localStorage
    const keysToSanitize = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.toLowerCase().includes('dq') ||
        key.toLowerCase().includes('dairy') ||
        key.toLowerCase().includes('blizzard')
      )) {
        keysToSanitize.push(key);
      }
    }

    keysToSanitize.forEach(key => {
      const val = localStorage.getItem(key);
      // Construct a clean key
      const newKey = key
        .replace(/dq-/gi, 'welcome-')
        .replace(/dairy-/gi, 'welcome-')
        .replace(/blizzard-/gi, 'welcome-')
        .replace(/dq/gi, 'welcome')
        .replace(/dairy/gi, 'welcome')
        .replace(/blizzard/gi, 'welcome');
      
      if (val) {
        const sanitizedVal = val
          .replace(/dairy\s+queen/gi, 'Northstar')
          .replace(/blizzard/gi, 'Welcome Reward')
          .replace(/\bdq\b/gi, 'Northstar');
        localStorage.setItem(newKey, sanitizedVal);
      }
      if (newKey !== key) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Local storage sanitization failed:", e);
  }
})();
