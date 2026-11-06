/* Live "N online" counter — each open tab writes presence/<id> = { t: serverTime }; Firebase removes it on disconnect. */
import { ref, push, set, onValue, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { db } from './firebase.js';

const badge = document.createElement('div');
badge.className = 'online';
badge.hidden = true;
badge.innerHTML = '<span class="online-dot"></span><span class="online-n">1</span>&nbsp;online';
document.body.appendChild(badge);

try {
  const list = ref(db, 'presence');
  const me = push(list);

  onValue(ref(db, '.info/connected'), async (snap) => {
    if (snap.val() !== true) return;
    await onDisconnect(me).remove();
    await set(me, { t: serverTimestamp() });
  });

  const STALE = 6 * 60 * 60 * 1000; // ignore entries older than 6h (crashed tabs)
  onValue(list, (snap) => {
    const now = Date.now();
    let n = 0;
    snap.forEach((c) => { if (now - (c.val()?.t || 0) < STALE) n++; });
    badge.querySelector('.online-n').textContent = Math.max(n, 1);
    badge.hidden = false;
  }, () => { badge.hidden = true; });
} catch (e) {
  badge.hidden = true;
}
