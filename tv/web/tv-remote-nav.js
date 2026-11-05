/**
 * HeMan Vibes TV — Spatial D-Pad & Remote Control Navigation Engine
 * Supports Android TV, Google TV, Amazon Fire TV, LG webOS, Samsung Tizen, and TV Web Browsers.
 */

(function () {
  'use strict';

  // Remote key codes for various Smart TV platforms
  const KEYS = {
    UP: [38, 'ArrowUp', 'Up'],
    DOWN: [40, 'ArrowDown', 'Down'],
    LEFT: [37, 'ArrowLeft', 'Left'],
    RIGHT: [39, 'ArrowRight', 'Right'],
    ENTER: [13, 'Enter', 'Select', 'MediaPlayPause'],
    BACK: [27, 8, 'Escape', 'Backspace', 'GoBack', 10009 /* Tizen */, 461 /* webOS */, 4 /* Android Back */],
    PLAY_PAUSE: [179, 'MediaPlayPause'],
  };

  let currentFocused = null;
  let hudTimeout = null;

  function isKey(e, keyArray) {
    return keyArray.includes(e.keyCode) || keyArray.includes(e.key) || keyArray.includes(e.code);
  }

  function getFocusables() {
    const selector = 'button, a, input, [tabindex="0"], .card, .btn, .sidebar-btn, .carousel-btn, .episode-card, .tv-focusable';
    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !el.disabled
      );
    });
  }

  function getCenter(el) {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function findNextFocus(direction) {
    const items = getFocusables();
    if (!items.length) return null;
    if (!currentFocused || !items.includes(currentFocused)) {
      return items[0];
    }

    const cur = getCenter(currentFocused);
    let bestCandidate = null;
    let minScore = Infinity;

    for (const item of items) {
      if (item === currentFocused) continue;
      const target = getCenter(item);
      const dx = target.x - cur.x;
      const dy = target.y - cur.y;

      let inDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (direction) {
        case 'up':
          inDirection = dy < -8;
          primaryDist = -dy;
          secondaryDist = Math.abs(dx);
          break;
        case 'down':
          inDirection = dy > 8;
          primaryDist = dy;
          secondaryDist = Math.abs(dx);
          break;
        case 'left':
          inDirection = dx < -8;
          primaryDist = -dx;
          secondaryDist = Math.abs(dy);
          break;
        case 'right':
          inDirection = dx > 8;
          primaryDist = dx;
          secondaryDist = Math.abs(dy);
          break;
      }

      if (inDirection) {
        // Spatial distance scoring with directional weighting
        const score = primaryDist + secondaryDist * 2.2;
        if (score < minScore) {
          minScore = score;
          bestCandidate = item;
        }
      }
    }

    return bestCandidate;
  }

  function focusElement(el) {
    if (!el) return;
    if (currentFocused) {
      currentFocused.classList.remove('tv-focused');
      currentFocused.removeAttribute('data-tv-focused');
    }
    currentFocused = el;
    currentFocused.classList.add('tv-focused');
    currentFocused.setAttribute('data-tv-focused', 'true');
    currentFocused.focus();

    // Scroll smoothly into center view
    currentFocused.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });

    showHudBriefly();
  }

  function showHudBriefly() {
    const hud = document.getElementById('tv-remote-hud');
    if (!hud) return;
    hud.classList.add('visible');
    clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      hud.classList.remove('visible');
    }, 3500);
  }

  function handleKeyDown(e) {
    if (isKey(e, KEYS.UP)) {
      e.preventDefault();
      const next = findNextFocus('up');
      if (next) focusElement(next);
    } else if (isKey(e, KEYS.DOWN)) {
      e.preventDefault();
      const next = findNextFocus('down');
      if (next) focusElement(next);
    } else if (isKey(e, KEYS.LEFT)) {
      e.preventDefault();
      const next = findNextFocus('left');
      if (next) focusElement(next);
    } else if (isKey(e, KEYS.RIGHT)) {
      e.preventDefault();
      const next = findNextFocus('right');
      if (next) focusElement(next);
    } else if (isKey(e, KEYS.ENTER)) {
      if (currentFocused) {
        currentFocused.click();
      }
    } else if (isKey(e, KEYS.BACK)) {
      e.preventDefault();
      // Close open modals if any, or trigger back
      const activeModal = document.querySelector('.modal-overlay, .blocked-modal-overlay');
      if (activeModal) {
        const closeBtn = activeModal.querySelector('button, .close-btn');
        if (closeBtn) closeBtn.click();
      } else if (window.history.length > 1) {
        window.history.back();
      }
    }
  }

  // Create on-screen TV remote controller HUD
  function createHud() {
    if (document.getElementById('tv-remote-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'tv-remote-hud';
    hud.className = 'tv-remote-hud';
    hud.innerHTML = `
      <div class="hud-pill">
        <span class="hud-key">▲▼◀▶</span> Navigate
        <span class="hud-dot">•</span>
        <span class="hud-key">OK</span> Select
        <span class="hud-dot">•</span>
        <span class="hud-key">⮌</span> Back
      </div>
    `;
    document.body.appendChild(hud);
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    createHud();
    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on first active item
    setTimeout(() => {
      const items = getFocusables();
      if (items.length) {
        focusElement(items[0]);
      }
    }, 400);
  });
})();
