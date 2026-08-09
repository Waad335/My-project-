/**
 * ATHAR | أثر — Scroll-driven 3D motion layer.
 *
 * Purely additive/visual, and independent from js/luxury-3d.js: this module
 * only writes CSS custom properties plus the standalone `scale`/`rotate`
 * properties (never `transform` on elements that already carry a keyframe
 * `animation`, e.g. .hero-emblem/.hero-glow), so it composes cleanly with
 * both the existing pointer-parallax layer and the existing entrance
 * animations instead of overriding them. Never touches any data-*, id,
 * cart, wishlist, checkout, or Supabase-related logic.
 *
 * Unlike js/luxury-3d.js, this module is NOT gated on `pointer: fine` — it
 * is driven entirely by scroll position, so it runs (gently) on touch
 * devices too. It only fully skips when the user prefers reduced motion.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  document.addEventListener('DOMContentLoaded', function () {
    initHeroScrollMotion();
    initProductImageParallax();
  });

  /** Runs `fn` at most once per animation frame, always with the latest args. */
  function rafThrottle(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn();
      });
    };
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ===========================================================================
  // Hero: background / text / emblem move through 3D space at different
  // speeds as the hero scrolls past — perspective + translate3d + translateZ
  // + scale + rotateX, gated to only compute while the hero is on screen.
  // ===========================================================================
  function initHeroScrollMotion() {
    var hero = document.querySelector('.hero');
    var inner = hero && hero.querySelector('.hero-inner');
    if (!hero || !inner) return;

    var glow = hero.querySelector('.hero-glow');
    var emblem = hero.querySelector('.hero-emblem');

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }

    var onScroll = rafThrottle(function () {
      if (!visible) return;
      var rect = hero.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      // 0 at the top of the page, 1 once the hero has scrolled fully past
      // one viewport height — the whole motion resolves within one screen
      // of scrolling, so it reads as a strong, clearly-visible effect.
      var progress = clamp(-rect.top / (rect.height || vh), 0, 1);

      // Text/CTA block: drifts up + back into depth + scales down + tilts,
      // the fastest-moving foreground layer.
      inner.style.setProperty('--hero-x', (progress * -16).toFixed(1) + 'px');
      inner.style.setProperty('--hero-y', (progress * -100).toFixed(1) + 'px');
      inner.style.setProperty('--hero-z', (progress * -280).toFixed(1) + 'px');
      inner.style.setProperty('--hero-scale', (1 - progress * 0.14).toFixed(3));
      inner.style.setProperty('--hero-rot', (progress * 7).toFixed(2) + 'deg');
      inner.style.setProperty('--hero-op', (1 - progress * 0.85).toFixed(2));

      // Background gradient: slowest layer, a gentle zoom (scale up) to
      // read as depth receding behind the text.
      hero.style.setProperty('--hero-bg-scale', (1 + progress * 0.18).toFixed(3));

      // Glow: mid-speed layer, drifts down/aside and zooms independently of
      // its own infinite float-glow keyframe animation.
      if (glow) {
        glow.style.scale = (1 + progress * 0.3).toFixed(3);
        glow.style.translate = (progress * 30).toFixed(1) + 'px ' + (progress * 55).toFixed(1) + 'px';
      }

      // Emblem: reads as the "hero image" sinking away in depth.
      if (emblem) {
        emblem.style.scale = (1 - progress * 0.34).toFixed(3);
        emblem.style.rotate = (progress * 10).toFixed(2) + 'deg';
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  // ===========================================================================
  // Product cards: the image inside each card drifts a few px opposite the
  // scroll direction (parallax-in-frame). Cards are injected dynamically
  // after async Supabase fetches on every listing page, so a MutationObserver
  // picks up new `.product-media` elements as grids render, mirroring how
  // js/animations.js's AtharObserveReveal is re-invoked for the same reason.
  // ===========================================================================
  function initProductImageParallax() {
    if (!('IntersectionObserver' in window)) return;

    var active = [];

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = active.indexOf(entry.target);
        if (entry.isIntersecting) {
          if (idx === -1) active.push(entry.target);
        } else if (idx !== -1) {
          entry.target.style.removeProperty('--img-py');
          entry.target.style.removeProperty('--img-px');
          active.splice(idx, 1);
        }
      });
    }, { rootMargin: '250px 0px' });

    function observeWithin(root) {
      if (root.nodeType !== 1) return;
      if (root.matches && root.matches('.product-media')) io.observe(root);
      if (root.querySelectorAll) {
        var found = root.querySelectorAll('.product-media');
        for (var i = 0; i < found.length; i++) io.observe(found[i]);
      }
    }

    observeWithin(document.body);

    if ('MutationObserver' in window) {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) observeWithin(added[j]);
        }
      }).observe(document.body, { childList: true, subtree: true });
    }

    var onScroll = rafThrottle(function () {
      if (!active.length) return;
      var vh = window.innerHeight || 800;
      for (var i = 0; i < active.length; i++) {
        var media = active[i];
        var rect = media.getBoundingClientRect();
        var centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
        var y = clamp(centerOffset * -22, -20, 20);
        var x = clamp(centerOffset * 4, -6, 6);
        media.style.setProperty('--img-py', y.toFixed(1) + 'px');
        media.style.setProperty('--img-px', x.toFixed(1) + 'px');
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }
})();
