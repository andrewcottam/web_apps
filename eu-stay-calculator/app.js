import { firebaseConfig } from './firebase-config.js';
import { presenceSet, usedInWindow, maxStayFrom, overstayDays, toDay, toIso, todayIso, LIMIT, WINDOW } from './calc.js';

const $ = id => document.getElementById(id);
const LOCAL = Object.values(firebaseConfig).some(v => String(v).startsWith('YOUR_'));
const LS_KEY = 'eu-stay-calculator:stays';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

let stays = [];           // [{start,end}] ISO inclusive
let save = async () => {};
let viewStart;            // first-of-month Date (UTC) of the leftmost month
let sel = { from: '', to: '' };

const todayStr = todayIso();
$('arrive').value = todayStr;
{ const t = new Date(todayStr + 'T00:00:00Z'); viewStart = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 2, 1)); }

// ---------- rendering ----------
function render() {
  stays.sort((a, b) => a.start.localeCompare(b.start));
  const set = presenceSet(stays);
  const bad = overstayDays(set);
  const arrive = $('arrive').value || todayStr;
  const plan = maxStayFrom(set, arrive);
  const planFirst = toDay(plan.first), planLast = plan.days ? toDay(plan.lastDay) : -1;
  const limitDay = plan.days ? planLast : planFirst - 1;
  const today = toDay(todayStr);

  // stats
  const used = usedInWindow(set, toDay(arrive) - 1);
  const stat = (v, l) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  $('stats').innerHTML =
    stat(used, `days used in the ${WINDOW} days before ${arrive}`) +
    stat(Math.max(0, LIMIT - used), 'days left at that point') +
    stat(plan.days, `more days we can stay from ${plan.first}`) +
    stat(plan.days ? plan.lastDay : '—', 'last permitted day');
  $('banner').innerHTML = (LOCAL ? '<div class="banner">Local mode: no Firebase config set, so there is no login and data is saved in this browser only. See the README.</div>' : '') +
    (bad.size ? `<div class="banner err">The recorded stays exceed ${LIMIT} days in a ${WINDOW}-day window (${bad.size} day${bad.size > 1 ? 's' : ''} in red).</div>` : '');

  // calendar
  const frag = [];
  for (let m = 0; m < 6; m++) {
    const first = new Date(Date.UTC(viewStart.getUTCFullYear(), viewStart.getUTCMonth() + m, 1));
    const y = first.getUTCFullYear(), mo = first.getUTCMonth();
    const name = first.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const lead = (first.getUTCDay() + 6) % 7; // Monday first
    const dim = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    let h = `<div class="month"><h3>${name}</h3><div class="grid">` + 'MTWTFSS'.split('').map(c => `<div class="dow">${c}</div>`).join('') + '<div></div>'.repeat(lead);
    for (let dd = 1; dd <= dim; dd++) {
      const iso = `${y}-${String(mo + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
      const d = toDay(iso);
      const cls = ['day'];
      if (set.has(d)) cls.push(bad.has(d) ? 'bad' : 'present');
      else if (d >= planFirst && d <= planLast) cls.push('ok');
      if (d === planLast && !set.has(d) && plan.days) cls.push('limit');
      if (d === today) cls.push('today');
      if (iso === sel.from || iso === sel.to || (sel.from && sel.to && iso > sel.from && iso < sel.to)) cls.push('sel');
      const u = usedInWindow(set, d);
      h += `<div class="${cls.join(' ')}" data-d="${iso}" title="${iso}: ${u}/${LIMIT} days used in the last ${WINDOW}">${dd}</div>`;
    }
    frag.push(h + '</div></div>');
  }
  $('months').innerHTML = frag.join('');
  const last = new Date(Date.UTC(viewStart.getUTCFullYear(), viewStart.getUTCMonth() + 5, 1));
  const fm = d => d.toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  $('range').textContent = `${fm(viewStart)} – ${fm(last)}`;

  // list
  $('stays').innerHTML = stays.length ? stays.map((s, i) => {
    const n = toDay(s.end) - toDay(s.start) + 1;
    return `<li><span>${s.start} → ${s.end} <span class="muted">(${n} day${n > 1 ? 's' : ''})</span></span><button data-del="${i}">Remove</button></li>`;
  }).join('') : '<li class="muted">No stays recorded yet.</li>';
  $('from').value = sel.from; $('to').value = sel.to;
}

// ---------- interactions ----------
$('months').addEventListener('click', e => {
  const iso = e.target.dataset?.d; if (!iso) return;
  if (!sel.from || sel.to) sel = { from: iso, to: '' };
  else if (iso < sel.from) sel = { from: iso, to: sel.from };
  else sel.to = iso;
  render();
});
$('from').onchange = () => { sel.from = $('from').value; render(); };
$('to').onchange = () => { sel.to = $('to').value; render(); };
$('clear').onclick = () => { sel = { from: '', to: '' }; render(); };
$('add').onclick = async () => {
  const start = sel.from, end = sel.to || sel.from;
  if (!start) return alert('Pick a start date first.');
  if (end < start) return alert('The end date is before the start date.');
  stays.push({ start, end }); sel = { from: '', to: '' };
  render(); await save();
};
$('stays').addEventListener('click', async e => {
  const i = e.target.dataset?.del; if (i === undefined) return;
  stays.splice(+i, 1); render(); await save();
});
$('arrive').onchange = render;
$('arriveToday').onclick = () => { $('arrive').value = todayStr; render(); };
$('prev').onclick = () => { viewStart = new Date(Date.UTC(viewStart.getUTCFullYear(), viewStart.getUTCMonth() - 3, 1)); render(); };
$('next').onclick = () => { viewStart = new Date(Date.UTC(viewStart.getUTCFullYear(), viewStart.getUTCMonth() + 3, 1)); render(); };

// ---------- storage + auth ----------
function showApp() { $('login').classList.add('hidden'); $('app').classList.remove('hidden'); render(); }

if (LOCAL) {
  try { stays = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { stays = []; }
  save = async () => localStorage.setItem(LS_KEY, JSON.stringify(stays));
  $('who').textContent = 'local mode';
  showApp();
} else {
  const [{ initializeApp }, { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut }, { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
    import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app), db = getFirestore(app);
  const ref = doc(db, 'eu-stays', 'shared');
  $('signin').onclick = async () => {
    $('loginerr').textContent = '';
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { $('loginerr').textContent = e.message; }
  };
  $('signout').onclick = () => signOut(auth);
  onAuthStateChanged(auth, async user => {
    if (!user) {
      $('app').classList.add('hidden'); $('login').classList.remove('hidden'); $('signout').classList.add('hidden'); return;
    }
    try {
      const snap = await getDoc(ref);
      stays = snap.exists() ? (snap.data().stays || []) : [];
    } catch (e) {
      $('loginerr').textContent = 'Signed in as ' + user.email + ' but access was denied. Is this email in firestore.rules?';
      await signOut(auth); return;
    }
    save = async () => {
      try { await setDoc(ref, { stays, updatedBy: user.email, updatedAt: new Date().toISOString() }); }
      catch (e) { alert('Could not save: ' + e.message); }
    };
    $('who').textContent = user.email; $('signout').classList.remove('hidden');
    showApp();
  });
}
