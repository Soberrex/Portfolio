/* Owner-only editor.
 * Open with  yoursite/#admin  (or Ctrl+Shift+E). Paste a GitHub fine-grained token that has
 * "Contents: Read and write" on this repo only. The token stays in *your* browser (localStorage).
 * Saving commits content.json (and uploaded images) to the repo; GitHub Pages redeploys in ~1 min.
 * Visitors without a token can't write anything — GitHub rejects the request. */
(function () {
  'use strict';
  const P = () => window.Portfolio;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => P().esc(s);
  const ic = (n) => P().icon(n);
  const TOKEN_KEY = 'portfolio_gh_token';
  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } };
  const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} };

  Object.assign(window.Portfolio || {}, {});
  const EXTRA_IC = {
    up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', upload: '<path d="M12 15V3m0 0-4 4m4-4 4 4M4 21h16"/>',
  };
  const svg = (n) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">${EXTRA_IC[n]}</svg>`;

  /* Which content keys each "Edit" button edits */
  const GROUPS = {
    profile: { title: 'Profile', keys: ['profile', 'github'] },
    socials: { title: 'Social links & actions', keys: ['socials', 'actions'] },
    about: { title: 'About', keys: ['about'] },
    stack: { title: 'Stack', keys: ['stack'] },
    experience: { title: 'Experience', keys: ['experience'] },
    education: { title: 'Education', keys: ['education'] },
    certifications: { title: 'Certifications', keys: ['certifications'] },
    projects: { title: 'Projects', keys: ['projects'] },
    footer: { title: 'Footer', keys: ['footer'] },
  };
  /* Blank item templates for "Add" buttons, keyed by array name */
  const TEMPLATES = {
    socials: { label: '', icon: '', cta: '', url: '' },
    stack: { category: 'New category', items: [] },
    items: { name: '', icon: '', url: '' },
    experience: { company: '', url: '', logo: '', current: true, roles: [] },
    roles: { title: '', type: 'Full-time', start: 'MM.YYYY', end: '', bullets: [], skills: [], links: [] },
    links: { label: 'Certificate', url: '' },
    education: { degree: '', school: '', start: '', end: '' },
    certifications: { name: '', url: '' },
    projects: { name: 'New project', status: '', image: '', url: '', repo: '', description: '', tags: [] },
  };
  const STRING_LISTS = new Set(['bullets', 'skills', 'tags']);
  const FILE_KEYS = new Set(['avatar', 'image', 'logo', 'resume']);
  const LONG_KEYS = new Set(['description', 'intro']);
  const HINTS = {
    icon: 'Simple Icons slug, e.g. python, fastapi, docker (simpleicons.org). "github" / "linkedin" / "mail" are built in.',
    start: 'MM.YYYY', end: 'MM.YYYY — leave empty for "present"',
    bullets: 'One per line. Wrap words in **double asterisks** for bold.',
    skills: 'One per line', tags: 'One per line',
    status: 'e.g. "In progress" — leave empty when done',
    timezone: 'IANA zone, e.g. Asia/Kolkata', monogram: 'Letters for the pixel logo (A–Z)',
    bookCallUrl: 'Calendly/Cal.com link — empty shows "Get in touch"',
    companyUrl: 'Link for the company name (e.g. #experience)',
  };
  const label = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

  /* ---------- GitHub API ---------- */
  function repoInfo() { const r = P().data.repo || {}; return { owner: r.owner, name: r.name, branch: r.branch || 'main' }; }
  async function gh(path, opts = {}) {
    const r = await fetch(`https://api.github.com${path}`, {
      ...opts,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${getToken()}`, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
    });
    if (!r.ok) { let m = r.statusText; try { m = (await r.json()).message; } catch (e) {} throw new Error(`${r.status}: ${m}`); }
    return r.status === 204 ? null : r.json();
  }
  const b64utf8 = (s) => btoa(unescape(encodeURIComponent(s)));
  const fileToB64 = (f) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(f); });

  async function putFile(path, base64, message) {
    const { owner, name, branch } = repoInfo();
    let sha;
    try { sha = (await gh(`/repos/${owner}/${name}/contents/${path}?ref=${branch}`)).sha; } catch (e) { if (!/^404/.test(e.message)) throw e; }
    return gh(`/repos/${owner}/${name}/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content: base64, branch, ...(sha ? { sha } : {}) }) });
  }
  async function verifyToken(token) {
    const { owner, name } = repoInfo();
    const r = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('Token cannot access this repository.');
    const j = await r.json();
    if (!j.permissions || !j.permissions.push) throw new Error('Token does not have write access to this repository.');
    return j;
  }

  /* local previews for freshly uploaded files (Pages takes ~1 min to deploy them) */
  const previews = new Map();
  document.addEventListener('portfolio:rendered', () => {
    document.querySelectorAll('img').forEach((img) => { const p = img.getAttribute('src'); if (previews.has(p)) img.src = previews.get(p); });
    if (getToken()) enterEditMode();
  });

  /* ---------- UI ---------- */
  function ensureShell() {
    if ($('#drawer')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="drawer" id="drawer" hidden><div class="cmd-backdrop" data-dclose></div>
        <div class="drawer-panel" role="dialog" aria-modal="true">
          <div class="drawer-head"><span id="drawer-title"></span><button class="mini" style="margin-left:auto" data-dclose aria-label="Close">${svg('x')}</button></div>
          <div class="drawer-body" id="drawer-body"></div>
          <div class="drawer-foot" id="drawer-foot"></div>
        </div></div>`);
    $('#drawer').addEventListener('click', (e) => { if (e.target.closest('[data-dclose]')) closeDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });
  }
  function openDrawer(title, body, foot) { ensureShell(); $('#drawer-title').textContent = title; $('#drawer-body').innerHTML = body; $('#drawer-foot').innerHTML = foot; $('#drawer').hidden = false; }
  function closeDrawer() { $('#drawer').hidden = true; }

  function showLogin() {
    openDrawer('Owner sign-in', `
      <p style="font-size:14px;color:var(--muted)">Paste a GitHub <strong>fine-grained personal access token</strong> limited to the
      <code>${esc(repoInfo().owner)}/${esc(repoInfo().name)}</code> repo with <strong>Contents: Read and write</strong>.
      It is stored only in this browser. <a style="text-decoration:underline" target="_blank" rel="noopener"
      href="https://github.com/settings/personal-access-tokens/new">Create one ↗</a></p>
      <div class="field"><label for="tok">Token</label><input id="tok" type="password" placeholder="github_pat_…" autocomplete="off"></div>
      <p id="tok-err" style="color:#ef4444;font-size:13px"></p>`,
      `<button class="btn btn-ghost" data-dclose>Cancel</button><button class="btn btn-primary" id="tok-go">Unlock editing</button>`);
    $('#tok').focus();
    const go = async () => {
      const t = $('#tok').value.trim(); if (!t) return;
      $('#tok-go').setAttribute('aria-disabled', 'true');
      try { await verifyToken(t); setToken(t); closeDrawer(); enterEditMode(); P().toast('Editing unlocked'); }
      catch (e) { $('#tok-err').textContent = e.message; $('#tok-go').removeAttribute('aria-disabled'); }
    };
    $('#tok-go').addEventListener('click', go);
    $('#tok').addEventListener('keydown', (e) => e.key === 'Enter' && go());
  }

  function enterEditMode() {
    document.body.classList.add('editing');
    try { localStorage.setItem('umami.disabled', '1'); } catch (e) {} /* don't count the owner's own visits */
    if ($('#admin-bar')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="admin-bar" id="admin-bar"><span class="who">✎ edit mode</span>
        <button class="btn btn-sm btn-ghost" id="ab-footer">Footer</button>
        <button class="btn btn-sm btn-ghost" id="ab-json">JSON</button>
        <button class="btn btn-sm btn-ghost" id="ab-view">Preview</button>
        <button class="btn btn-sm btn-ghost" id="ab-out">Sign out</button></div>`);
    $('#ab-footer').onclick = () => editGroup('footer');
    $('#ab-json').onclick = editRaw;
    $('#ab-view').onclick = () => { const on = document.body.classList.toggle('editing'); $('#ab-view').textContent = on ? 'Preview' : 'Edit'; };
    $('#ab-out').onclick = () => { setToken(null); document.body.classList.remove('editing'); $('#admin-bar').remove(); P().toast('Signed out'); };
  }

  /* ---------- generic form ---------- */
  let draft = null, curGroup = null;
  const getAt = (obj, path) => path.reduce((o, k) => o?.[k], obj);
  const setAt = (obj, path, v) => { const last = path[path.length - 1]; getAt(obj, path.slice(0, -1))[last] = v; };

  function fieldHTML(key, value, path) {
    const p = esc(JSON.stringify(path));
    const hint = HINTS[key] ? `<span class="hint">${esc(HINTS[key])}</span>` : '';
    if (typeof value === 'boolean') return `<label class="check"><input type="checkbox" data-path="${p}" ${value ? 'checked' : ''}> ${esc(label(key))}</label>`;
    if (Array.isArray(value) && (STRING_LISTS.has(key) || value.every((v) => typeof v === 'string') && value.length)) {
      return `<div class="field"><label>${esc(label(key))}</label><textarea data-path="${p}" data-list>${esc(value.join('\n'))}</textarea>${hint}</div>`;
    }
    if (Array.isArray(value)) {
      const cards = value.map((item, i) => `
        <div class="card"><div class="card-head">${esc(label(key))} #${i + 1} <span class="sp"></span>
          <button class="mini" data-act="up" data-path="${p}" data-i="${i}" title="Move up">${svg('up')}</button>
          <button class="mini" data-act="down" data-path="${p}" data-i="${i}" title="Move down">${svg('down')}</button>
          <button class="mini" data-act="del" data-path="${p}" data-i="${i}" title="Delete">${svg('trash')}</button></div>
          ${typeof item === 'object' ? objectHTML(item, path.concat(i)) : fieldHTML(String(i), item, path.concat(i))}
        </div>`).join('');
      return `<div class="field"><label>${esc(label(key))}</label><div style="display:grid;gap:10px">${cards}</div>
        <button class="btn btn-sm btn-ghost" style="justify-self:start" data-act="add" data-path="${p}" data-key="${esc(key)}">${svg('plus')} Add ${esc(label(key).replace(/s$/, '').toLowerCase())}</button></div>`;
    }
    if (value && typeof value === 'object') return `<fieldset class="card"><div class="card-head">${esc(label(key))}</div>${objectHTML(value, path)}</fieldset>`;
    const v = esc(value ?? '');
    if (FILE_KEYS.has(key)) {
      const isImg = key !== 'resume';
      return `<div class="field"><label>${esc(label(key))}</label><div class="inline">
        ${isImg && value ? `<img class="thumb-prev" src="${esc(previews.get(value) || value)}" alt="">` : ''}
        <input data-path="${p}" value="${v}" placeholder="URL or upload">
        <label class="btn btn-sm btn-ghost" style="cursor:pointer">${svg('upload')} Upload<input type="file" hidden data-upload="${p}" accept="${isImg ? 'image/*' : '.pdf,application/pdf'}"></label></div></div>`;
    }
    if (LONG_KEYS.has(key) || String(value ?? '').length > 90) return `<div class="field"><label>${esc(label(key))}</label><textarea data-path="${p}">${v}</textarea>${hint}</div>`;
    return `<div class="field"><label>${esc(label(key))}</label><input data-path="${p}" value="${v}">${hint}</div>`;
  }
  function objectHTML(obj, path) { return Object.keys(obj).map((k) => fieldHTML(k, obj[k], path.concat(k))).join(''); }

  function renderForm() {
    const body = $('#drawer-body');
    const top = body.scrollTop;
    body.innerHTML = GROUPS[curGroup].keys.map((k) => fieldHTML(k, draft[k], [k])).join('');
    body.scrollTop = top;
  }

  function editGroup(group) {
    curGroup = group;
    const data = P().data;
    draft = {};
    GROUPS[group].keys.forEach((k) => (draft[k] = structuredClone(data[k] ?? (k === 'footer' ? {} : ''))));
    openDrawer(`Edit · ${GROUPS[group].title}`, '', `<button class="btn btn-ghost" data-dclose>Cancel</button><button class="btn btn-primary" id="save">Save & publish</button>`);
    renderForm();
    const body = $('#drawer-body');
    body.oninput = body.onchange = (e) => {
      const t = e.target; if (!t.dataset.path || t.dataset.upload) return;
      const path = JSON.parse(t.dataset.path);
      setAt(draft, path, t.type === 'checkbox' ? t.checked : t.hasAttribute('data-list') ? t.value.split('\n').map((s) => s.trim()).filter(Boolean) : t.value);
    };
    body.onclick = (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const path = JSON.parse(b.dataset.path); const arr = getAt(draft, path); const i = +b.dataset.i;
      if (b.dataset.act === 'add') arr.push(structuredClone(TEMPLATES[b.dataset.key] ?? (typeof arr[0] === 'object' ? Object.fromEntries(Object.keys(arr[0]).map((k) => [k, ''])) : '')));
      if (b.dataset.act === 'del' && confirm('Delete this item?')) arr.splice(i, 1);
      if (b.dataset.act === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      if (b.dataset.act === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      renderForm();
    };
    body.addEventListener('change', async (e) => {
      const inp = e.target; if (!inp.dataset.upload || !inp.files[0]) return;
      const f = inp.files[0];
      if (f.size > 5 * 1024 * 1024) return P().toast('File is over 5 MB — please compress it first.', 3500);
      const path = JSON.parse(inp.dataset.upload);
      const safe = f.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-');
      const dest = path[path.length - 1] === 'resume' ? 'assets/resume.pdf' : `assets/uploads/${Date.now()}-${safe}`;
      P().toast('Uploading…', 10000);
      try {
        await putFile(dest, await fileToB64(f), `Upload ${dest} via portfolio editor`);
        previews.set(dest, URL.createObjectURL(f));
        setAt(draft, path, dest); renderForm(); P().toast('Uploaded — remember to Save');
      } catch (err) { P().toast(`Upload failed: ${err.message}`, 4000); }
    });
    $('#save').onclick = () => save(draft);
  }

  async function save(partial) {
    const next = { ...structuredClone(P().data), ...structuredClone(partial) };
    const btn = $('#save'); btn && btn.setAttribute('aria-disabled', 'true');
    try {
      await putFile('content.json', b64utf8(JSON.stringify(next, null, 2) + '\n'), `Update ${GROUPS[curGroup]?.title || 'content'} via portfolio editor`);
      P().render(next); closeDrawer(); P().toast('Published — live site updates in about a minute', 3500);
    } catch (e) {
      P().toast(`Save failed: ${e.message}`, 5000); btn && btn.removeAttribute('aria-disabled');
      if (/^401|^403/.test(e.message)) { setToken(null); showLogin(); }
    }
  }

  function editRaw() {
    curGroup = null;
    openDrawer('Edit · Raw JSON', `<div class="field"><label>content.json</label><textarea id="raw" style="min-height:70vh;font-family:var(--mono);font-size:12.5px">${esc(JSON.stringify(P().data, null, 2))}</textarea></div><p id="raw-err" style="color:#ef4444;font-size:13px"></p>`,
      `<button class="btn btn-ghost" data-dclose>Cancel</button><button class="btn btn-primary" id="save">Save & publish</button>`);
    $('#save').onclick = () => { try { save(JSON.parse($('#raw').value)); } catch (e) { $('#raw-err').textContent = `Invalid JSON: ${e.message}`; } };
  }

  /* ---------- entry points ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]');
    if (b && document.body.classList.contains('editing')) { e.preventDefault(); e.stopPropagation(); editGroup(b.dataset.edit); }
  }, true);
  function maybeOpen() {
    if (location.hash === '#admin') {
      history.replaceState(null, '', location.pathname + location.search);
      getToken() ? enterEditMode() : showLogin();
    }
  }
  window.addEventListener('hashchange', maybeOpen);
  document.addEventListener('portfolio:rendered', maybeOpen, { once: true });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); getToken() ? enterEditMode() : showLogin(); }
  });
})();
