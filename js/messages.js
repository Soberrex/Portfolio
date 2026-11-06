/* Contact chat bubble (anyone can send) + owner Inbox (Google sign-in, owner email only — enforced by database.rules.json). */
import { ref, push, serverTimestamp, onValue, update, remove, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { app, db, OWNER_EMAIL } from './firebase.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (m, ms) => window.Portfolio?.toast(m, ms);
const svg = (p) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">${p}</svg>`;
const IC = {
  chat: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  reply: '<path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

/* ---------- visitor bubble ---------- */
document.body.insertAdjacentHTML('beforeend', `
  <button class="chat-fab" id="chat-fab" aria-label="Send me a message" aria-expanded="false">${svg(IC.chat)}</button>
  <div class="chat-panel" id="chat-panel" role="dialog" aria-label="Send a message" hidden>
    <div class="chat-head">
      <div><strong>Send me a message</strong><span>I usually reply within a day.</span></div>
      <button class="mini" id="chat-close" aria-label="Close">${svg(IC.x)}</button>
    </div>
    <form id="chat-form" novalidate>
      <div class="field"><label for="c-name">Name</label><input id="c-name" maxlength="80" required autocomplete="name"></div>
      <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" maxlength="120" required autocomplete="email"></div>
      <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" maxlength="2000" required placeholder="Hi Subham, …"></textarea></div>
      <input id="c-web" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
      <p class="chat-err" id="chat-err"></p>
      <button class="btn btn-primary" type="submit" id="chat-send">${svg(IC.send)} Send</button>
    </form>
    <div class="chat-done" id="chat-done" hidden>${svg(IC.check)}<strong>Message sent!</strong><span>Thanks — I'll get back to you by email.</span></div>
  </div>`);

const fab = $('#chat-fab'), panel = $('#chat-panel');
const setOpen = (open) => { panel.hidden = !open; fab.setAttribute('aria-expanded', String(open)); if (open) $('#c-name').focus(); };
fab.addEventListener('click', () => setOpen(panel.hidden));
$('#chat-close').addEventListener('click', () => setOpen(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

$('#chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#c-name').value.trim(), email = $('#c-email').value.trim(), message = $('#c-msg').value.trim();
  const err = $('#chat-err'); err.textContent = '';
  if ($('#c-web').value) return; // bot honeypot
  if (!name || !message) return (err.textContent = 'Please fill in your name and message.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (err.textContent = 'Please enter a valid email.');
  let last = 0; try { last = +localStorage.getItem('msg_last') || 0; } catch (x) {}
  if (Date.now() - last < 60_000) return (err.textContent = 'Please wait a minute before sending another message.');
  const btn = $('#chat-send'); btn.setAttribute('aria-disabled', 'true');
  try {
    await push(ref(db, 'messages'), { name, email, message, t: serverTimestamp(), read: false });
    try { localStorage.setItem('msg_last', String(Date.now())); } catch (x) {}
    window.umami?.track('contact-message');
    $('#chat-form').hidden = true; $('#chat-done').hidden = false;
  } catch (x) {
    err.textContent = 'Could not send right now — please email me instead.';
  } finally { btn.removeAttribute('aria-disabled'); }
});

/* ---------- owner inbox ---------- */
const auth = getAuth(app);
let unsub = null;

function inboxShell() {
  if ($('#inbox')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="drawer" id="inbox" hidden><div class="cmd-backdrop" data-iclose></div>
      <div class="drawer-panel" role="dialog" aria-label="Inbox">
        <div class="drawer-head"><span>Inbox</span><span class="badge" id="inbox-count"></span>
          <button class="btn btn-sm btn-ghost" id="inbox-out" style="margin-left:auto" hidden>Sign out</button>
          <button class="mini" data-iclose aria-label="Close">${svg(IC.x)}</button></div>
        <div class="drawer-body" id="inbox-body"></div>
      </div></div>`);
  $('#inbox').addEventListener('click', async (e) => {
    if (e.target.closest('[data-iclose]')) { $('#inbox').hidden = true; return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'read') await update(ref(db, `messages/${id}`), { read: true });
    if (b.dataset.act === 'del' && confirm('Delete this message?')) await remove(ref(db, `messages/${id}`));
    if (b.dataset.act === 'reply') update(ref(db, `messages/${id}`), { read: true });
  });
  $('#inbox-out').addEventListener('click', () => signOut(auth));
}

function renderLogin(msg = '') {
  $('#inbox-out').hidden = true; $('#inbox-count').textContent = '';
  $('#inbox-body').innerHTML = `
    <p style="color:var(--muted);font-size:14px">Sign in with <strong>${esc(OWNER_EMAIL)}</strong> to read messages.</p>
    <button class="btn btn-primary" id="inbox-login" style="justify-self:start">Sign in with Google</button>
    <p class="chat-err">${esc(msg)}</p>`;
  $('#inbox-login').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { renderLogin(e.code === 'auth/unauthorized-domain' ? 'This domain is not authorised in Firebase → Authentication → Settings → Authorised domains.' : e.message); }
  };
}

function listen() {
  unsub?.();
  unsub = onValue(query(ref(db, 'messages'), orderByChild('t'), limitToLast(200)), (snap) => {
    const items = []; snap.forEach((c) => { items.push({ id: c.key, ...c.val() }); });
    items.reverse();
    const unread = items.filter((m) => !m.read).length;
    $('#inbox-count').textContent = unread ? `${unread} new` : `${items.length}`;
    const btn = $('#ab-inbox'); if (btn) btn.textContent = unread ? `Inbox (${unread})` : 'Inbox';
    $('#inbox-body').innerHTML = items.length ? items.map((m) => `
      <div class="card msg${m.read ? '' : ' unread'}">
        <div class="card-head"><strong style="color:var(--fg);font-family:var(--sans)">${esc(m.name)}</strong>
          <span>&lt;${esc(m.email)}&gt;</span><span class="sp"></span><span>${m.t ? new Date(m.t).toLocaleString() : ''}</span></div>
        <p style="white-space:pre-wrap;font-size:14px">${esc(m.message)}</p>
        <div class="inline" style="justify-content:flex-end">
          ${m.read ? '' : `<button class="btn btn-sm btn-ghost" data-act="read" data-id="${esc(m.id)}">${svg(IC.check)} Mark read</button>`}
          <a class="btn btn-sm btn-ghost" data-act="reply" data-id="${esc(m.id)}" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message on my portfolio')}">${svg(IC.reply)} Reply</a>
          <button class="btn btn-sm btn-ghost" data-act="del" data-id="${esc(m.id)}">${svg(IC.trash)} Delete</button>
        </div>
      </div>`).join('') : '<p style="color:var(--muted)">No messages yet.</p>';
  }, () => { signOut(auth); renderLogin(`Only ${OWNER_EMAIL} can read messages.`); });
}

onAuthStateChanged(auth, (user) => {
  if (!$('#inbox')) return;
  if (user && user.email === OWNER_EMAIL) { $('#inbox-out').hidden = false; listen(); }
  else { unsub?.(); unsub = null; if (user) { signOut(auth); renderLogin(`Signed in as ${user.email} — only ${OWNER_EMAIL} can read messages.`); } else renderLogin(); }
});

function openInbox() {
  inboxShell(); $('#inbox').hidden = false;
  const u = auth.currentUser;
  if (u && u.email === OWNER_EMAIL) { $('#inbox-out').hidden = false; listen(); } else renderLogin();
}

/* add "Inbox" to the admin bar whenever edit mode is on */
function addInboxButton() {
  const bar = $('#admin-bar'); if (!bar || $('#ab-inbox')) return;
  bar.querySelector('.who').insertAdjacentHTML('afterend', '<button class="btn btn-sm btn-primary" id="ab-inbox">Inbox</button>');
  $('#ab-inbox').onclick = openInbox;
}
new MutationObserver(addInboxButton).observe(document.body, { childList: true });
addInboxButton();
