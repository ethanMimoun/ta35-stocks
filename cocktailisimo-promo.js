// ==========================================================================
// COCKTAILISIMO × מגמת צמיחה — Promo Module
// ==========================================================================
// אופן השימוש: הוסף שורה אחת לפני </body> ב-index.html של אפליקציית הבורסה:
// <script src="cocktailisimo-promo.js"></script>
//
// הסקריפט הזה:
// 1. מציג פוש חגיגי על קניית מניה מעל 1000₪
// 2. מוסיף באנר ספונסר קבוע בתחתית הדף
// 3. מנהל קוד קופון BURSA20 (20% הנחה) שמחובר ל-Cocktailisimo
// 4. עוקב אחרי תדירות התצוגה - לא לשגע את המשתמש
// ==========================================================================

(function () {
  'use strict';

  // ============ CONFIG ============
  const CONFIG = {
    minPurchaseAmount: 1000,          // סכום מינימלי בש"ח להפעלת הפוש
    couponCode: 'BURSA20',
    discountPercent: 20,
    cocktailisimoUrl: 'https://ethanmimoun.github.io/cocktailisimo/',
    storageKey: 'cocktailisimo_promo_state',
    cooldownHours: 4,                 // אחרי שראה — לא להציג שוב במשך X שעות
    maxPerWeek: 3,                    // מקסימום פעמים בשבוע
    debug: false                      // true = הדפסות לקונסול
  };

  const log = (...args) => CONFIG.debug && console.log('[Cocktailisimo Promo]', ...args);

  // ============ STATE MANAGEMENT ============
  function loadState() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : { shows: [], dismissals: 0, lastDismissalAt: null };
    } catch {
      return { shows: [], dismissals: 0, lastDismissalAt: null };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
    } catch (e) {
      log('Could not save state', e);
    }
  }

  function shouldShowPromo() {
    const state = loadState();
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Clean old shows
    state.shows = state.shows.filter(t => t > oneWeekAgo);

    // Check cooldown
    if (state.shows.length > 0) {
      const lastShow = Math.max(...state.shows);
      const hoursSince = (now - lastShow) / (1000 * 60 * 60);
      if (hoursSince < CONFIG.cooldownHours) {
        log(`On cooldown, ${(CONFIG.cooldownHours - hoursSince).toFixed(1)}h remaining`);
        return false;
      }
    }

    // Check weekly limit
    if (state.shows.length >= CONFIG.maxPerWeek) {
      log('Weekly limit reached');
      return false;
    }

    return true;
  }

  function recordShow() {
    const state = loadState();
    state.shows.push(Date.now());
    saveState(state);
  }

  function recordDismissal() {
    const state = loadState();
    state.dismissals = (state.dismissals || 0) + 1;
    state.lastDismissalAt = Date.now();
    saveState(state);
  }

  // ============ STYLES INJECTION ============
  function injectStyles() {
    if (document.getElementById('cocktailisimo-promo-styles')) return;

    const style = document.createElement('style');
    style.id = 'cocktailisimo-promo-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Italiana&family=Cormorant+Garamond:ital@0;1&display=swap');

      .ctl-promo-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: ctl-fade-in 0.4s ease;
        direction: rtl;
      }

      .ctl-promo-overlay.show { display: flex; }

      @keyframes ctl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .ctl-promo-card {
        position: relative;
        background: linear-gradient(135deg, #14100d 0%, #1a1612 100%);
        border: 1px solid #c9a961;
        max-width: 480px;
        width: 100%;
        padding: 50px 36px 36px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(201, 169, 97, 0.2);
        animation: ctl-pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
      }

      @keyframes ctl-pop-in {
        0% { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      .ctl-promo-card::before {
        content: '';
        position: absolute;
        inset: 12px;
        border: 1px solid rgba(201, 169, 97, 0.3);
        pointer-events: none;
      }

      .ctl-promo-close {
        position: absolute;
        top: 18px;
        left: 18px;
        background: transparent;
        border: none;
        color: #d9cfb8;
        font-size: 22px;
        cursor: pointer;
        z-index: 2;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s;
      }

      .ctl-promo-close:hover { color: #c9a961; }

      .ctl-promo-emoji {
        font-size: 56px;
        margin-bottom: 16px;
        animation: ctl-bounce 1s ease;
      }

      @keyframes ctl-bounce {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-12px); }
        50% { transform: translateY(0); }
        75% { transform: translateY(-6px); }
      }

      .ctl-promo-eyebrow {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 13px;
        color: #c9a961;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        margin-bottom: 12px;
      }

      .ctl-promo-title {
        font-family: 'Italiana', serif;
        font-size: 36px;
        color: #f5ecd9;
        line-height: 1.1;
        margin-bottom: 12px;
        letter-spacing: 0.02em;
      }

      .ctl-promo-title em {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        color: #c9a961;
        font-weight: 400;
      }

      .ctl-promo-text {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 17px;
        color: #d9cfb8;
        line-height: 1.6;
        margin-bottom: 28px;
        max-width: 360px;
        margin-left: auto;
        margin-right: auto;
      }

      .ctl-promo-coupon {
        background: rgba(201, 169, 97, 0.08);
        border: 1px dashed #c9a961;
        padding: 18px 24px;
        margin-bottom: 24px;
        position: relative;
      }

      .ctl-promo-coupon-label {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 12px;
        color: #d9cfb8;
        letter-spacing: 0.15em;
        margin-bottom: 6px;
      }

      .ctl-promo-coupon-code {
        font-family: 'Italiana', serif;
        font-size: 32px;
        color: #e6c878;
        letter-spacing: 0.3em;
        margin-bottom: 8px;
      }

      .ctl-promo-coupon-discount {
        font-family: 'Cormorant Garamond', serif;
        font-size: 14px;
        color: #c9a961;
        font-style: italic;
      }

      .ctl-copy-hint {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 11px;
        color: rgba(217, 207, 184, 0.6);
        opacity: 0;
        transition: opacity 0.3s;
      }

      .ctl-promo-coupon:hover { cursor: pointer; }
      .ctl-promo-coupon:hover .ctl-copy-hint { opacity: 1; }
      .ctl-promo-coupon.copied {
        border-color: #67c23a;
        background: rgba(103, 194, 58, 0.08);
      }
      .ctl-promo-coupon.copied .ctl-copy-hint {
        opacity: 1;
        color: #67c23a;
      }

      .ctl-promo-cta {
        display: block;
        width: 100%;
        background: #c9a961;
        color: #0a0807;
        border: none;
        padding: 18px;
        font-family: 'Inter', 'Heebo', sans-serif;
        font-size: 12px;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.4s ease;
        font-weight: 600;
        text-decoration: none;
        margin-bottom: 12px;
      }

      .ctl-promo-cta:hover {
        background: #f5ecd9;
        letter-spacing: 0.5em;
      }

      .ctl-promo-cta-secondary {
        display: block;
        width: 100%;
        background: transparent;
        color: #d9cfb8;
        border: 1px solid rgba(201, 169, 97, 0.25);
        padding: 12px;
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .ctl-promo-cta-secondary:hover {
        border-color: #c9a961;
        color: #c9a961;
      }

      .ctl-promo-disclaimer {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 11px;
        color: rgba(217, 207, 184, 0.5);
        margin-top: 16px;
        line-height: 1.5;
      }

      /* Confetti */
      .ctl-confetti {
        position: fixed;
        top: -20px;
        z-index: 99998;
        pointer-events: none;
      }

      @keyframes ctl-confetti-fall {
        0% { transform: translateY(0) rotate(0); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }

      /* Sponsor Banner (subtle, persistent) */
      .ctl-sponsor-banner {
        position: fixed;
        bottom: 16px;
        right: 16px;
        background: rgba(20, 16, 13, 0.92);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(201, 169, 97, 0.4);
        padding: 10px 16px;
        z-index: 9000;
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 12px;
        color: #d9cfb8;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: none;
        align-items: center;
        gap: 10px;
        max-width: 280px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      }

      .ctl-sponsor-banner.visible { display: flex; }

      .ctl-sponsor-banner:hover {
        border-color: #c9a961;
        background: rgba(20, 16, 13, 1);
      }

      .ctl-sponsor-banner-label {
        font-size: 9px;
        letter-spacing: 0.2em;
        color: #c9a961;
        text-transform: uppercase;
        font-style: normal;
      }

      .ctl-sponsor-banner-name {
        font-family: 'Italiana', serif;
        font-size: 13px;
        color: #f5ecd9;
        letter-spacing: 0.15em;
        font-style: normal;
      }

      .ctl-sponsor-banner-close {
        background: transparent;
        border: none;
        color: rgba(217, 207, 184, 0.4);
        cursor: pointer;
        font-size: 14px;
        padding: 0 0 0 4px;
        margin-right: -4px;
        transition: color 0.3s;
      }

      .ctl-sponsor-banner-close:hover { color: #c9a961; }

      @media (max-width: 600px) {
        .ctl-promo-card { padding: 40px 24px 24px; }
        .ctl-promo-title { font-size: 28px; }
        .ctl-promo-text { font-size: 15px; }
        .ctl-promo-coupon-code { font-size: 26px; letter-spacing: 0.2em; }
        .ctl-sponsor-banner {
          bottom: 80px;  /* above mobile nav */
          right: 12px;
          left: 12px;
          max-width: none;
          font-size: 11px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============ CONFETTI ============
  function shootConfetti() {
    const colors = ['#c9a961', '#e6c878', '#f5ecd9', '#ffffff', '#8b6f3a'];
    const count = 50;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'ctl-confetti';
      const size = 6 + Math.random() * 6;
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size * 1.5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation: ctl-confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 0.5}s ease-in forwards;
        ${Math.random() > 0.5 ? 'border-radius: 50%;' : ''}
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  // ============ PROMO MODAL ============
  function showPromoModal(purchaseInfo) {
    log('Showing promo for purchase:', purchaseInfo);

    // Build modal
    const overlay = document.createElement('div');
    overlay.className = 'ctl-promo-overlay';
    overlay.innerHTML = `
      <div class="ctl-promo-card">
        <button class="ctl-promo-close" aria-label="סגור">✕</button>
        <div class="ctl-promo-emoji">🎉</div>
        <div class="ctl-promo-eyebrow">— מבצע מיוחד עבורך</div>
        <h2 class="ctl-promo-title">קנייה <em>מוצלחת!</em></h2>
        <p class="ctl-promo-text">
          חגיגה כזאת דורשת משקה טוב.<br>
          ${escapeHtml(purchaseInfo.companyName || 'המניה')} עלתה לתיק שלך — מגיע לך לחגוג.
        </p>
        <div class="ctl-promo-coupon" id="ctl-coupon">
          <div class="ctl-promo-coupon-label">קוד קופון לקוקטיילסימו</div>
          <div class="ctl-promo-coupon-code">${CONFIG.couponCode}</div>
          <div class="ctl-promo-coupon-discount">${CONFIG.discountPercent}% הנחה על ההזמנה</div>
          <div class="ctl-copy-hint">לחץ להעתקה</div>
        </div>
        <a href="${CONFIG.cocktailisimoUrl}?coupon=${CONFIG.couponCode}" target="_blank" rel="noopener" class="ctl-promo-cta">
          קח אותי לקוקטיילסימו →
        </a>
        <button class="ctl-promo-cta-secondary" id="ctl-dismiss">אולי בפעם הבאה</button>
        <p class="ctl-promo-disclaimer">
          קוקטיילסימו · בית קוקטיילים פרטי בהרצליה<br>
          הקופון תקף לשבועיים · משלוח חינם בהרצליה
        </p>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    // Wire interactions
    const close = () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 400);
    };

    overlay.querySelector('.ctl-promo-close').addEventListener('click', () => {
      recordDismissal();
      close();
    });

    overlay.querySelector('#ctl-dismiss').addEventListener('click', () => {
      recordDismissal();
      close();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        recordDismissal();
        close();
      }
    });

    // Coupon copy
    const couponEl = overlay.querySelector('#ctl-coupon');
    couponEl.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.couponCode);
        couponEl.classList.add('copied');
        couponEl.querySelector('.ctl-copy-hint').textContent = '✓ הועתק';
        setTimeout(() => {
          couponEl.classList.remove('copied');
          couponEl.querySelector('.ctl-copy-hint').textContent = 'לחץ להעתקה';
        }, 2000);
      } catch (e) {
        log('Copy failed', e);
      }
    });

    // CTA click → also count as a non-dismissal "engaged" action
    overlay.querySelector('.ctl-promo-cta').addEventListener('click', () => {
      log('User clicked CTA');
      setTimeout(close, 300);
    });

    recordShow();
    shootConfetti();
  }

  // ============ SPONSOR BANNER ============
  function showSponsorBanner() {
    if (document.getElementById('ctl-sponsor-banner')) return;
    if (sessionStorage.getItem('ctl_banner_dismissed') === '1') return;

    const banner = document.createElement('a');
    banner.id = 'ctl-sponsor-banner';
    banner.className = 'ctl-sponsor-banner';
    banner.href = CONFIG.cocktailisimoUrl;
    banner.target = '_blank';
    banner.rel = 'noopener';
    banner.innerHTML = `
      <div>
        <div class="ctl-sponsor-banner-label">בחסות</div>
        <div class="ctl-sponsor-banner-name">COCKTAILISIMO</div>
      </div>
      <button class="ctl-sponsor-banner-close" aria-label="סגור" type="button">✕</button>
    `;

    banner.querySelector('.ctl-sponsor-banner-close').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sessionStorage.setItem('ctl_banner_dismissed', '1');
      banner.style.transform = 'translateX(120%)';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 400);
    });

    document.body.appendChild(banner);

    // Show after 3 seconds (let user settle into the app first)
    setTimeout(() => banner.classList.add('visible'), 3000);
  }

  // ============ HELPERS ============
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============ PUBLIC API ============
  window.CocktailisimoPromo = {
    /**
     * Trigger after successful stock purchase.
     * Pass the purchase total (in shekels) and company name.
     * Will only show if amount >= minPurchaseAmount and not on cooldown.
     */
    triggerOnPurchase(purchaseTotal, companyName) {
      const total = parseFloat(purchaseTotal) || 0;
      if (total < CONFIG.minPurchaseAmount) {
        log(`Purchase ${total}₪ below threshold ${CONFIG.minPurchaseAmount}₪`);
        return false;
      }
      if (!shouldShowPromo()) return false;

      // Tiny delay so it doesn't clash with the app's own success message
      setTimeout(() => showPromoModal({ total, companyName }), 800);
      return true;
    },

    /**
     * Force-show the promo (for testing).
     */
    forceShow(companyName = 'מניית בדיקה') {
      showPromoModal({ total: 9999, companyName });
    },

    /**
     * Reset all promo state (for testing).
     */
    reset() {
      localStorage.removeItem(CONFIG.storageKey);
      sessionStorage.removeItem('ctl_banner_dismissed');
      log('State reset');
    },

    config: CONFIG
  };

  // ============ AUTO-DETECTION OF PURCHASES ============
  // We try to wire ourselves to the existing app's buy flow.
  // The TA-35 app uses confirm() for buy confirmations and updates portfolio in Firestore.
  // We'll watch for the success notification or shek-amount changes.

  function attachAutoDetection() {
    // Strategy 1: Watch for buy success via showToast / showNotification
    // The app may use various toast functions - we hook into common patterns
    const originalAlert = window.alert;
    const buyKeywords = ['קנית', 'נקנה', 'הקנייה הושלמה', 'הקנייה בוצעה', 'נוסף לתיק'];

    // Strategy 2: Wrap window.confirm to catch confirmations like "לרכוש X מניות ב-Y₪?"
    const originalConfirm = window.confirm;
    let pendingPurchase = null;

    window.confirm = function (msg) {
      const result = originalConfirm.call(this, msg);

      if (result && typeof msg === 'string') {
        // Try to extract amount and company from confirmation message
        // Common patterns: "לרכוש 100 מניות של Apple ב-1500 ₪?"
        //                  "האם לקנות X ב-Y₪?"
        const amountMatch = msg.match(/(\d[\d,]*\.?\d*)\s*₪/);
        const totalAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

        if (totalAmount && totalAmount >= CONFIG.minPurchaseAmount) {
          // Try to extract company name
          const companyMatch = msg.match(/של\s+([^\s?]+(?:\s+[^\s?]+)?)/);
          const companyName = companyMatch ? companyMatch[1] : null;

          pendingPurchase = { total: totalAmount, companyName, time: Date.now() };
          log('Detected potential purchase confirm:', pendingPurchase);

          // Wait a bit for the app to process, then trigger
          setTimeout(() => {
            if (pendingPurchase && Date.now() - pendingPurchase.time < 3000) {
              window.CocktailisimoPromo.triggerOnPurchase(
                pendingPurchase.total,
                pendingPurchase.companyName
              );
              pendingPurchase = null;
            }
          }, 1500);
        }
      }
      return result;
    };

    log('Auto-detection attached. Manual trigger also available via CocktailisimoPromo.triggerOnPurchase()');
  }

  // ============ INIT ============
  function init() {
    injectStyles();
    showSponsorBanner();
    attachAutoDetection();
    log('Initialized. Test with: CocktailisimoPromo.forceShow()');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
