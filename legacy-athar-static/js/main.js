/**
 * ATHAR | أثر — Core site behavior
 * Header state, mobile navigation, page loader, back-to-top.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initHeaderScroll();
    initMobileNav();
    initBackToTop();
    initCurrentYear();
    initActiveNavLink();
    initFilters();
    initContactForm();
  });

  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var toast = document.querySelector('.toast');
      if (toast) {
        toast.querySelector('span').textContent = 'شكراً لتواصلك معنا، سنرد عليكِ في أقرب وقت';
        toast.classList.add('is-visible');
        setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
      }
      form.reset();
    });
  }

  function initFilters() {
    var pills = document.querySelectorAll('.filter-pill');
    var cards = document.querySelectorAll('[data-product]');
    if (!pills.length || !cards.length) return;

    function applyFilter(pill) {
      pills.forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      var filter = pill.dataset.filter;
      cards.forEach(function (card) {
        var match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    }

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () { applyFilter(pill); });
    });

    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var target = document.querySelector('.filter-pill[data-filter="' + hash + '"]');
      if (target) applyFilter(target);
    }
  }

  function initLoader() {
    var loader = document.querySelector('.loader');
    if (!loader) return;
    window.addEventListener('load', function () {
      setTimeout(function () { loader.classList.add('is-hidden'); }, 250);
    });
    // Fallback in case 'load' already fired
    setTimeout(function () { loader.classList.add('is-hidden'); }, 1800);
  }

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var forceSolid = header.dataset.solid === 'true';
    if (forceSolid) header.classList.add('is-solid');

    function update() {
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else if (!forceSolid) {
        header.classList.remove('is-scrolled');
      }
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    var scrim = document.querySelector('.overlay-scrim');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (scrim) scrim.classList.remove('is-visible');
      document.body.style.overflow = '';
    }
    function open() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (scrim) scrim.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', function () {
      nav.classList.contains('is-open') ? close() : open();
    });
    if (scrim) scrim.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    function update() {
      if (window.scrollY > 500) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initCurrentYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function initActiveNavLink() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-list a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }
})();
