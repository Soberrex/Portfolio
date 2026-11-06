/* Portfolio renderer — all content comes from content.json (editable via admin.js). */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const ext = (url) => /^https?:/.test(url || '') ? ' target="_blank" rel="noopener"' : '';
  const initials = (s) => String(s || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  /* ---------- icons ---------- */
  const I = {
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  };
  const icon = (n, cls = 'ic') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${I[n] || ''}</svg>`;
  const BRAND = {
    github: 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3',
    linkedin: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
  };
  /* Brand logos: Simple Icons slug (cdn.simpleicons.org) → drawn in the brand colour; near-black / near-white
     brands flip with the theme (like the reference's light/dark icon pairs). A path/URL also works. */
  const iconCache = new Map();
  function brand(slug, cls = 'si', name = '') {
    if (BRAND[slug]) return `<svg viewBox="0 0 24 24" class="${cls}" fill="currentColor"${slug === 'linkedin' ? ' style="color:#0a66c2"' : ''} aria-hidden="true"><path d="${BRAND[slug]}"/></svg>`;
    if (slug === 'gmail' || slug === 'mail') return icon('mail', 'ic');
    if (/^(https?:|assets\/|\/)/.test(slug || '')) return `<img class="bi-img" src="${esc(slug)}" alt="" loading="lazy">`;
    return `<span class="bi" data-slug="${esc(slug || '')}" data-name="${esc(name)}" aria-hidden="true"></span>`;
  }
  function hydrateIcons(root = document) {
    root.querySelectorAll('.bi:not([data-done])').forEach(async (el) => {
      el.dataset.done = '1';
      const slug = el.dataset.slug;
      const miss = () => { el.classList.add('miss'); el.textContent = (el.dataset.name || '?').trim().charAt(0).toUpperCase(); };
      if (!slug) return miss();
      try {
        if (!iconCache.has(slug)) iconCache.set(slug, fetch(`https://cdn.simpleicons.org/${encodeURIComponent(slug)}`).then((r) => { if (!r.ok) throw 0; return r.text(); }));
        const svg = await iconCache.get(slug);
        const hex = ((/fill="#([0-9a-f]{6})"/i.exec(svg) || [])[1] || '888888');
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        el.style.setProperty('--c', `#${hex}`);
        el.style.setProperty('--m', `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`);
        if (lum < 0.28) el.classList.add('on-dark-flip');
        if (lum > 0.8) el.classList.add('on-light-flip');
        el.classList.add('ready');
      } catch (e) { miss(); }
    });
  }

  /* ---------- pixel monogram ---------- */
  const FONT = {
    A:'01110100011000111111100011000110001',B:'11110100011000111110100011000111110',C:'01111100001000010000100001000001111',
    D:'11110100011000110001100011000111110',E:'11111100001000011110100001000011111',F:'11111100001000011110100001000010000',
    G:'01111100001000010111100011000101111',H:'10001100011000111111100011000110001',I:'11111001000010000100001000010011111',
    J:'00111000100001000010000101001001100',K:'10001100101010011000101001001010001',L:'10000100001000010000100001000011111',
    M:'10001110111010110101100011000110001',N:'10001110011010110011100011000110001',O:'01110100011000110001100011000101110',
    P:'11110100011000111110100001000010000',Q:'01110100011000110001101011001001101',R:'11110100011000111110101001001010001',
    S:'01111100001000001110000010000111110',T:'11111001000010000100001000010000100',U:'10001100011000110001100011000101110',
    V:'10001100011000110001100010101000100',W:'10001100011000110101101011010101010',X:'10001100010101000100010101000110001',
    Y:'10001100010101000100001000010000100',Z:'11111000010001000100010001000011111',
  };
  function pixelWord(word) {
    const letters = String(word || '').toUpperCase().split('').filter((c) => FONT[c]);
    let rects = '';
    letters.forEach((c, li) => {
      const g = FONT[c], ox = li * 6;
      for (let i = 0; i < 35; i++) if (g[i] === '1') rects += `<rect x="${ox + (i % 5)}" y="${Math.floor(i / 5)}" width="1" height="1"/>`;
    });
    const w = Math.max(letters.length * 6 - 1, 1);
    return `<svg viewBox="0 0 ${w} 7" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  /* ---------- helpers ---------- */
  function duration(start, end) {
    const p = (s) => { const m = /(\d{1,2})\.(\d{4})/.exec(s || ''); return m ? new Date(+m[2], +m[1] - 1) : null; };
    const a = p(start), b = p(end) || (/present|now|∞/i.test(end || '') || !end ? new Date() : null);
    if (!a || !b) return '';
    let months = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + 1;
    const y = Math.floor(months / 12), m = months % 12;
    return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ');
  }
  const section = (id, title, body, count) => `
    <section id="${id}" class="line reveal" data-section="${id}">
      <div class="sec-head"><h2 class="sec-title">${esc(title)}${count != null ? `<sup>(${count})</sup>` : ''}</h2>
        <button class="btn btn-sm btn-ghost edit-btn" data-edit="${id}">Edit</button></div>
      <div class="line">${body}</div>
    </section><div class="hatch"></div>`;

  /* ---------- renderers ---------- */
  function hero(d) {
    const p = d.profile;
    const avatar = p.avatar
      ? `<img class="avatar" src="${esc(p.avatar)}" alt="${esc(p.name)}" onerror="this.outerHTML='<div class=&quot;avatar fallback&quot;>${esc(initials(p.name))}</div>'">`
      : `<div class="avatar fallback">${esc(initials(p.name))}</div>`;
    return `
      <div class="cover">${pixelWord(p.monogram || initials(p.name))}</div>
      <div class="hero line" id="top">
        <div class="avatar-wrap">${avatar}</div>
        <div class="hero-text">
          <h1 class="hero-name">${esc(p.name)}${p.verified ? '<svg class="verified" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified"><path d="M22.5 12.5c0-1.6-.9-3-2.2-3.7.2-.4.2-.9.2-1.4 0-2.5-2-4.4-4.4-4.4-.6 0-1.1.1-1.6.3C13.9 2 12.6 1 11 1S8.1 2 7.5 3.3C7 3.1 6.5 3 5.9 3 3.5 3 1.5 5 1.5 7.4c0 .5.1 1 .3 1.4C.4 9.5-.5 10.9-.5 12.5s.9 3 2.3 3.7c-.2.4-.3.9-.3 1.4 0 2.4 2 4.4 4.4 4.4.6 0 1.1-.1 1.6-.3.6 1.3 1.9 2.3 3.5 2.3s2.9-1 3.5-2.3c.5.2 1 .3 1.6.3 2.4 0 4.4-2 4.4-4.4 0-.5-.1-1-.2-1.4 1.3-.7 2.2-2.1 2.2-3.7z" transform="translate(1 0) scale(.92)"/><path d="m8.5 12.5 2.3 2.3 5-5.3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            <button class="btn btn-sm btn-ghost edit-btn" data-edit="profile">Edit</button></h1>
          <p class="hero-tag"><span id="typed"></span><span class="cursor"></span></p>
        </div>
      </div>
      <div class="hatch"></div>
      <section class="line overview" aria-label="Overview">
        <div class="ov full"><span class="ov-ic">${icon('code')}</span><span class="txt">${esc(p.role)}${p.company ? ` @<a href="${esc(p.companyUrl || '#')}"${ext(p.companyUrl)}>${esc(p.company)}</a>` : ''}</span></div>
        <div class="ov"><span class="ov-ic">${icon('pin')}</span><a class="txt" href="${esc(p.mapUrl || '#')}"${ext(p.mapUrl)}>${esc(p.location)}</a></div>
        <div class="ov"><span class="ov-ic">${icon('clock')}</span><span class="txt" id="clock">--:--</span></div>
        <div class="ov"><span class="ov-ic">${icon('mail')}</span><a class="txt" href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>
        ${p.pronouns ? `<div class="ov"><span class="ov-ic">${icon('user')}</span><span class="txt">${esc(p.pronouns)}</span></div>` : ''}
      </section>`;
  }

  function socials(d) {
    const items = (d.socials || []).map((s) => `
      <a class="social" href="${esc(s.url)}"${ext(s.url)} data-umami-event="social-click" data-umami-event-name="${esc(s.label)}">
        <span class="social-logo">${brand(s.icon)}</span>
        <span><span class="social-title">${esc(s.label)}</span><br><span class="social-cta">${esc(s.cta)}</span></span>
        ${icon('arrow', 'ic arrow')}
      </a>`).join('');
    const a = d.actions || {};
    return `
      <section class="line" id="socials" aria-label="Social links">
        <div class="socials">${items}</div>
        <div class="actions">
          <a class="btn btn-primary" href="${esc(a.resume || '#')}" download data-umami-event="resume-download"${a.resume ? '' : 'aria-disabled="true"'}>${icon('download')} Download Resume</a>
          ${a.bookCallUrl
            ? `<a class="btn btn-ghost" href="${esc(a.bookCallUrl)}" target="_blank" rel="noopener">${icon('cal')} Book a call ${icon('arrow')}</a>`
            : `<a class="btn btn-ghost" href="mailto:${esc(d.profile.email)}">${icon('mail')} Get in touch ${icon('arrow')}</a>`}
        </div>
        <div style="padding:0 16px 12px;text-align:right"><button class="btn btn-sm btn-ghost edit-btn" data-edit="socials">Edit links</button></div>
      </section><div class="hatch"></div>`;
  }

  function about(d) {
    const a = d.about || {};
    return section('about', 'About', `<div class="sec-body prose"><p>${md(a.intro)}</p><ul>${(a.bullets || []).map((b) => `<li>${md(b)}</li>`).join('')}</ul></div>`);
  }

  function stack(d) {
    const rows = (d.stack || []).map((g) => `
      <div class="stack-row"><div class="stack-cat">${esc(g.category)}</div><div class="chips">
        ${(g.items || []).map((it) => {
          const inner = `${brand(it.icon, 'si', it.name)}${esc(it.name)}${it.note ? ` <em class="note">${esc(it.note)}</em>` : ''}`;
          return it.url ? `<a class="chip" href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>` : `<span class="chip">${inner}</span>`;
        }).join('')}
      </div></div>`).join('');
    return section('stack', 'Stack', rows);
  }

  function experience(d) {
    const companies = (d.experience || []).map((c, ci) => {
      const logo = c.logo ? `<img class="company-logo" src="${esc(c.logo)}" alt="">` : `<span class="company-logo fallback">${esc(initials(c.company).slice(0, 2))}</span>`;
      const name = c.url ? `<a href="${esc(c.url)}"${ext(c.url)}>${esc(c.company)}</a>` : esc(c.company);
      const roles = (c.roles || []).map((r, ri) => {
        const open = ci === 0 && ri === 0;
        return `<div class="role">
          <button class="role-head" aria-expanded="${open}">
            <span class="role-ic">${icon('code')}</span>
            <span><span class="role-title">${esc(r.title)}</span>
              <span class="role-meta"><span>${esc(r.type)}</span><span class="sep"></span><span>${esc(r.start)}–${esc(r.end || '∞')}</span>${duration(r.start, r.end) ? `<span class="sep"></span><span>${duration(r.start, r.end)}</span>` : ''}</span></span>
            ${icon('chev', 'ic chev')}
          </button>
          <div class="collapsible"><div><div class="role-body">
            ${(r.bullets || []).length ? `<ul>${r.bullets.map((b) => `<li>${md(b)}</li>`).join('')}</ul>` : ''}
            ${(r.links || []).length ? `<div class="links">${r.links.map((l) => `<a href="${esc(l.url)}"${ext(l.url)}>${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
          </div></div></div>
          ${(r.skills || []).length ? `<div class="tags">${r.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
        </div>`;
      }).join('');
      return `<div class="company"><div class="company-head">${logo}${name}${c.current ? '<span class="live" title="Current"></span>' : ''}</div><div class="roles">${roles}</div></div>`;
    }).join('');

    const edu = (d.education || []).map((e) => `
      <div class="list-row"><span class="ov-ic">${icon('cap')}</span><span><span>${esc(e.degree)}, ${esc(e.school)}</span><br><span class="sub">${esc(e.start)}–${esc(e.end)}</span></span></div>`).join('');
    const certs = (d.certifications || []).map((c) => `
      <div class="list-row"><span class="ov-ic">${icon('award')}</span>${c.url ? `<a href="${esc(c.url)}"${ext(c.url)}>${esc(c.name)} ↗</a>` : `<span>${esc(c.name)}</span>`}</div>`).join('');

    return section('experience', 'Experience', companies + `
      <div class="company"><div class="company-head"><span class="company-logo fallback">${icon('cap', 'ic')}</span>Education
        <button class="btn btn-sm btn-ghost edit-btn" data-edit="education">Edit</button></div></div>
      <div style="padding-left:16px">${edu}</div>
      <div class="company"><div class="company-head"><span class="company-logo fallback">${icon('award', 'ic')}</span>Certifications
        <button class="btn btn-sm btn-ghost edit-btn" data-edit="certifications">Edit</button></div></div>
      <div style="padding-left:16px;padding-bottom:12px">${certs}</div>`);
  }

  const SHOW = 3;
  function projects(d) {
    const list = d.projects || [];
    const items = list.map((p, i) => {
      const thumb = p.image ? `<img class="project-thumb" src="${esc(p.image)}" alt="">` : `<span class="project-thumb fallback">${esc(initials(p.name).slice(0, 2))}</span>`;
      return `<div class="project${i >= SHOW ? ' hidden-item' : ''}">
        <div class="project-head">
          ${thumb}
          <span class="project-name">${esc(p.name)}</span>
          ${p.status ? `<span class="badge${/progress|wip|building/i.test(p.status) ? ' wip' : ''}">${esc(p.status)}</span>` : ''}
          <span class="project-actions">
            ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Live demo" data-umami-event="project-demo" data-umami-event-name="${esc(p.name)}">${icon('link')}</a>` : ''}
            ${p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener" aria-label="Source" data-umami-event="project-repo" data-umami-event-name="${esc(p.name)}">${brand('github')}</a>` : ''}
            <button class="mini" aria-expanded="${i === 0}" data-toggle aria-label="Details">${icon('chev', 'ic chev')}</button>
          </span>
        </div>
        <div class="collapsible"><div><div class="project-body">
          ${p.image ? `<img class="cover-img" src="${esc(p.image)}" alt="${esc(p.name)} preview" loading="lazy">` : ''}
          <p style="margin-top:12px">${md(p.description)}</p>
          ${(p.tags || []).length ? `<div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        </div></div></div>
      </div>`;
    }).join('');
    const more = list.length > SHOW ? `<div class="more line"><button class="btn btn-sm btn-ghost" id="show-more">Show More ${icon('chev')}</button></div>` : '';
    return section('projects', 'Projects', items + more, list.length);
  }

  function contributions(d) {
    if (!d.github) return '';
    return `<section class="line heat reveal" id="contributions" aria-label="GitHub contributions">
      <div class="heat-scroll"><div class="heat-months" id="heat-months"></div><div class="heat-grid" id="heat-grid"></div></div>
      <div class="heat-foot"><span id="heat-total">Loading contributions…</span>
        <span class="legend">Less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> More</span></div>
    </section><div class="hatch"></div>`;
  }

  function footer(d) {
    const p = d.profile, f = d.footer || {};
    return `<footer class="line footer">
      <span>Built with care by <a href="https://github.com/${esc(d.github)}" target="_blank" rel="noopener">${esc(p.name.split(' ')[0])}</a>.</span>
      ${f.credit ? `<span>${f.creditUrl ? `<a href="${esc(f.creditUrl)}" target="_blank" rel="noopener">${esc(f.credit)}</a>` : esc(f.credit)}.</span>` : ''}
      <span>© ${new Date().getFullYear()} ${esc(p.name)}. All rights reserved.</span>
    </footer>
    <div class="footer-mark">${pixelWord(p.monogram || initials(p.name))}</div>`;
  }

  /* ---------- behaviours ---------- */
  let clockTimer, typeTimer;
  function startClock(tz) {
    clearInterval(clockTimer);
    const el = $('#clock'); if (!el) return;
    const tick = () => {
      const now = new Date();
      let t;
      try { t = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }); } catch (e) { t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
      let rel = '';
      try {
        const there = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const here = new Date(now.toLocaleString('en-US'));
        const diff = Math.round((there - here) / 36e5 * 2) / 2;
        rel = diff === 0 ? 'same time' : `${Math.abs(diff)}h ${diff > 0 ? 'ahead' : 'behind'}`;
      } catch (e) {}
      el.innerHTML = `${t} <span class="dim">· ${rel}</span>`;
    };
    tick(); clockTimer = setInterval(tick, 15000);
  }

  function startTyping(text) {
    clearTimeout(typeTimer);
    const el = $('#typed'); if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
    let i = 0;
    const step = () => { el.textContent = text.slice(0, ++i); if (i < text.length) typeTimer = setTimeout(step, 28); };
    step();
  }

  async function loadHeatmap(user) {
    const grid = $('#heat-grid'); if (!grid) return;
    try {
      const r = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`);
      if (!r.ok) throw 0;
      const j = await r.json();
      const days = j.contributions || [];
      const pad = days.length ? new Date(days[0].date).getDay() : 0;
      grid.innerHTML = '<i style="visibility:hidden"></i>'.repeat(pad) +
        days.map((x) => `<i class="l${x.level}" title="${x.count} contribution${x.count === 1 ? '' : 's'} on ${x.date}"></i>`).join('');
      const months = $('#heat-months'); const cols = Math.ceil((pad + days.length) / 7);
      let last = -1, out = '';
      for (let c = 0; c < cols; c++) {
        const idx = c * 7 - pad; const day = days[Math.max(0, idx)];
        const m = day ? new Date(day.date).getMonth() : -1;
        out += `<span>${m !== last && c < cols - 2 ? new Date(2000, m).toLocaleString('en', { month: 'short' }) : ''}</span>`;
        last = m;
      }
      months.innerHTML = out;
      const total = j.total ? Object.values(j.total).reduce((a, b) => a + b, 0) : days.reduce((a, b) => a + b.count, 0);
      $('#heat-total').innerHTML = `${total.toLocaleString()} contributions in the past year on <a href="https://github.com/${esc(user)}" target="_blank" rel="noopener">GitHub</a>.`;
      $('.heat-scroll').scrollLeft = 9999;
    } catch (e) {
      $('#heat-total').innerHTML = `See my activity on <a href="https://github.com/${esc(user)}" target="_blank" rel="noopener">GitHub</a>.`;
      grid.innerHTML = '<i></i>'.repeat(371);
    }
  }

  function bindInteractions() {
    document.querySelectorAll('.role-head, [data-toggle]').forEach((b) => b.addEventListener('click', () => {
      const exp = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!exp));
      const col = b.classList.contains('role-head') ? b.nextElementSibling : b.closest('.project').querySelector('.collapsible');
      col.style.gridTemplateRows = exp ? '0fr' : '1fr';
    }));
    document.querySelectorAll('.role-head[aria-expanded="true"]').forEach((b) => (b.nextElementSibling.style.gridTemplateRows = '1fr'));
    document.querySelectorAll('[data-toggle][aria-expanded="true"]').forEach((b) => (b.closest('.project').querySelector('.collapsible').style.gridTemplateRows = '1fr'));
    const sm = $('#show-more');
    if (sm) sm.addEventListener('click', () => {
      const hidden = document.querySelectorAll('.project.hidden-item');
      if (hidden.length) { hidden.forEach((p) => p.classList.replace('hidden-item', 'shown-item')); sm.innerHTML = `Show Less <svg viewBox="0 0 24 24" class="ic" style="transform:rotate(180deg)">${I.chev}</svg>`; }
      else { document.querySelectorAll('.project.shown-item').forEach((p) => p.classList.replace('shown-item', 'hidden-item')); sm.innerHTML = `Show More ${icon('chev')}`; }
    });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -60px' }) : null;
    document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  }

  /* ---------- command palette ---------- */
  function commands() {
    const d = state.data; if (!d) return [];
    const go = (id) => () => document.getElementById(id)?.scrollIntoView();
    const open = (u) => () => window.open(u, /^mailto:/.test(u) ? '_self' : '_blank', 'noopener');
    return [
      { g: 'Navigate', label: 'Home', ic: 'hash', run: () => scrollTo(0, 0) },
      ...['about', 'stack', 'experience', 'projects'].map((id) => ({ g: 'Navigate', label: id[0].toUpperCase() + id.slice(1), ic: 'hash', run: go(id) })),
      ...(d.projects || []).filter((p) => p.url || p.repo).map((p) => ({ g: 'Projects', label: p.name, ic: 'link', run: open(p.url || p.repo) })),
      ...(d.socials || []).map((s) => ({ g: 'Links', label: s.label, ic: 'arrow', run: open(s.url) })),
      { g: 'Actions', label: 'Copy email', ic: 'copy', run: () => { navigator.clipboard?.writeText(d.profile.email); toast('Email copied'); } },
      { g: 'Actions', label: 'Download resume', ic: 'download', run: () => d.actions?.resume && open(d.actions.resume)() },
      { g: 'Actions', label: 'Toggle theme', ic: 'sun', run: toggleTheme },
    ];
  }
  let cmdIdx = 0, cmdItems = [];
  function renderCmd(q) {
    const list = $('#cmd-list'); q = q.trim().toLowerCase();
    cmdItems = commands().filter((c) => !q || c.label.toLowerCase().includes(q) || c.g.toLowerCase().includes(q));
    cmdIdx = Math.min(cmdIdx, Math.max(cmdItems.length - 1, 0));
    let g = '', html = '';
    cmdItems.forEach((c, i) => {
      if (c.g !== g) { g = c.g; html += `<li class="grp">${esc(g)}</li>`; }
      html += `<li><button data-i="${i}" class="${i === cmdIdx ? 'active' : ''}">${icon(c.ic)}${esc(c.label)}</button></li>`;
    });
    list.innerHTML = html || '<li class="grp">No results.</li>';
  }
  function openCmd() { const c = $('#cmd'); c.hidden = false; cmdIdx = 0; const inp = $('#cmd-input'); inp.value = ''; renderCmd(''); inp.focus(); }
  function closeCmd() { $('#cmd').hidden = true; }
  function runCmd(i) { const c = cmdItems[i]; closeCmd(); c && c.run(); }

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    document.querySelector('meta[name="theme-color"]').content = dark ? '#09090b' : '#ffffff';
  }

  let toastT;
  function toast(msg, ms = 2200) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), ms);
  }

  /* ---------- analytics (Umami, cookieless) ---------- */
  const UMAMI_ID = '8d8adfb0-f5a0-40af-a2ef-ae6aa350526f';
  const UMAMI_DOMAINS = 'soberrex.github.io';
  function loadUmami() {
    if (document.getElementById('umami')) return;
    const s = document.createElement('script');
    s.id = 'umami'; s.defer = true; s.src = 'https://cloud.umami.is/script.js';
    s.dataset.websiteId = UMAMI_ID; s.dataset.domains = UMAMI_DOMAINS;
    document.head.appendChild(s);
  }
  /* Umami is cookieless and stores no personal data, so no consent banner is needed. */
  function setupConsent() { loadUmami(); }

  /* ---------- main ---------- */
  const state = { data: null };
  function render(data) {
    state.data = data;
    const app = $('#app');
    app.innerHTML = hero(data) + socials(data) + about(data) + stack(data) + experience(data) + projects(data) + contributions(data) + footer(data);
    app.removeAttribute('aria-busy');
    $('#brand').innerHTML = pixelWord(data.profile.monogram || initials(data.profile.name));
    const gh = $('#gh-link'); gh.href = `https://github.com/${data.github}`; gh.innerHTML = brand('github');
    document.title = `${data.profile.name} – ${data.profile.role}`;
    startClock(data.profile.timezone);
    startTyping(data.profile.tagline || '');
    bindInteractions();
    hydrateIcons();
    loadHeatmap(data.github);
    document.dispatchEvent(new CustomEvent('portfolio:rendered'));
  }

  async function load() {
    try {
      const r = await fetch(`content.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      render(await r.json());
    } catch (e) {
      $('#app').innerHTML = `<p class="loading">Couldn't load content.json. If you opened this file directly, serve the folder instead (e.g. <code>npx serve</code> or VS Code Live Server).</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#theme-toggle').addEventListener('click', toggleTheme);
    $('#open-cmd').addEventListener('click', openCmd);
    $('#cmd').addEventListener('click', (e) => { if (e.target.dataset.close != null) closeCmd(); const b = e.target.closest('[data-i]'); if (b) runCmd(+b.dataset.i); });
    $('#cmd-input').addEventListener('input', (e) => { cmdIdx = 0; renderCmd(e.target.value); });
    $('#cmd-input').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { cmdIdx = Math.min(cmdIdx + 1, cmdItems.length - 1); renderCmd(e.target.value); e.preventDefault(); }
      if (e.key === 'ArrowUp') { cmdIdx = Math.max(cmdIdx - 1, 0); renderCmd(e.target.value); e.preventDefault(); }
      if (e.key === 'Enter') runCmd(cmdIdx);
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#cmd').hidden ? openCmd() : closeCmd(); }
      if (e.key === 'Escape' && !$('#cmd').hidden) closeCmd();
    });
    load();
    setupConsent();
  });

  window.Portfolio = { render, get data() { return state.data; }, toast, icon, esc };
})();
