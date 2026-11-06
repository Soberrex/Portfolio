/* Hero 3D: a slowly rotating dot-globe with an orbit ring, drawn on a 2D canvas.
   Monochrome (follows --fg), reacts to the pointer, pauses off-screen, and
   renders a single still frame for visitors who prefer reduced motion. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  function fgRGB() {
    const v = getComputedStyle(root).getPropertyValue('--fg').trim().replace('#', '');
    const h = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    const n = parseInt(h || 'fafafa', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function sphere(n) {
    const pts = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = ga * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    return pts;
  }
  function ring(n, rad) {
    const pts = [];
    for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2; pts.push([Math.cos(t) * rad, 0, Math.sin(t) * rad]); }
    return pts;
  }

  function mount(cv) {
    if (cv._mounted) return; cv._mounted = true;
    const ctx = cv.getContext('2d');
    const globe = sphere(380), orbit = ring(110, 1.45);
    let w = 0, h = 0, dpr = 1, rgb = fgRGB();
    let spin = 0, tx = 0, ty = 0, cx = 0, cy = 0, visible = true, raf = 0;

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(() => { size(); frame(0); }).observe(cv);
    new MutationObserver(() => { rgb = fgRGB(); frame(0); }).observe(root, { attributes: true, attributeFilter: ['class'] });
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) loop(); }).observe(cv);
    const box = cv.parentElement;
    box.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    box.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    function draw(list, R, ax, ay, dotScale, aBase) {
      const sy = Math.sin(ay), cyy = Math.cos(ay), sx = Math.sin(ax), cxx = Math.cos(ax);
      for (const p of list) {
        let x = p[0] * cyy + p[2] * sy, z = -p[0] * sy + p[2] * cyy, y = p[1];
        const y2 = y * cxx - z * sx; z = y * sx + z * cxx; y = y2;
        const f = 3 / (3 + z), px = w / 2 + x * R * f, py = h / 2 + y * R * f;
        const depth = (z + 1.6) / 3.2;                       /* 0 (far) .. 1 (near) */
        const a = aBase * (0.12 + 0.88 * depth * depth);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(px, py, (0.5 + 1.3 * depth) * dotScale * f, 0, 6.2832); ctx.fill();
      }
    }

    function frame(dt) {
      if (!w) return;
      spin += dt * 0.00018;
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w * 0.3, h * 0.46), ax = 0.38 + cy * 0.35, ay = spin + cx * 0.6;
      draw(globe, R, ax, ay, 1, 0.9);
      draw(orbit, R, ax + 0.5, ay * -1.4, 0.9, 0.75);
    }

    let last = 0;
    function loop(ts) {
      cancelAnimationFrame(raf);
      if (!visible || reduce) return;
      raf = requestAnimationFrame((t) => { frame(Math.min(t - (last || t), 50)); last = t; loop(t); });
    }
    size(); frame(0); loop();
  }

  function scan() { document.querySelectorAll('canvas.hero3d').forEach(mount); }
  const app = document.getElementById('app');
  if (app) new MutationObserver(scan).observe(app, { childList: true, subtree: true });
  scan();
})();
