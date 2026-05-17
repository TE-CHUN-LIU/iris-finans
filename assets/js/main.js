/* =========================================================
   陳乙嘉 Iris Chen｜Editorial interactions
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Live clock ---------- */
  const liveTimeEl = document.getElementById('liveTime');
  function tickClock() {
    if (!liveTimeEl) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    liveTimeEl.textContent = `${hh}:${mm}`;
  }
  tickClock();
  setInterval(tickClock, 30 * 1000);

  /* ---------- Service status indicator ---------- */
  const statusDot = document.getElementById('statusDot');
  const statusTop = document.getElementById('statusTop');
  const statusBot = document.getElementById('statusBot');
  function updateStatus() {
    if (!statusDot) return;
    const d = new Date();
    const day = d.getDay();
    const hour = d.getHours();
    const online = day >= 1 && day <= 6 && hour >= 9 && hour < 18;
    statusDot.classList.toggle('is-offline', !online);
    statusTop.textContent = online ? '服務中' : '非服務時段';
    statusBot.textContent = online ? '即時回覆' : '24 小時內回覆';
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('sidebar');
  if (navToggle && sidebar) {
    navToggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    sidebar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 720) sidebar.classList.remove('is-open');
      });
    });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = Math.floor(eased * target);
      el.textContent = v + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  /* ---------- Sidebar active link on scroll ---------- */
  const sections = ['top', 'about', 'credentials', 'services', 'knowledge', 'testimonials', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const sideLinks = document.querySelectorAll('.side-link');

  function setActive(id) {
    sideLinks.forEach(a => a.classList.toggle('is-active', a.dataset.target === id));
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    let best = null;
    entries.forEach(entry => {
      if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
        best = entry;
      }
    });
    if (best) setActive(best.target.id);
  }, { threshold: [0.2, 0.4, 0.6], rootMargin: '-20% 0px -40% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  /* ---------- Service filter ---------- */
  const serviceFilters = document.querySelectorAll('[data-filter]');
  const services = document.querySelectorAll('#servicesGrid .svc');
  serviceFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      serviceFilters.forEach(b => b.classList.toggle('is-active', b === btn));
      services.forEach(s => {
        const match = filter === 'all' || s.dataset.cat === filter;
        s.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ---------- Knowledge filter ---------- */
  const kFilters = document.querySelectorAll('[data-kfilter]');
  const stories = document.querySelectorAll('#articlesGrid [data-kcat]');
  kFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.kfilter;
      kFilters.forEach(b => b.classList.toggle('is-active', b === btn));
      stories.forEach(s => {
        const match = filter === 'all' || s.dataset.kcat === filter;
        s.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(
    '.hero__text, .hero__figure, .hero__stats, .section__head, ' +
    '.about__figure, .about__body, .pillar, ' +
    '.cert, .domain, ' +
    '.svc, .premium, ' +
    '.story--featured, .story-list__item, ' +
    '.hero-quote, .side-quote, ' +
    '.cc, .signature'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.revealDelay || (i * 40), 10);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));

  /* ---------- Subtle parallax on hero photo ---------- */
  const heroPhoto = document.querySelector('.hero__photo img');
  if (heroPhoto && window.matchMedia('(min-width: 960px)').matches) {
    let raf;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.5) {
          heroPhoto.style.transform = `translateY(${y * 0.08}px) scale(1.04)`;
        }
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- Smooth offset scroll for anchors (account for sticky bits) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
