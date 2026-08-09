/**
 * ATHAR | أثر — Luxury 3D experience layer.
 *
 * Purely additive/visual: reads pointer position and scroll offset and
 * writes CSS custom properties / the standalone `translate` property (hero,
 * buttons, decorative shapes) or a computed inline `transform` (cards,
 * which have no competing CSS `animation` to fight). Never touches any
 * data-*, id, cart, wishlist, checkout, or Supabase-related logic — those
 * elements keep every existing attribute/listener untouched.
 *
 * Fully skipped (module becomes a no-op) when the user prefers reduced
 * motion or the device has no fine pointer (touch/tablet) — those get the
 * pure-CSS fallback tier defined in css/luxury-3d.css instead.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (reduceMotion || !finePointer) return;

  document.addEventListener('DOMContentLoaded', function () {
    initHeroParallax();
    initPointerInteractions();
    initScrollDepth();
  });

  /** Runs `fn` at most once per animation frame, always with the latest args. */
  function rafThrottle(fn) {
    var scheduled = false;
    var lastArgs = null;
    return function () {
      lastArgs = arguments;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  // ===========================================================================
  // 1. HERO PARALLAX — layered depth on the existing hero text/CTA + a new
  //    decorative ring, gated to only run while the hero is on screen.
  // ===========================================================================
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var layers = [
      { el: hero.querySelector('.hero-emblem'), dx: 16, dy: 10 },
      { el: hero.querySelector('.hero-eyebrow'), dx: 10, dy: 6 },
      { el: hero.querySelector('h1'), dx: 13, dy: 8 },
      { el: hero.querySelector('p.hero-sub'), dx: 8, dy: 5 },
      { el: hero.querySelector('.hero-cta'), dx: 6, dy: 4 }
    ].filter(function (l) { return l.el; });
    if (!layers.length) return;

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }

    var onMove = rafThrottle(function (clientX, clientY) {
      if (!visible) return;
      var rect = hero.getBoundingClientRect();
      var x = (clientX - rect.left) / rect.width - 0.5;
      var y = (clientY - rect.top) / rect.height - 0.5;
      layers.forEach(function (l) {
        l.el.style.translate = (x * l.dx).toFixed(2) + 'px ' + (y * l.dy).toFixed(2) + 'px';
      });
      hero.style.setProperty('--px3d-bg', (x * -18).toFixed(2) + 'px');
      hero.style.setProperty('--py3d-bg', (y * -18).toFixed(2) + 'px');
    });

    hero.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      layers.forEach(function (l) { l.el.style.translate = ''; });
      hero.style.setProperty('--px3d-bg', '0px');
      hero.style.setProperty('--py3d-bg', '0px');
    });
  }

  // ===========================================================================
  // 2/3/4. CARD TILT + MAGNETIC BUTTONS — one delegated pointermove handler
  //    covers product cards, category cards, collection cards, the PDP
  //    gallery, and every button, since cards are injected dynamically
  //    after async Supabase fetches and a plain DOMContentLoaded scan would
  //    miss them (same reasoning as the existing delegated cart handler in
  //    js/cart.js).
  // ===========================================================================
  var TILT_SELECTOR = '.product-card, .cat-card, .collection-card, .pdp-gallery-main';
  var MAGNET_SELECTOR = '.btn, .icon-btn, .add-cart-btn, .fav-btn';
  var MAX_TILT_DEG = 7;
  var TILT_TZ = 22;
  var MAGNET_STRENGTH = 0.3;

  function initPointerInteractions() {
    if (!document.querySelector(TILT_SELECTOR) && !document.querySelector(MAGNET_SELECTOR)) return;

    var activeCard = null;
    var activeMagnet = null;

    var onMove = rafThrottle(function (target, clientX, clientY) {
      var card = target.closest ? target.closest(TILT_SELECTOR) : null;
      if (card !== activeCard) {
        if (activeCard) resetCard(activeCard);
        activeCard = card;
        if (activeCard) activeCard.classList.add('is-tilting');
      }
      if (card) {
        var rect = card.getBoundingClientRect();
        var px = (clientX - rect.left) / rect.width;
        var py = (clientY - rect.top) / rect.height;
        var rx = (px - 0.5) * MAX_TILT_DEG * 2;
        var ry = (0.5 - py) * MAX_TILT_DEG * 2;
        card.style.transform = 'perspective(1200px) rotateX(' + ry.toFixed(2) + 'deg) rotateY(' + rx.toFixed(2) + 'deg) translateZ(' + TILT_TZ + 'px)';
        card.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%');
        card.style.setProperty('--shx3d', (rx * -1.1).toFixed(1) + 'px');
        card.style.setProperty('--shy3d', (10 + ry * -1.1).toFixed(1) + 'px');
        card.style.setProperty('--shb3d', '34px');
        card.style.setProperty('--sho3d', '0.16');

        // PDP gallery only: the ambient glow behind it drifts the opposite
        // way, reading as a background plane receding behind the image.
        if (card.classList.contains('pdp-gallery-main') && card.parentElement) {
          card.parentElement.style.setProperty('--px3d-pdp', ((px - 0.5) * -22).toFixed(1) + 'px');
          card.parentElement.style.setProperty('--py3d-pdp', ((py - 0.5) * -22).toFixed(1) + 'px');
        }
      }

      var magnet = target.closest ? target.closest(MAGNET_SELECTOR) : null;
      if (magnet !== activeMagnet) {
        if (activeMagnet) resetMagnet(activeMagnet);
        activeMagnet = magnet;
      }
      if (magnet) {
        var mrect = magnet.getBoundingClientRect();
        var mx = (clientX - mrect.left - mrect.width / 2) * MAGNET_STRENGTH;
        var my = (clientY - mrect.top - mrect.height / 2) * MAGNET_STRENGTH;
        magnet.style.setProperty('--mx3d', mx.toFixed(1) + 'px');
        magnet.style.setProperty('--my3d', my.toFixed(1) + 'px');
      }
    });

    document.addEventListener('pointermove', function (e) { onMove(e.target, e.clientX, e.clientY); }, { passive: true });

    // Pointer leaving the viewport entirely (e.g. to another app/tab).
    document.documentElement.addEventListener('pointerleave', function () {
      if (activeCard) { resetCard(activeCard); activeCard = null; }
      if (activeMagnet) { resetMagnet(activeMagnet); activeMagnet = null; }
    });

    function resetCard(card) {
      card.classList.remove('is-tilting');
      card.style.transform = '';
      card.style.removeProperty('--glare-x');
      card.style.removeProperty('--glare-y');
      card.style.removeProperty('--shx3d');
      card.style.removeProperty('--shy3d');
      card.style.removeProperty('--shb3d');
      card.style.removeProperty('--sho3d');
      if (card.classList.contains('pdp-gallery-main') && card.parentElement) {
        card.parentElement.style.removeProperty('--px3d-pdp');
        card.parentElement.style.removeProperty('--py3d-pdp');
      }
    }
    function resetMagnet(magnet) {
      magnet.style.removeProperty('--mx3d');
      magnet.style.removeProperty('--my3d');
    }
  }

  // ===========================================================================
  // 5. SCROLL DEPTH — a single, well-scoped scroll-linked drift for the
  //    hero's decorative ring, gated so the listener only runs while the
  //    hero is actually visible.
  // ===========================================================================
  function initScrollDepth() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }

    var onScroll = rafThrottle(function () {
      if (!visible) return;
      var progress = Math.min(1, window.scrollY / (window.innerHeight || 800));
      hero.style.setProperty('--scroll3d', (progress * -50).toFixed(1) + 'px');
    });

    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
