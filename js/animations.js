/**
 * ATHAR | أثر — Scroll reveal & light motion interactions.
 */
(function () {
  'use strict';

  var revealObserver = null;
  var revealSupported = true;

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initCounters();
    initTilt();
  });

  function getRevealObserver() {
    if (revealObserver || !revealSupported) return revealObserver;
    if (!('IntersectionObserver' in window)) { revealSupported = false; return null; }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
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
    targets.forEach(function (el) { observer.observe(el); });
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
