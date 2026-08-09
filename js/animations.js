/**
 * ATHAR | أثر — Scroll reveal & light motion interactions.
 */
(function () {
  'use strict';

  var revealObserver = null;
  var revealSupported = true;
  // Maps a [data-reveal-group] child -> its group element, for oversized
  // groups observed per-child (see observeReveal). Elements observed
  // directly (the common case) never appear in this map.
  var groupProxyMap = new WeakMap();
  // A [data-reveal-group] taller than this many viewport-heights would need
  // most of itself scrolled past before a 15%-of-whole-box threshold could
  // ever fire — e.g. a large product grid. Past this size, observe its
  // children individually instead so it reveals as soon as the first
  // visible row does, rather than needing the entire group nearly scrolled
  // through. Small groups (four feature cards, six categories, etc.) never
  // approach this and keep the original single-target behavior untouched.
  var LARGE_GROUP_VIEWPORTS = 2;

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initCounters();
    initTilt();
  });

  function revealGroup(group) {
    if (group.classList.contains('in-view')) return;
    group.classList.add('in-view');
  }

  function getRevealObserver() {
    if (revealObserver || !revealSupported) return revealObserver;
    if (!('IntersectionObserver' in window)) { revealSupported = false; return null; }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = groupProxyMap.get(entry.target);
        if (group) revealGroup(group);
        else entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    return revealObserver;
  }

  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (!targets.length) return;
    observeReveal(targets);
  }

  /**
   * Register [data-reveal]/[data-reveal-group] elements with the shared
   * scroll-reveal IntersectionObserver. The initial DOMContentLoaded scan
   * only sees markup present at load time, so any content injected later
   * (e.g. product details rendered after an async Supabase fetch) must be
   * registered explicitly via this function or it stays at opacity:0
   * forever. Accepts a single element, a NodeList/array, or a container
   * (whose matching descendants + itself are picked up).
   */
  function observeReveal(elOrList) {
    var targets = [];
    if (elOrList && elOrList.nodeType === 1) {
      if (elOrList.hasAttribute('data-reveal') || elOrList.hasAttribute('data-reveal-group')) targets.push(elOrList);
      targets = targets.concat(Array.prototype.slice.call(elOrList.querySelectorAll('[data-reveal], [data-reveal-group]')));
    } else if (elOrList) {
      targets = Array.prototype.slice.call(elOrList);
    }
    if (!targets.length) return;

    var observer = getRevealObserver();
    if (!observer) {
      targets.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    targets.forEach(function (el) {
      if (el.hasAttribute('data-reveal-group') && el.children.length &&
          el.offsetHeight > window.innerHeight * LARGE_GROUP_VIEWPORTS) {
        observer.unobserve(el); // in case it was already registered directly while still empty
        Array.prototype.forEach.call(el.children, function (child) {
          groupProxyMap.set(child, el);
          observer.observe(child);
        });
      } else {
        observer.observe(el);
      }
    });
  }

  window.AtharObserveReveal = observeReveal;

  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { observer.observe(el); });

    function animateCount(el) {
      var target = parseFloat(el.dataset.counter);
      var suffix = el.dataset.suffix || '';
      var duration = 1400;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = target * eased;
        el.textContent = (target % 1 === 0 ? Math.round(value) : value.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  }

  function initTilt() {
    var cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length || window.matchMedia('(pointer: coarse)').matches) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (y * -6) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }
})();
