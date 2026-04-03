// =============================================
// MAIN.JS — Nikunj-style interactions
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initScrollProgress();
  initSmoothScroll();
  initProjectFilter();
  initHamburger();
  initActiveNavLink();
});

// ── Navbar blur on scroll ─────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const handler = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', handler, { passive: true });
}

// ── Active nav link on scroll ─────────────────
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
}

// ── Hamburger ─────────────────────────────────
function initHamburger() {
  const btn = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.nav-links');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    const [s1, , s3] = btn.querySelectorAll('span');
    if (open) {
      s1.style.transform = 'translateY(7px) rotate(45deg)';
      btn.querySelectorAll('span')[1].style.opacity = '0';
      s3.style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
}

// ── Scroll Reveal ─────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

// ── Scroll Progress bar ───────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
}

// ── Smooth scroll ─────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ── Project filter ────────────────────────────
function initProjectFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || (card.dataset.category || '').includes(filter);
        card.setAttribute('data-hidden', !match);
        card.style.display = match ? '' : 'none';
      });
    });
  });
}
