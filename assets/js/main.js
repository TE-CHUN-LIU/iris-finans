/* =========================================================
   陳乙嘉 Iris Chen｜Dashboard Interactivity
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Live Clock (Taipei time) ---------- */
  const liveTimeEl = document.getElementById('liveTime');
  function tickClock() {
    if (!liveTimeEl) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    liveTimeEl.textContent = `${hh}:${mm}:${ss}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- Service Status (週一~週六 09–18) ---------- */
  const statusDot = document.querySelector('.status-dot');
  const statusTop = document.getElementById('statusTop');
  const statusBot = document.getElementById('statusBot');
  function updateStatus() {
    if (!statusDot) return;
    const d = new Date();
    const day = d.getDay();        // 0=Sun, 6=Sat
    const hour = d.getHours();
    const isWorkday = day >= 1 && day <= 6;
    const isWorkhour = hour >= 9 && hour < 18;
    const online = isWorkday && isWorkhour;
    if (online) {
      statusDot.classList.remove('is-offline');
      statusTop.textContent = '服務中';
      statusBot.textContent = '即時回覆';
    } else {
      statusDot.classList.add('is-offline');
      statusTop.textContent = '非服務時段';
      statusBot.textContent = '24 小時內回覆';
    }
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Mobile Menu Toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('sidebar');
  if (navToggle && sidebar) {
    navToggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });
    // Close on link click (mobile)
    sidebar.querySelectorAll('.side-link, .sidebar__cta').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 768) sidebar.classList.remove('is-open');
      });
    });
  }

  /* ---------- Animated Counters ---------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.floor(eased * target);
      el.textContent = current + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- IntersectionObserver: Counters + Reveal ---------- */
  const counterEls = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counterEls.forEach(el => counterObserver.observe(el));

  /* ---------- Active Sidebar Nav on Scroll ---------- */
  const sections = ['top', 'about', 'credentials', 'services', 'knowledge', 'testimonials', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const sideLinks = document.querySelectorAll('.side-link');

  function setActive(id) {
    sideLinks.forEach(a => {
      a.classList.toggle('is-active', a.dataset.target === id);
    });
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    // Find the entry with the largest intersection ratio that is intersecting
    let best = null;
    entries.forEach(entry => {
      if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
        best = entry;
      }
    });
    if (best) setActive(best.target.id);
  }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-20% 0px -40% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  /* ---------- Service Filter ---------- */
  const serviceFilters = document.querySelectorAll('[data-filter]');
  const services = document.querySelectorAll('#servicesGrid .service');
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

  /* ---------- Knowledge Filter ---------- */
  const kFilters = document.querySelectorAll('[data-kfilter]');
  const articles = document.querySelectorAll('#articlesGrid .article');
  kFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.kfilter;
      kFilters.forEach(b => b.classList.toggle('is-active', b === btn));
      articles.forEach(a => {
        const match = filter === 'all' || a.dataset.kcat === filter;
        a.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ---------- Cred Bar Animation on view ---------- */
  const credEls = document.querySelectorAll('.cred');
  const credObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateX(-12px)';
        setTimeout(() => {
          entry.target.style.transition = 'opacity .6s ease, transform .6s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }, i * 60);
        credObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  credEls.forEach(el => credObserver.observe(el));

})();
