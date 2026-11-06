/* Depth layer: pointer-driven 3D tilt + spotlight, and blur/slide scroll reveal.
   Pairs with css/depth.css. Re-binds after every render of #app. */
(function () {
  const app = document.getElementById('app');
  if (!app) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- tilt ---------- */
  const TILT = [
    ['.social', 5, true],
    ['.project-body img.cover-img', 7, false],
    ['.avatar', 12, false],
  ];
  function bindTilt(el, max, spot) {
    if (el.dataset.tilt !== undefined) return;
    el.dataset.tilt = '';
    if (spot) el.dataset.tiltSpot = '';
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.classList.add('tilting');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- reveal ---------- */
  let io = null;
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-on');
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.dataset.reveal = 'in';
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function bindReveal(el, i) {
    if (!io || el.dataset.reveal) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92) { el.dataset.reveal = 'in'; return; } /* already on screen: never hide it */
    el.dataset.reveal = 'pending';
    if (i) el.style.setProperty('--i', i);
    io.observe(el);
  }

  function bind() {
    if (finePointer && !reduce) {
      TILT.forEach(([sel, max, spot]) => app.querySelectorAll(sel).forEach((el) => bindTilt(el, max, spot)));
    }
    app.querySelectorAll('.chips').forEach((g) => g.querySelectorAll('.chip').forEach((c, i) => bindReveal(c, Math.min(i, 10))));
  }

  /* throttle (not debounce): the typing tagline + clock mutate the DOM constantly */
  let queued = false;
  new MutationObserver(() => {
    if (queued) return; queued = true;
    setTimeout(() => { queued = false; bind(); }, 120);
  }).observe(app, { childList: true, subtree: true });
  bind();
})();
