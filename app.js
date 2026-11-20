/* « Piège ou pas ? » : 5 jeux de sensibilisation au phishing, en FR / EN / AR. */
{
const D = window.PDATA;
const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app'), view = $('#view'), sheet = $('#sheet'), bar = $('#bar'), tabs = $('#tabs');
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const store = {
  get(k){ try { return localStorage.getItem(k) } catch(e){ return null } },
  set(k, v){ try { localStorage.setItem(k, v) } catch(e){} },
  del(k){ try { localStorage.removeItem(k) } catch(e){} }
};
let lang = D.UI[store.get('piege-lang')] ? store.get('piege-lang') : 'fr';
let sound = store.get('piege-sound') !== '0';
let voice = true, pname = '', homeTab = 'games';
const GAMES = ['salma', 'appel', 'liens', 'indices', 'quiz'];

/* ---------- helpers ---------- */
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b };
const mmss = s => { s = Math.max(0, s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') };
const tt = (k, v = {}) => { let s = D.UI[lang][k]; if (s == null) s = D.UI.fr[k]; if (s == null) return k; if (typeof s !== 'string') return s; for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s };
const L = o => o ? (o[lang] || o.fr) : '';
/* isole liens, adresses et numéros pour qu'ils restent lisibles en arabe */
const bd = h => h.replace(/(\+?\d[\d \-]{5,}\d)|([A-Za-z0-9][A-Za-z0-9@._\-\/:?=+%]*\.[A-Za-z]{2,}[A-Za-z0-9@._\-\/:?=+%]*)/g, m => { const t = m.match(/[.:?]+$/), c = t ? m.slice(0, -t[0].length) : m; return '<bdi dir="ltr">' + c + '</bdi>' + (t ? t[0] : '') });
const fmt = t => bd(esc(t)).replace(/\[\[(.+?)\]\]/g, '<a>$1</a>');
const player = () => pname.trim() || tt('player');
const TO = []; const later = (f, ms) => { const id = setTimeout(f, ms); TO.push(id); return id };
let timer = null; const stopTimer = () => { if (timer) { clearInterval(timer); timer = null } };
const buzz = p => { try { const ua = navigator.userActivation; if (ua && !ua.hasBeenActive) return; if (!('ontouchstart' in window)) return; navigator.vibrate && navigator.vibrate(p || 40) } catch(e){} };

/* ---------- icons ---------- */
const st = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const sv = (p, s = 22, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${p}</svg>`;
const IC = {
  x: sv(`<path ${st} d="M6 6l12 12M18 6L6 18"/>`),
  chev: sv(`<path ${st} d="M15 5l-7 7 7 7"/>`, 24, 'flip'),
  chevR: sv(`<path ${st} d="M9 5l7 7-7 7"/>`, 20, 'flip'),
  check: sv(`<path ${st} d="M5 12.5l4.5 4.5L19 7.5"/>`),
  warn: sv(`<path ${st} d="M12 3.5L2.5 20h19z"/><path ${st} d="M12 10v4.5M12 17.3v.2"/>`, 24),
  vol: sv(`<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path ${st} d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>`),
  mute: sv(`<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path ${st} d="M17 9.5l5 5M22 9.5l-5 5"/>`),
  grid: sv(`<rect ${st} x="4" y="4" width="7" height="7" rx="2"/><rect ${st} x="13" y="4" width="7" height="7" rx="2"/><rect ${st} x="4" y="13" width="7" height="7" rx="2"/><rect ${st} x="13" y="13" width="7" height="7" rx="2"/>`, 24),
  shield: sv(`<path ${st} d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path ${st} d="M8.5 12l2.5 2.5 4.5-5"/>`, 24),
  trophy: sv(`<path ${st} d="M7 4h10v5a5 5 0 0 1-10 0z"/><path ${st} d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>`, 24),
  star: sv(`<path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>`, 14),
  clock: sv(`<circle ${st} cx="12" cy="12" r="8.5"/><path ${st} d="M12 7.5V12l3 2"/>`, 15),
  redo: sv(`<path ${st} d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>`, 20),
  link: sv(`<path ${st} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`, 14),
  fwd: sv(`<path ${st} d="M13 6l6 6-6 6M5 6l6 6-6 6"/>`, 13),
  phone: sv(`<path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>`, 30),
  hang: sv(`<path fill="currentColor" d="M12 9c-1.6 0-3.1.3-4.5.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.7 1.9-.4.4-1 .4-1.4 0L.3 13.1c-.4-.4-.4-1 0-1.4C3.3 8.8 7.4 7 12 7s8.7 1.8 11.7 4.7c.4.4.4 1 0 1.4l-2.5 2.5c-.4.4-1 .4-1.4 0-.8-.7-1.7-1.4-2.7-1.9-.4-.2-.6-.5-.6-.9V9.7C15.1 9.3 13.6 9 12 9z"/>`, 30),
  hangS: sv(`<path fill="currentColor" d="M12 9c-1.6 0-3.1.3-4.5.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.7 1.9-.4.4-1 .4-1.4 0L.3 13.1c-.4-.4-.4-1 0-1.4C3.3 8.8 7.4 7 12 7s8.7 1.8 11.7 4.7c.4.4.4 1 0 1.4l-2.5 2.5c-.4.4-1 .4-1.4 0-.8-.7-1.7-1.4-2.7-1.9-.4-.2-.6-.5-.6-.9V9.7C15.1 9.3 13.6 9 12 9z"/>`, 20),
  user: sv(`<circle fill="currentColor" cx="12" cy="8.5" r="4"/><path fill="currentColor" d="M4 20c.8-4 4-6 8-6s7.2 2 8 6z"/>`, 22),
  group: sv(`<circle fill="currentColor" cx="9" cy="8.5" r="3.5"/><circle fill="currentColor" cx="16.5" cy="9.5" r="3"/><path fill="currentColor" d="M2.5 19c.6-3.4 3.2-5 6.5-5s5.9 1.6 6.5 5zM14.5 14.3c3 .1 5.4 1.6 6 4.7h-4.4c-.2-1.9-.8-3.5-1.6-4.7z"/>`, 22),
  dots: sv(`<circle fill="currentColor" cx="12" cy="5.5" r="1.8"/><circle fill="currentColor" cx="12" cy="12" r="1.8"/><circle fill="currentColor" cx="12" cy="18.5" r="1.8"/>`, 20),
  archive: sv(`<path ${st} d="M4 8h16v11H4zM3 4h18v4H3zM10 12h4"/>`, 20),
  trash: sv(`<path ${st} d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>`, 20),
  mail: sv(`<rect ${st} x="3.5" y="5.5" width="17" height="13" rx="2"/><path ${st} d="M4 7l8 6 8-6"/>`, 20),
  reply: sv(`<path ${st} d="M9 7L4 12l5 5M4 12h10a6 6 0 0 1 6 6"/>`, 18, 'flip'),
  fwdm: sv(`<path ${st} d="M15 7l5 5-5 5M20 12H10a6 6 0 0 0-6 6"/>`, 18, 'flip'),
  starO: sv(`<path ${st} d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>`, 20),
  video: sv(`<rect ${st} x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path ${st} d="M15.5 10.5l5-3v9l-5-3"/>`, 22),
  call: sv(`<path ${st} d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>`, 20),
  plus: sv(`<path ${st} d="M12 5v14M5 12h14"/>`, 22),
  mic: sv(`<rect ${st} x="9" y="3.5" width="6" height="11" rx="3"/><path ${st} d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>`, 20),
  up: sv(`<path ${st} d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/>`, 20),
  heart: sv(`<path ${st} d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>`, 24),
  bubble: sv(`<path ${st} d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z"/>`, 24),
  send: sv(`<path ${st} d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>`, 24),
  save: sv(`<path ${st} d="M6 3.5h12v17l-6-4-6 4z"/>`, 24),
  info: sv(`<circle ${st} cx="12" cy="12" r="9"/><path ${st} d="M12 11v5.5M12 7.8v.2"/>`, 22),
  arL: sv(`<path ${st} d="M19 12H5M11 6l-6 6 6 6"/>`, 16),
  arR: sv(`<path ${st} d="M5 12h14M13 6l6 6-6 6"/>`, 16),
  lock: sv(`<rect fill="currentColor" x="5" y="10.5" width="14" height="10" rx="2.5"/><path ${st} d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`, 16)
};
const APPI = {
  sms: ['#30b04a', '<path fill="#fff" d="M12 4.5c-4.7 0-8.5 3-8.5 6.8 0 2.2 1.3 4.1 3.3 5.4L6 20l3.9-2.2c.7.1 1.4.2 2.1.2 4.7 0 8.5-3 8.5-6.7S16.7 4.5 12 4.5z"/>'],
  mail: ['#1d6fe8', '<rect x="3.5" y="6" width="17" height="12" rx="2" fill="#fff"/><path d="M4 7.5l8 5.5 8-5.5" fill="none" stroke="#1d6fe8" stroke-width="1.8"/>'],
  wa: ['#1fae5b', '<path fill="#fff" d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z"/>'],
  ig: ['#d62f6c', '<path fill="#fff" d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>'],
  msg: ['#7b4ff0', '<path fill="#fff" d="M12 3.5c-4.9 0-8.5 3.5-8.5 8 0 2.5 1.1 4.6 3 6v3l2.9-1.6c.8.2 1.7.3 2.6.3 4.9 0 8.5-3.4 8.5-7.7s-3.6-8-8.5-8z"/>'],
  tel: ['#30b04a', '<path fill="#fff" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>'],
  cam: ['#59606b', '<rect x="3" y="7" width="18" height="12.5" rx="3" fill="#fff"/><circle cx="12" cy="13.3" r="3.4" fill="#59606b"/><rect x="8.5" y="4.5" width="7" height="3.2" rx="1" fill="#fff"/>']
};
const appIco = k => { const a = APPI[k] || APPI.sms; return `<span class="ai" style="background:${a[0]}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">${a[1]}</svg></span>` };
const LOGO = `<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#fff"/><path d="M29 10v16.5a8.5 8.5 0 1 1-17 0V23" fill="none" stroke="#e5372b" stroke-width="4.5" stroke-linecap="round"/><path d="M12 23l-4 4.6M12 23l4.4 3.6" stroke="#e5372b" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="8.5" r="3.8" fill="#141414"/></svg>`;
const TICON = {
  salma: `<svg class="ti" viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="4" width="24" height="40" rx="6" fill="#fff"/><rect x="15.5" y="10" width="17" height="5" rx="2" fill="#1d4ed8" opacity=".35"/><rect x="15.5" y="17.5" width="17" height="5" rx="2" fill="#1d4ed8" opacity=".6"/><rect x="15.5" y="25" width="17" height="5" rx="2" fill="#1d4ed8" opacity=".85"/><circle cx="36" cy="9" r="7.5" fill="#e5372b" stroke="#fff" stroke-width="2"/><text x="36" y="12.5" font-size="10" font-weight="800" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif">8</text></svg>`,
  appel: `<svg class="ti" viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="27" r="16" fill="#22c55e"/><g transform="translate(9.5 16.5) scale(.88)"><path fill="#fff" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></g><path d="M33 7a13 13 0 0 1 8 9M32 13a6.5 6.5 0 0 1 3.5 4.5" fill="none" stroke="#ffd400" stroke-width="3.2" stroke-linecap="round"/></svg>`,
  liens: `<svg class="ti" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#141414" stroke-width="4.2" stroke-linecap="round"><path d="M20 28a7 7 0 0 0 10 0l6-6a7 7 0 0 0-10-10l-2 2"/><path d="M28 20a7 7 0 0 0-10 0l-6 6a7 7 0 0 0 10 10l2-2"/></g><circle cx="38" cy="38" r="8.5" fill="#e5372b"/><path d="M35 35l6 6M41 35l-6 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  indices: `<svg class="ti" viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="13" fill="#ffd400" stroke="#141414" stroke-width="4"/><path d="M31 31l11 11" stroke="#141414" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="21" r="4.5" fill="#e5372b"/></svg>`,
  quiz: `<svg class="ti" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 7h32a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H22l-9 8v-8H8a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z" fill="#fff"/><text x="24" y="28" font-size="21" font-weight="800" text-anchor="middle" fill="#e5372b" font-family="Space Grotesk,sans-serif">?</text></svg>`
};
const GIFT = (id, h) => `<svg viewBox="0 0 300 ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a00"/><stop offset="1" stop-color="#e5372b"/></linearGradient></defs><rect width="300" height="${h}" fill="url(#${id})"/><circle cx="150" cy="${h / 2}" r="${h * .42}" fill="#fff" opacity=".13"/><g transform="translate(0 ${(h - 280) / 2})"><rect x="114" y="38" width="72" height="140" rx="15" fill="#141414"/><rect x="120" y="47" width="60" height="122" rx="10" fill="#2b5cff"/><circle cx="150" cy="96" r="17" fill="#ffd400"/><rect x="80" y="168" width="140" height="84" rx="10" fill="#ffd400"/><rect x="74" y="160" width="152" height="24" rx="8" fill="#ffe36b"/><rect x="142" y="160" width="16" height="92" fill="#e5372b"/><path d="M150 160c-22-28-52-14-36 0zM150 160c22-28 52-14 36 0z" fill="#e5372b"/><path d="M52 64l5 12 12 5-12 5-5 12-5-12-12-5 12-5zM246 112l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#fff"/><text x="236" y="70" font-size="42" font-weight="800" fill="#fff" font-family="Space Grotesk,sans-serif">10</text></g></svg>`;
function qrModules(x, y, size, n, seed) {
  const c = size / n; let s = seed, o = '';
  const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
  const fnd = (i, j) => (i < 3 && j < 3) || (i < 3 && j >= n - 3) || (i >= n - 3 && j < 3);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!fnd(i, j) && rnd() > .5) o += `<rect x="${(x + j * c).toFixed(1)}" y="${(y + i * c).toFixed(1)}" width="${c.toFixed(1)}" height="${c.toFixed(1)}"/>`;
  const F = (fx, fy) => `<rect x="${fx}" y="${fy}" width="${3 * c}" height="${3 * c}" fill="#111"/><rect x="${fx + c * .55}" y="${fy + c * .55}" width="${c * 1.9}" height="${c * 1.9}" fill="#fff"/><rect x="${fx + c}" y="${fy + c}" width="${c}" height="${c}" fill="#111"/>`;
  return `<g fill="#111">${o}</g>${F(x, y)}${F(x + (n - 3) * c, y)}${F(x, y + (n - 3) * c)}`;
}
const METER = `<svg class="meter" viewBox="0 0 300 380" aria-hidden="true"><rect x="136" y="214" width="28" height="166" fill="#4a4f57"/><rect x="128" y="206" width="44" height="16" rx="4" fill="#3b3f46"/><rect x="78" y="34" width="144" height="182" rx="24" fill="#5d6470"/><rect x="90" y="46" width="120" height="158" rx="16" fill="#8a919c"/><rect x="102" y="58" width="96" height="38" rx="6" fill="#0f3b3a"/><text x="112" y="83" font-size="17" font-weight="700" fill="#5ef0b0" font-family="ui-monospace,monospace">P 2,00/h</text><rect x="102" y="104" width="96" height="88" rx="8" fill="#1d4ed8"/><g transform="rotate(-6 150 150)"><rect x="110" y="110" width="80" height="80" rx="5" fill="#fff"/>${qrModules(116, 116, 68, 11, 9)}</g><path d="M98 104v-10h12M190 94h12v10M202 192v10h-12M110 202H98v-10" fill="none" stroke="#ffd400" stroke-width="4" stroke-linecap="round"/><rect x="100" y="106" width="100" height="3" fill="#ffd400" opacity=".9"><animate attributeName="y" values="106;196;106" dur="2.4s" repeatCount="indefinite"/></rect></svg>`;
const ENVELOPE = `<div class="envl" aria-hidden="true"><div class="env-back"></div><div class="env-letter">!</div><div class="env-front"></div><div class="env-flap"></div></div>`;

/* ---------- sound (Web Audio, généré, aucun fichier) ---------- */
let AC = null;
function ac() { try { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; AC = C ? new C() : null } if (AC && AC.state === 'suspended') AC.resume() } catch(e){} return AC }
function tone(f, d, type, v, delay) {
  if (!sound) return; const a = ac(); if (!a) return;
  try {
    const t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v || .07, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .03);
  } catch(e){}
}
const sfx = {
  ok: () => { tone(660, .14); tone(990, .24, 'sine', .07, .09) },
  ko: () => { tone(196, .28, 'square', .035); tone(147, .3, 'square', .03, .08) },
  ping: () => { tone(1318, .12, 'sine', .05); tone(1760, .16, 'sine', .04, .07) },
  tap: () => tone(880, .05, 'sine', .03),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .28, 'triangle', .06, i * .12))
};
let ringT = null;
function ringStart() { ringStop(); const p = () => { [0, .22, .44, .66].forEach((d, i) => tone(i % 2 ? 988 : 784, .18, 'sine', .07, d)); buzz([380, 160, 380]) }; p(); ringT = setInterval(p, 2300) }
function ringStop() { if (ringT) { clearInterval(ringT); ringT = null } buzz(0) }
document.addEventListener('pointerdown', () => { if (sound) ac() }, { passive: true });

/* ---------- speech ---------- */
const VL = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-SA' };
const voices = () => { try { return speechSynthesis.getVoices() || [] } catch(e){ return [] } };
const hasVoice = () => { const v = voices(); return !v.length || v.some(x => x.lang && x.lang.toLowerCase().startsWith(lang)) };
const talk = on => { const c = $('#view .call'); if (c) c.classList.toggle('talk', on) };
function shush() { try { window.speechSynthesis && speechSynthesis.cancel() } catch(e){} talk(false) }
function say(t) {
  shush();
  const n = t.split(/\s+/).length, fake = () => { talk(true); later(() => talk(false), Math.max(1400, n * 320)) };
  if (!voice || !window.speechSynthesis) return fake();
  try {
    const u = new SpeechSynthesisUtterance(t), vs = voices(), v = vs.find(x => x.lang && x.lang.toLowerCase().startsWith(lang));
    u.lang = VL[lang]; u.rate = lang === 'ar' ? .95 : 1.03;
    if (v) u.voice = v; else if (vs.length) return fake();
    let started = false;
    u.onstart = () => { started = true; talk(true) }; u.onend = u.onerror = () => talk(false);
    speechSynthesis.speak(u);
    later(() => { if (!started) fake() }, 900);
  } catch(e){ fake() }
}

/* ---------- chrome ---------- */
const chip = (id, html, cls) => `<span class="chip ${cls || ''}" id="${id}">${html}</span>`;
const starChip = id => chip(id, IC.star + '<span class="v">0</span>');
const setChipT = (id, txt) => { const e = document.querySelector('#' + id + ' .v'); if (e) e.textContent = txt };
function setBar(title, chips) {
  bar.hidden = false; tabs.hidden = true;
  bar.innerHTML = `<button class="ib" id="quit" aria-label="${esc(tt('quit'))}">${IC.x}</button><div class="bt">${esc(title)}</div><div class="chips">${chips || ''}</div>`;
  $('#quit').onclick = () => go('home');
}
function setView(html, anim) { view.className = anim || ''; view.innerHTML = html; view.scrollTop = 0 }
function setSheet(html) {
  if (html == null) { sheet.hidden = true; sheet.innerHTML = ''; return }
  sheet.hidden = false; sheet.innerHTML = html; sheet.scrollTop = 0;
  sheet.classList.remove('in'); void sheet.offsetWidth; sheet.classList.add('in');
}
function addPts(G, id, n) {
  G.score = Math.max(0, G.score + n); setChipT(id, G.score);
  const e = document.getElementById(id); if (!e) return;
  e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump');
  if (!RM) { const s = document.createElement('span'); s.className = 'plus' + (n < 0 ? ' neg' : ''); s.textContent = (n > 0 ? '+' : '−') + Math.abs(n); e.appendChild(s); setTimeout(() => s.remove(), 950) }
}
const fbHTML = (ok, title, body) => `<div class="fb ${ok ? '' : 'no'}"><span class="ic">${ok ? IC.check : IC.x}</span><div><b class="ft">${title}</b>${body || ''}</div></div>`;
function confetti() {
  if (RM) return; const cols = ['#e5372b', '#ffd400', '#1d4ed8', '#22c55e', '#ffffff'];
  for (let i = 0; i < 44; i++) {
    const c = document.createElement('i'); c.className = 'cf';
    c.style.left = (Math.random() * 100) + '%'; c.style.background = cols[i % 5];
    c.style.setProperty('--dx', (Math.random() * 140 - 70) + 'px'); c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
    c.style.animationDelay = (Math.random() * .35) + 's'; c.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    app.appendChild(c); setTimeout(() => c.remove(), 3600);
  }
}
function countUp(el, to) {
  if (!el) return; if (RM || !to) { el.textContent = to; return }
  const t0 = performance.now(), d = 900;
  const f = t => { const k = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f) };
  requestAnimationFrame(f);
}
const medal = r => { const c = r >= .8 ? ['#ffd400', '#d9a300'] : r >= .5 ? ['#e3e7ee', '#a9b1bd'] : ['#f2b47c', '#c9793a']; return `<svg class="medal" viewBox="0 0 120 120" aria-hidden="true"><path d="M36 4h20l10 36H46z" fill="#1d4ed8"/><path d="M84 4H64L54 40h20z" fill="#e5372b"/><circle cx="60" cy="74" r="38" fill="${c[1]}"/><circle cx="60" cy="74" r="31" fill="${c[0]}"/><path d="M60 53l6.3 12.8 14.1 2-10.2 10 2.4 14L60 85.2l-12.6 6.6 2.4-14-10.2-10 14.1-2z" fill="#fff" opacity=".92"/></svg>` };

/* ---------- scores (sur cet appareil) ---------- */
const KEY = 'piege-ou-pas-scores';
const load = () => { try { return JSON.parse(store.get(KEY)) || [] } catch(e){ return [] } };
const save = (g, s, m) => { const l = load(); l.push({ n: player(), g, s, m }); store.set(KEY, JSON.stringify(l.slice(-400))) };
function results(g, score, max, msg, extra, again, next, againLabel) {
  save(g, score, max); const r = max ? score / max : 0;
  setView(`<div class="res fill">${medal(r)}<p class="small">${esc(tt('scoreOf', { n: player() }))}</p><div class="big"><span id="cnt">0</span><span class="mx">/${max}</span></div><p class="res-msg">${msg}</p>${extra || ''}</div>`, 'in');
  countUp($('#cnt'), score);
  setSheet(`<div class="btns"><button class="btn pri" id="ag">${IC.redo}<span>${againLabel || tt('again')}</span></button><button class="btn" id="ng">${next ? tt('next') : tt('nextPlayer')}</button></div>`);
  $('#ag').onclick = again; $('#ng').onclick = () => go(next || 'home');
  if (r >= .8) later(() => { confetti(); sfx.win() }, 380);
}

/* ---------- fake app screens ---------- */
const COLS = ['#5b6b8c', '#c2185b', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#455a64'];
const avColor = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997; return COLS[h % COLS.length] };
const avOf = (name, group) => group ? IC.group : /^\+?\d/.test(name) ? IC.user : esc([...name][0].toUpperCase());
const backBtn = () => `<button class="mk-back" id="mkb">${IC.chev}<span>${esc(tt('back'))}</span></button>`;
const banner = html => `<div class="mk-banner">${appIco('sms')}<div><b>${tt('bannerApp')}</b><div>${html}</div></div></div>`;
function mkSMS(o) {
  return `<div class="mk sms fill"><div class="mk-h c">${o.back || `<span class="mk-ic">${IC.chev}</span>`}<div class="mk-av">${o.av}</div><div class="mk-id"><div class="mk-n">${o.name}</div><div class="mk-s">${o.sub}</div></div><span class="mk-ic end">${IC.info}</span></div>
  <div class="mk-body">${o.banner || ''}<div class="mk-day">${tt('today')} ${o.time}</div><div class="bub"><div class="tx">${o.body}</div></div></div>
  <div class="mk-in"><span class="mk-ic">${IC.plus}</span><span class="mk-field">${tt('msgPh')}</span><span class="mk-ic go">${IC.up}</span></div></div>`;
}
function mkMail(o) {
  return `<div class="mk mail fill"><div class="ml-tool">${o.back || `<span class="mk-ic">${IC.chev}</span>`}<span class="sp"></span><span class="mk-ic">${IC.archive}</span><span class="mk-ic">${IC.trash}</span><span class="mk-ic">${IC.mail}</span><span class="mk-ic">${IC.dots}</span></div>
  <div class="ml-subj"><h4>${o.subj}</h4><span class="ml-lab">${tt('inbox')}</span><span class="sp"></span><span class="mk-ic">${IC.starO}</span></div>
  <div class="ml-from"><div class="mk-av" style="background:${o.color}">${o.ini}</div><div class="ml-who">${o.who}<span class="ml-to">${tt('toMe')} ▾</span></div><div class="ml-side"><span class="ml-t">${o.time}</span><span class="mk-ic">${IC.reply}</span></div></div>
  <div class="ml-body">${o.body}</div>
  <div class="ml-act"><span class="pill">${IC.reply}${tt('reply')}</span><span class="pill">${IC.fwdm}${tt('forward')}</span></div></div>`;
}
function mkChat(o) {
  return `<div class="mk chat fill"><div class="mk-h">${o.back || `<span class="mk-ic">${IC.chev}</span>`}<div class="mk-av" style="background:${o.color}">${o.av}</div><div class="mk-id"><div class="mk-n">${o.title}</div><div class="mk-s">${o.sub || ''}</div></div><span class="mk-ic">${IC.video}</span><span class="mk-ic">${IC.call}</span></div>
  <div class="mk-body">${o.banner || ''}<div class="mk-day">${tt('today')}</div>${o.msgs.map(m => `<div class="bub">${m.who ? `<div class="ch-who">${m.who}</div>` : ''}${m.fwd ? `<div class="ch-fwd">${m.fwd}</div>` : ''}${m.prev || ''}<div class="tx">${m.text}</div><span class="ch-t">${m.time}</span></div>`).join('')}</div>
  <div class="mk-in"><span class="mk-ic">${IC.plus}</span><span class="mk-field">${tt('chatPh')}</span><span class="mk-ic go g">${IC.mic}</span></div></div>`;
}
const mkPost = o => `<div class="mk post fill">${o.back ? `<div class="mk-top">${o.back}</div>` : ''}<div class="ps-h"><div class="mk-av ps-av">M</div><div class="mk-id"><div class="mk-n">${o.from}</div><div class="mk-s">${o.sub}</div></div><span class="mk-ic">${IC.dots}</span></div><div class="ps-img">${GIFT('pg', 300)}</div><div class="ps-cta"><span>${o.cta}</span>${IC.chevR}</div><div class="ps-ic">${IC.heart}${IC.bubble}${IC.send}<span class="sp"></span>${IC.save}</div><div class="ps-cap"><b>${o.from}</b> ${o.body}</div></div>`;
const mkCalls = o => `<div class="mk calls fill">${o.back ? `<div class="mk-top">${o.back}</div>` : ''}<div class="cl-h">${tt('recents')}</div>${[0, 1, 2].map(i => `<div class="cl-row" style="animation-delay:${i * 90}ms"><div class="mk-av">${IC.user}</div><div class="mk-id"><div class="cl-num"><bdi dir="ltr">${o.num}</bdi></div><div class="mk-s">${tt('missedRing')} · ${o.country}</div></div><span class="cl-t">07:5${2 - i}</span><span class="mk-ic">${IC.info}</span></div>`).join('')}</div>`;
const mkQR = o => `<div class="mk qr fill">${o.back ? `<div class="mk-top" style="background:#0b0b0b">${o.back}</div>` : ''}<div class="qr-v">${METER}<div class="qr-pill">${appIco('cam')}<div class="mk-id"><b>${tt('qrFound')}</b><div class="qr-u"><bdi dir="ltr">${esc(o.url)}</bdi></div></div><span class="qr-open">${tt('openLink')}</span></div></div><div class="qr-cap"><b>${o.sub}</b><br>${o.cap}</div></div>`;
function cardMock(c) {
  const t = c.t, back = backBtn();
  if (c.ui === 'sms') return mkSMS({ back, name: fmt(t.from), sub: tt('sms'), av: avOf(t.from), time: c.time, body: fmt(t.body) });
  if (c.ui === 'mail') return mkMail({ back, subj: fmt(t.subj), ini: avOf(t.from), color: avColor(t.from), time: c.time,
    who: `<span class="ml-name">${fmt(t.from)}</span><span class="ml-addr">&lt;<bdi dir="ltr">${esc(c.addr)}</bdi>&gt;</span>`,
    body: t.body.split('\n').map(p => `<p>${fmt(p)}</p>`).join('') + (t.cta ? `<div class="ml-cta"><span class="ml-btn">${esc(t.cta)}</span><span class="ml-url">${IC.link}<bdi dir="ltr">${esc(c.url)}</bdi></span></div>` : '') });
  if (c.ui === 'chat') return mkChat({ back, title: fmt(t.from), sub: esc(t.sub || ''), av: avOf(t.from, c.group), color: avColor(t.from), banner: t.banner ? banner(fmt(t.banner)) : '', msgs: [{ who: t.who ? esc(t.who) : '', text: fmt(t.body), time: c.time }] });
  if (c.ui === 'post') return mkPost({ back, from: esc(t.from), sub: esc(t.sub), cta: esc(t.cta), body: fmt(t.body) });
  if (c.ui === 'calls') return mkCalls({ back, num: esc(t.from), country: esc(t.sub) });
  return mkQR({ back, url: c.url, sub: fmt(t.sub), cap: fmt(t.body) });
}

/* ---------- navigation ---------- */
function stopAll() {
  stopTimer(); ringStop(); shush();
  if (A.ti) { clearInterval(A.ti); A.ti = null }
  TO.splice(0).forEach(clearTimeout);
  $$('.cf').forEach(e => e.remove());
}
const ROUTES = { home: showHome, salma: salmaStart, appel: appelStart, liens: liensStart, indices: huntStart, quiz: quizStart };
function route() { stopAll(); const v = location.hash.slice(1); (ROUTES[v] || showHome)() }
function go(v) { if (location.hash === '#' + v || (v === 'home' && !location.hash)) route(); else location.hash = v }
window.addEventListener('hashchange', route);
function setLang(l) {
  lang = l; store.set('piege-lang', l);
  const h = document.documentElement; h.lang = l; h.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.title = tt('title'); renderAside(); route();
}
function renderAside() {
  $('#aside').innerHTML = `<div class="tape"></div><h1>${tt('title')}</h1><p>${tt('tagline')}</p><ol>${[1, 2, 3, 4].map(i => `<li><span class="L">${'STOP'[i - 1]}</span><div><b>${tt('s' + i)}</b><span>${tt('s' + i + 'd')}</span></div></li>`).join('')}</ol><p class="small">${tt('rule1')}</p>`;
}

/* ---------- accueil ---------- */
function showHome() {
  app.className = 'home'; bar.hidden = true; tabs.hidden = false; setSheet(null);
  renderTabs(); renderHome(true);
}
function renderTabs() {
  tabs.innerHTML = [['games', IC.grid, 'tabGames'], ['stop', IC.shield, 'tabStop'], ['scores', IC.trophy, 'tabScores']]
    .map(([k, ic, l]) => `<button role="tab" aria-selected="${homeTab === k}" data-tab="${k}">${ic}<span>${tt(l)}</span></button>`).join('');
  $$('#tabs button').forEach(b => b.onclick = () => { homeTab = b.dataset.tab; sfx.tap(); renderTabs(); renderHome(true) });
}
function renderHome(anim) {
  const full = homeTab === 'games';
  let h = `<div class="hero ${full ? '' : 'compact'}"><div class="hero-top">${LOGO}<div class="seg" role="group" aria-label="${esc(tt('langLbl'))}">${['fr', 'en', 'ar'].map(l => `<button data-lang="${l}" lang="${l}" aria-pressed="${l === lang}">${l === 'ar' ? 'عربي' : l.toUpperCase()}</button>`).join('')}</div><button class="ib" id="snd" aria-pressed="${sound}" aria-label="${esc(sound ? tt('soundOn') : tt('soundOff'))}">${sound ? IC.vol : IC.mute}</button></div><h1>${full ? tt('title') : homeTab === 'stop' ? tt('stopTitle') : tt('boardTitle')}</h1>${full ? `<p>${tt('tagline')}</p>` : ''}</div><div class="tape"></div>`;
  if (full) h += `<div class="namebox"><label for="pseudo">${tt('pseudoLabel')}</label><input id="pseudo" maxlength="24" autocomplete="off" placeholder="${esc(tt('pseudoPh'))}" value="${esc(pname)}"></div><div class="tiles">${GAMES.map((g, i) => `<button class="tile t${i + 1} ${g === 'quiz' ? 'wide' : ''}" data-go="${g}" style="animation-delay:${80 + i * 70}ms">${TICON[g]}${g === 'quiz' ? `<span class="tx"><b class="tt">${tt('g_' + g)}</b><span class="td">${tt('d_' + g)}</span></span>` : `<b class="tt">${tt('g_' + g)}</b><span class="td">${tt('d_' + g)}</span>`}<span class="meta">${tt('m_' + g)}</span></button>`).join('')}</div><p class="small foot">${tt('note')}</p>`;
  else if (homeTab === 'stop') h += `<div class="stopl"><p class="small">${tt('stopLead')}</p>${[1, 2, 3, 4].map(i => `<div class="stopc" style="animation-delay:${i * 70}ms"><span class="L">${'STOP'[i - 1]}</span><div><b>${tt('s' + i)}</b><span>${tt('s' + i + 'd')}</span></div></div>`).join('')}<div class="callout red">${tt('rule1')}</div><div class="callout yel">${fmt(tt('report'))}</div></div>`;
  else { const l = load(); h += `<div class="scl">${GAMES.map((g, i) => { const top = l.filter(x => x.g === g).sort((a, b) => b.s / b.m - a.s / a.m).slice(0, 5); return `<div class="sc" style="animation-delay:${i * 60}ms"><h3>${tt('g_' + g)}</h3>${top.length ? `<ol>${top.map((x, j) => `<li><span class="rk">${j + 1}</span><span class="nm">${esc(x.n)}</span><span class="sv">${x.s}/${x.m}</span></li>`).join('')}</ol>` : `<p class="small">${tt('noScore')}</p>`}</div>` }).join('')}<button class="btn full" id="clr">${tt('clear')}</button></div>` }
  setView(h, anim ? 'in' : '');
  $$('.seg button').forEach(b => b.onclick = () => { if (b.dataset.lang !== lang) setLang(b.dataset.lang) });
  $('#snd').onclick = () => { sound = !sound; store.set('piege-sound', sound ? '1' : '0'); if (sound) { ac(); sfx.ping() } renderHome(false) };
  const p = $('#pseudo'); if (p) p.oninput = () => { pname = p.value };
  $$('.tile').forEach(b => b.onclick = () => { ac(); go(b.dataset.go) });
  const cl = $('#clr'); if (cl) cl.onclick = () => { store.del(KEY); renderHome(false) };
}

/* ---------- Jeu 1 : le téléphone de Salma ---------- */
let S = {};
function salmaStart() {
  app.className = 'game';
  const all = D.CARDS.map(c => ({ ...c, t: L(c) }));
  const pick = [...shuffle(all.filter(c => c.scam)).slice(0, 6), ...shuffle(all.filter(c => !c.scam)).slice(0, 2)].sort((a, b) => b.time.localeCompare(a.time));
  pick.forEach(c => { c.cl = c.t.clues ? shuffle(c.t.clues) : null });
  S = { cards: pick, done: {}, res: {}, score: 0, left: 480, phase: 'play', open: -1 };
  setBar(tt('g_salma'), chip('sT', IC.clock + '<span class="v">08:00</span>', 'red') + starChip('sP'));
  lockScreen(true);
  setSheet(`<p class="sh-t">${tt('salmaIntro')}</p><p class="small">${tt('salmaPts')}</p>${dotsHTML()}`);
  later(sfx.ping, 350); later(sfx.ping, 1100);
  timer = setInterval(() => {
    S.left--; setChipT('sT', mmss(S.left));
    if (S.left === 30) { const e = $('#sT'); e && e.classList.add('warn') }
    if (S.left <= 0) { stopTimer(); if (S.phase === 'play') envelope() }
  }, 1000);
}
const dotsHTML = () => `<div class="dots">${S.cards.map((c, k) => `<i class="${S.done[k] ? (S.res[k] ? 'ok' : 'ko') : ''}"></i>`).join('')}</div>`;
function preview(c) {
  const t = c.t; let p = t.body.replace(/\[\[|\]\]/g, '');
  if (c.ui === 'mail') p = t.subj + ' — ' + p.split('\n').slice(1).join(' ');
  if (c.ui === 'qr') p = t.sub;
  return p.replace(/\n+/g, ' ');
}
function lockScreen(first) {
  S.open = -1;
  setView(`<div class="lock fill"><div class="clk">18:21</div><div class="dt">${tt('date')}</div><div class="nfs">${S.cards.map((c, k) => {
    const d = S.done[k];
    return `<button class="nf ${d ? 'done ' + (S.res[k] ? 'r' : 'w') : ''}" data-k="${k}" style="${first ? `animation-delay:${200 + k * 110}ms` : 'animation:none'}"><div class="h">${appIco(c.ico)}<span>${esc(c.t.app)}</span><span class="tm">${c.time}</span></div><div class="s">${fmt(c.t.from)}</div><div class="p">${fmt(preview(c))}</div>${d ? `<span class="stamp ${c.scam ? 's' : 'o'}">${c.scam ? tt('stampScam') : tt('stampOk')}</span>` : ''}</button>`;
  }).join('')}</div></div>`, first ? 'in' : 'back');
  $$('#view .nf').forEach(b => b.onclick = () => openCard(+b.dataset.k));
}
function lockSheet() { setSheet(`<div class="sh-row"><b class="sh-t">${tt('tapNotif')}</b><span class="small">${tt('toSort', { n: S.cards.length - Object.keys(S.done).length })}</span></div>${dotsHTML()}`) }
function backToLock() { lockScreen(false); lockSheet() }
function openCard(k) {
  if (S.phase !== 'play') return;
  const c = S.cards[k]; S.open = k; sfx.tap();
  setView(cardMock(c), 'push');
  $('#mkb').onclick = backToLock;
  if (S.done[k]) { setSheet(fbHTML(S.res[k], tt('already'), fmt(c.t.ex)) + `<button class="btn full" id="bk">${IC.chev}<span>${tt('back')}</span></button>`); $('#bk').onclick = backToLock; return }
  setSheet(`<p class="sh-t">${tt('verdictQ')}</p><div class="btns"><button class="btn big scam" id="vS">${IC.warn}<span>${tt('isScam')}</span></button><button class="btn big legit" id="vL">${IC.check}<span>${tt('isLegit')}</span></button></div>`);
  $('#vS').onclick = () => verdict(true); $('#vL').onclick = () => verdict(false);
}
function verdict(saidScam) {
  const k = S.open, c = S.cards[k], right = saidScam === c.scam;
  S.done[k] = 1; S.res[k] = right;
  if (right) { addPts(S, 'sP', 1); sfx.ok() } else { sfx.ko(); buzz(60) }
  if (right && c.scam) {
    setSheet(fbHTML(true, tt('goodScam'), '') + `<p class="sh-t">${tt('whichClue')}</p><div class="choices">${c.cl.map((x, j) => `<button class="ch" data-j="${j}"><span>${fmt(x)}</span></button>`).join('')}</div>`);
    $$('#sheet .ch').forEach(b => b.onclick = () => {
      const ok = c.cl[+b.dataset.j] === c.t.clues[0];
      $$('#sheet .ch').forEach(x => x.disabled = true); b.classList.add(ok ? 'good' : 'bad');
      if (ok) { addPts(S, 'sP', 1); sfx.ok() } else { sfx.ko(); buzz(60) }
      later(() => finishCard(ok, ok ? tt('goodClue') : tt('badClue') + esc(c.t.clues[0]) + '.'), ok ? 450 : 700);
    });
  } else finishCard(right, right ? tt('goodLegit') : (c.scam ? tt('missScam') : tt('missLegit')));
}
function finishCard(right, title) {
  if (S.phase !== 'play') return;
  const c = S.cards[S.open], all = Object.keys(S.done).length === S.cards.length;
  setSheet(fbHTML(right, title, fmt(c.t.ex)) + `<button class="btn pri full" id="nx">${all ? tt('openEnv') : tt('nextNotif')}</button>`);
  $('#nx').onclick = () => { if (all) { stopTimer(); envelope() } else backToLock() };
}
function envelope() {
  if (S.phase === 'env') return; S.phase = 'env';
  const acts = tt('actions'); S.sh = shuffle(acts.map((a, i) => i)); S.ord = [];
  setView(`<div class="envw fill">${ENVELOPE}<h2>${tt('envTitle')}</h2><p>${tt('envTxt')}</p><div class="order" id="ordl"></div></div>`, 'in');
  setSheet(`<div class="btns"><button class="btn" id="rs">${IC.redo}<span>${tt('resetOrder')}</span></button><button class="btn pri" id="val" disabled>${tt('validate')}</button></div>`);
  sfx.ping();
  const draw = () => {
    $('#ordl').innerHTML = S.sh.map((ai, k) => { const n = S.ord.indexOf(k); return `<button class="ord ${n > -1 ? 'set' : ''}" data-k="${k}"><span class="n">${n > -1 ? n + 1 : ''}</span><span>${fmt(acts[ai])}</span></button>` }).join('');
    $$('#ordl .ord').forEach(b => b.onclick = () => { const k = +b.dataset.k; if (!S.ord.includes(k)) { S.ord.push(k); sfx.tap(); draw() } });
    $('#val').disabled = S.ord.length < 5;
  };
  $('#rs').onclick = () => { S.ord = []; draw() };
  $('#val').onclick = () => {
    const got = S.ord.map(k => S.sh[k]), exact = got.every((a, i) => a === i), first = got[0] === 0, bonus = exact ? 3 : first ? 2 : 0;
    if (bonus) addPts(S, 'sP', bonus);
    const msg = S.score >= 14 ? tt('salmaHi') : S.score >= 9 ? tt('salmaMid') : tt('salmaLo');
    const fb = fbHTML(!!bonus, exact ? tt('orderPerfect') : first ? tt('orderFirst') : tt('orderBad'), tt('rightOrder') + acts.map((a, i) => (i + 1) + '. ' + fmt(a)).join(' · ') + '.');
    results('salma', S.score, 17, msg, fb + `<div class="take">${tt('salmaTake')}</div>`, salmaStart, 'appel');
  };
  draw();
}

/* ---------- Jeu 2 : l'appel piégé ---------- */
let A = {};
function appelStart() {
  app.className = 'game';
  A = { score: 0 };
  setBar(tt('g_appel'), starChip('aP'));
  const col = ['#1d4ed8', '#141414', '#e5372b'];
  setView(`<div class="pad" style="padding-bottom:12px"><p class="lead2">${tt('appelIntro')}</p></div><div class="cl">${D.CALLS.map((c, i) => { const t = L(c); return `<button class="cc" data-i="${i}" style="animation-delay:${i * 80}ms"><span class="av" style="background:${col[i]}">${esc(t.ini)}</span><span class="mk-id"><b>${esc(t.title)}</b><span class="small">${tt('callSub')}</span></span><span class="go">${IC.phone}</span></button>` }).join('')}</div>`, 'in');
  $$('#view .cc').forEach(b => b.onclick = () => ring(+b.dataset.i));
  voiceSheet();
}
function voiceSheet() {
  setSheet(`<div class="sh-row"><span class="small">${tt('soundTip')}</span><button class="mini" id="vt">${voice ? IC.vol : IC.mute}<span>${voice ? tt('voiceOn') : tt('voiceOff')}</span></button></div>${hasVoice() ? '' : `<p class="small">${tt('noVoice')}</p>`}`);
  $('#vt').onclick = () => { voice = !voice; if (!voice) shush(); voiceSheet() };
}
function callHTML(mode) {
  const t = A.t;
  return `<div class="call fill ${mode}"><div class="c-st" id="ct">${mode === 'ring' ? tt('incoming') : '00:00'}</div><div class="c-name">${esc(t.name)}</div><div class="c-num"><bdi dir="ltr">${A.c.num}</bdi> · ${tt('mobile')}</div>
  <div class="c-av">${mode === 'ring' ? '<i class="rp"></i><i class="rp d2"></i><i class="rp d3"></i>' : ''}<span>${esc(t.ini)}</span></div>
  ${mode === 'on' ? `<div class="c-wave">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><div class="c-sub" id="csub" aria-live="polite"></div>` : ''}
  <div class="c-btns">${mode === 'ring'
    ? `<div class="cbw"><button class="cb dec" id="dec" aria-label="${esc(tt('decline'))}">${IC.hang}</button><span>${tt('decline')}</span></div><div class="cbw"><button class="cb acc" id="acc" aria-label="${esc(tt('accept'))}">${IC.phone}</button><span>${tt('accept')}</span></div>`
    : `<div class="cbw"><button class="cb dec" id="hang" aria-label="${esc(tt('decline'))}">${IC.hang}</button></div>`}</div></div>`;
}
function ring(i) {
  const c = D.CALLS[i];
  A = { i, c, t: L(c), k: 0, score: 0, order: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]), marks: {} };
  setChipT('aP', 0); app.classList.add('dark');
  setView(callHTML('ring'), 'in');
  setSheet(`<p class="sh-t">${tt('ringing')}</p><p>${esc(tt('callsYou', { n: A.t.name }))}</p>`);
  ringStart();
  $('#acc').onclick = answer;
  $('#dec').onclick = () => { ringStop(); setSheet(fbHTML(true, tt('declTitle'), tt('declTxt')) + `<button class="btn pri full" id="re">${IC.phone}<span>${tt('declBtn')}</span></button>`); $('#re').onclick = answer };
}
function answer() {
  ringStop(); A.t0 = Date.now();
  setView(callHTML('on'), '');
  $('#hang').onclick = () => { shush(); decide(true) };
  A.ti = setInterval(() => { const e = $('#ct'); if (e) e.textContent = mmss(Math.floor((Date.now() - A.t0) / 1000)) }, 1000);
  line();
}
function subs(t) { const el = $('#csub'); if (!el) return; el.innerHTML = '« ' + t.split(' ').map((w, i) => `<span style="animation-delay:${i * 170}ms">${fmt(w)}</span>`).join(' ') + ' »' }
function line() {
  const n = A.t.lines.length; if (A.k >= n) return decide(false);
  const tx = A.t.lines[A.k]; A.answered = false;
  subs(tx); say(tx);
  setSheet(`<div class="sh-row"><b class="sh-t">${tt('phrase', { i: A.k + 1, n })}</b><span style="display:flex;gap:6px"><button class="mini" id="rp">${IC.redo}<span>${tt('replay')}</span></button><button class="mini" id="vt2" aria-label="${esc(voice ? tt('voiceOn') : tt('voiceOff'))}">${voice ? IC.vol : IC.mute}</button><button class="mini hg" id="hg2" aria-label="${esc(tt('decline'))}">${IC.hangS}</button></span></div><p class="small">${tt('whichManip')}</p><div class="g9">${A.order.map(j => `<button class="cell ${A.marks[j] || ''}" data-j="${j}">${esc(A.t.grid[j])}</button>`).join('')}</div><div id="afb"></div>`);
  $('#rp').onclick = () => { subs(tx); say(tx) };
  $('#hg2').onclick = () => { shush(); decide(true) };
  $('#vt2').onclick = () => { voice = !voice; if (!voice) shush(); $('#vt2').innerHTML = voice ? IC.vol : IC.mute };
  $$('#sheet .cell').forEach(b => b.onclick = () => pick(+b.dataset.j, b));
}
function pick(j, btn) {
  if (A.answered) return; A.answered = true;
  const good = A.k, ok = j === good;
  if (ok) { A.marks[good] = 'hit'; addPts(A, 'aP', 1); sfx.ok() } else { A.marks[good] = 'miss'; sfx.ko(); buzz(50); btn.classList.add('shake') }
  const gb = $(`#sheet .cell[data-j="${good}"]`); if (gb) gb.className = 'cell ' + A.marks[good];
  const last = A.k + 1 >= A.t.lines.length;
  $('#afb').innerHTML = fbHTML(ok, ok ? tt('heard') : tt('notQuite'), tt('uses') + '<b>' + esc(A.t.grid[good]) + '</b>.') + `<button class="btn pri full" id="nl" style="margin-top:10px">${last ? tt('decision') : tt('nextLine')}</button>`;
  $('#nl').onclick = () => { A.k++; line() };
  later(() => { sheet.scrollTop = sheet.scrollHeight }, 30);
}
function decide(hungEarly) {
  clearInterval(A.ti); A.ti = null; shush();
  if (hungEarly) { addPts(A, 'aP', 3); sfx.ok(); return endCall(true, tt('hungUp')) }
  setSheet(`<p class="sh-t">${tt('truth')}</p><p>${fmt(A.t.q)}</p><div class="choices">${A.t.opts.map((o, i) => `<button class="ch" data-i="${i}"><span class="lt">${tt('letters')[i]}</span><span>${fmt(o)}</span></button>`).join('')}</div>`);
  $$('#sheet .ch').forEach(b => b.onclick = () => {
    const ok = +b.dataset.i === A.c.good;
    $$('#sheet .ch').forEach(x => x.disabled = true); b.classList.add(ok ? 'good' : 'bad');
    if (ok) { addPts(A, 'aP', 3); sfx.ok() } else { sfx.ko(); buzz(80) }
    later(() => endCall(ok, ok ? tt('goodDec') : tt('badDec')), 650);
  });
}
function endCall(ok, title) {
  shush(); if (A.ti) { clearInterval(A.ti); A.ti = null }
  setView(`<div class="call fill end"><div class="c-st">${tt('ended')}</div><div class="c-name">${esc(A.t.name)}</div><div class="c-av"><span>${IC.hang}</span></div><div class="c-sub">${tt('rule')}</div></div>`, 'in');
  setSheet(fbHTML(ok, title, fmt(A.t.ex)) + `<button class="btn pri full" id="sc">${tt('seeScore')}</button>`);
  $('#sc').onclick = () => {
    app.classList.remove('dark');
    const max = A.t.lines.length + 3;
    results('appel', A.score, max, tt('polite'), `<div class="take">${tt('rule')}</div>`, () => { app.classList.add('dark'); ring((A.i + 1) % D.CALLS.length) }, 'liens', tt('otherCall'));
  };
}

/* ---------- Jeu 3 : le détecteur de liens ---------- */
let K = {};
function hostInfo(u) {
  const m = u.match(/^(https?:\/\/)?([^\/?#]*)(.*)$/) || ['', '', u, ''];
  const proto = m[1] || '', auth = m[2] || '', rest = m[3] || '', at = auth.lastIndexOf('@');
  const pre = at >= 0 ? auth.slice(0, at + 1) : '', host = at >= 0 ? auth.slice(at + 1) : auth, reg = host.split('.').slice(-2).join('.');
  return { proto, pre, sub: host.slice(0, host.length - reg.length), reg, rest };
}
const hlUrl = (u, ok) => { const h = hostInfo(u); return `<span><span class="u-dim">${esc(h.proto + h.pre + h.sub)}</span><mark class="${ok ? 'ok' : 'ko'}">${esc(h.reg)}</mark><span class="u-dim">${esc(h.rest)}</span></span>` };
function liensStart() {
  app.className = 'game';
  K = { list: shuffle(D.LINKS).slice(0, 10), i: 0, score: 0, left: 90, res: [], state: 'intro' };
  setBar(tt('g_liens'), chip('lT', IC.clock + '<span class="v">01:30</span>', 'red') + starChip('lP'));
  setView(`<div class="pad"><div class="demo" aria-hidden="true"><span class="dl">${tt('trap')}</span><span class="dc">${IC.link}</span><span class="dr">${tt('realSite')}</span></div><p>${tt('liensIntro')}</p><div class="lk-bar" style="margin-top:14px">${IC.lock}${hlUrl('https://banqueatlas.ma.secure-login.com/connexion', false)}</div><p class="small" style="margin-top:10px">${tt('tip')}</p></div>`, 'in');
  setSheet(`<button class="btn pri full" id="lgo">${tt('start')}</button>`);
  $('#lgo').onclick = lCard;
}
function lRun() {
  if (timer) return;
  timer = setInterval(() => {
    K.left--; setChipT('lT', mmss(K.left));
    if (K.left === 15) { const e = $('#lT'); e && e.classList.add('warn') }
    if (K.left <= 0) { stopTimer(); if (K.state !== 'end') { K.state = 'end'; liensEnd(true) } }
  }, 1000);
}
function lCard() {
  const x = K.list[K.i]; K.state = 'card';
  setView(`<div class="lk fill"><div class="lk-prog">${K.list.map((_, j) => `<i class="${j < K.i ? (K.res[j] ? 'ok' : 'ko') : j === K.i ? 'cur' : ''}"></i>`).join('')}</div>
  <div class="lk-stack"><div class="lk-ghost"></div><div class="lk-card" id="lc"><div class="lk-off"><span>${tt('official')}</span><b>${esc(x.o)}</b></div><div class="lk-bar">${x.u.startsWith('https') ? IC.lock : ''}<span>${esc(x.u)}</span></div><div class="lk-sk"><i></i><i class="img"></i><i></i><i></i><i class="s"></i></div><span class="lk-st L">${tt('trap')}</span><span class="lk-st R">${tt('realSite')}</span></div></div>
  <div class="lk-hint"><span>${IC.arL}<bdi>${tt('trap')}</bdi></span><span><bdi>${tt('realSite')}</bdi>${IC.arR}</span></div></div>`, '');
  setSheet(`<div class="dual"><button class="btn tr" id="lTr">${IC.x}<span>${tt('trap')}</span></button><button class="btn okb" id="lOk">${IC.check}<span>${tt('realSite')}</span></button></div>`);
  $('#lTr').onclick = () => lAns(false); $('#lOk').onclick = () => lAns(true);
  swipe($('#lc'), lAns);
  lRun();
}
function swipe(el, cb) {
  let x0 = null, dx = 0;
  el.addEventListener('pointerdown', e => { if (K.state !== 'card') return; x0 = e.clientX; dx = 0; try { el.setPointerCapture(e.pointerId) } catch(_){} el.style.transition = 'none'; el.style.animation = 'none' });
  el.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; el.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; el.style.setProperty('--l', Math.min(1, Math.max(0, -dx / 80))); el.style.setProperty('--r', Math.min(1, Math.max(0, dx / 80))) });
  const end = () => { if (x0 === null) return; x0 = null; el.style.transition = ''; if (dx > 85) cb(true); else if (dx < -85) cb(false); else { el.style.transform = ''; el.style.setProperty('--l', 0); el.style.setProperty('--r', 0) } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
function lAns(saidOk) {
  if (K.state !== 'card') return; K.state = 'fb'; stopTimer();
  const x = K.list[K.i], ok = saidOk === x.ok; K.res[K.i] = ok;
  const c = $('#lc');
  if (c) { c.style.animation = 'none'; c.style.transition = 'transform .35s ease-in, opacity .35s'; c.style.setProperty(saidOk ? '--r' : '--l', 1); c.style.transform = `translateX(${saidOk ? 135 : -135}%) rotate(${saidOk ? 22 : -22}deg)`; c.style.opacity = '0' }
  if (ok) { addPts(K, 'lP', 1); sfx.ok() } else { sfx.ko(); buzz(60) }
  later(() => {
    const last = K.i + 1 >= K.list.length;
    setView(`<div class="lres fill"><div class="ic ${ok ? 'ok' : 'ko'}">${ok ? IC.check : IC.x}</div><h2>${ok ? tt('linkOk') : tt('linkKo')}</h2><p>${tt('answer')} <b>${x.ok ? tt('realSite') : tt('trap')}</b></p><div class="lk-bar">${x.u.startsWith('https') ? IC.lock : ''}${hlUrl(x.u, x.ok)}</div><p class="small">${tt('realDomain')} <b><bdi dir="ltr">${esc(hostInfo(x.u).reg)}</bdi></b></p><p>${fmt(L(x))}</p></div>`, 'in');
    setSheet(`<button class="btn pri full" id="lnx">${last ? tt('seeScore') : tt('nextLink')}</button>`);
    $('#lnx').onclick = () => { if (last) { K.state = 'end'; liensEnd(false) } else { K.i++; lCard() } };
  }, 330);
}
function liensEnd(timeUp) {
  const r = K.score / 10;
  results('liens', K.score, 10, r >= .9 ? tt('liensHi') : r >= .6 ? tt('liensMid') : tt('liensLo'), (timeUp ? fbHTML(false, tt('timeUp'), '') : '') + `<div class="take">${tt('tip')}</div>`, liensStart, 'indices');
}

/* ---------- Jeu 4 : la chasse aux indices ---------- */
let H = {};
function huntStart() {
  app.className = 'game';
  H = { m: 0, score: 0, order: shuffle([0, 1, 2]) };
  setBar(tt('g_indices'), chip('hF', '<span class="v">' + tt('found', { n: 0 }) + '</span>') + starChip('hP'));
  huntMsg();
}
function huntMock(M) {
  const T = p => p[lang] || p.x || p.fr;
  const hp = (k, inner, cls) => `<span class="hp ${cls || ''}" data-k="${k}" role="button" tabindex="0">${inner}</span>`;
  const parts = M.parts.map((p, k) => ({ p, k })), one = r => parts.find(o => o.p.r === r);
  if (M.kind === 'mail') {
    const f = one('from'), s = one('subj');
    const body = parts.filter(o => o.p.r !== 'from' && o.p.r !== 'subj').map(({ p, k }) => {
      if (p.r === 'logo') return hp(k, esc(T(p)), 'blk ml-logo');
      if (p.r === 'cta') return `<div class="ml-cta">${hp(k, `<span class="ml-btn">${esc(T(p))}</span><span class="ml-url">${IC.link}<bdi dir="ltr">${esc(p.url)}</bdi></span>`, 'blk')}</div>`;
      if (p.r === 'att') return hp(k, `<span class="fi">HTML</span><span><b><bdi dir="ltr">${esc(T(p))}</bdi></b><small>18 ${tt('kb')}</small></span>`, 'blk ml-att');
      return `<p>${hp(k, fmt(T(p)))}</p>`;
    }).join('');
    return mkMail({ subj: hp(s.k, fmt(T(s.p))), ini: 'S', color: '#b0122a', time: M.time, body,
      who: hp(f.k, `<span class="ml-name">${esc(f.p.name)}</span><span class="ml-addr">&lt;<bdi dir="ltr">${esc(f.p.addr)}</bdi>&gt;</span>`, 'blk') });
  }
  if (M.kind === 'sms') {
    const n = one('num');
    const body = parts.filter(o => o.p.r !== 'num').map(({ p, k }) => p.r === 'link' ? hp(k, `<a><bdi dir="ltr">${esc(T(p))}</bdi></a>`) : hp(k, fmt(T(p)))).join(' ');
    return mkSMS({ name: hp(n.k, `<bdi dir="ltr">${esc(T(n.p))}</bdi>`), sub: tt('sms'), av: IC.user, time: M.time, body });
  }
  const g = one('group'), s = one('sender'), fw = one('fwd'), lk = one('link');
  const segs = parts.filter(o => o.p.r === 'seg').map(({ p, k }) => hp(k, fmt(T(p)))).join(' ');
  const prev = lk ? hp(lk.k, `<span class="ch-prev"><span class="pv-img">${GIFT('pv', 120)}</span><span class="pv-t">${esc(L(M.pv))}</span><span class="pv-d"><bdi dir="ltr">${esc(T(lk.p))}</bdi></span></span>`, 'blk') : '';
  return mkChat({ title: hp(g.k, esc(T(g.p))), sub: esc(L(M.sub)), av: IC.group, color: '#25845a',
    msgs: [{ who: hp(s.k, esc(T(s.p))), fwd: hp(fw.k, IC.fwd + esc(T(fw.p))), prev, text: segs, time: M.time }] });
}
function huntMsg() {
  const M = D.HUNT[H.order[H.m]]; H.M = M; H.found = new Set(); H.over = false;
  setChipT('hF', tt('found', { n: 0 }));
  setView(huntMock(M), H.m ? 'push' : 'in');
  $$('#view .hp').forEach(el => { el.onclick = () => huntTap(el); el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); huntTap(el) } } });
  setSheet(`<div class="sh-row"><b class="sh-t">${tt('msgN', { i: H.m + 1, n: 3 })}</b><button class="btn pri" id="hdone" style="min-height:44px;padding:8px 16px;font-size:15px">${tt('doneBtn')}</button></div><div id="hfb"><p class="small">${tt('indIntro')}</p></div>`);
  $('#hdone').onclick = huntReveal;
}
function huntTap(el) {
  if (H.over || el.classList.contains('hit') || el.classList.contains('nope')) return;
  const k = +el.dataset.k, p = H.M.parts[k];
  if (p.b) { H.found.add(k); el.classList.add('hit'); addPts(H, 'hP', 1); sfx.ok(); $('#hfb').innerHTML = fbHTML(true, tt('foundOne'), fmt(L(p.w))) }
  else { el.classList.add('nope'); if (H.score > 0) addPts(H, 'hP', -1); sfx.ko(); buzz(50); $('#hfb').innerHTML = fbHTML(false, tt('neutral'), p.n ? fmt(L(p.n)) : '') }
  setChipT('hF', tt('found', { n: H.found.size }));
  if (H.found.size === 5) later(huntReveal, 900);
}
function huntReveal() {
  if (H.over) return; H.over = true;
  const miss = H.M.parts.map((p, k) => ({ p, k })).filter(o => o.p.b && !H.found.has(o.k));
  miss.forEach(o => { const e = $(`#view .hp[data-k="${o.k}"]`); if (e) e.classList.add('missed') });
  if (miss.length) { const e = $(`#view .hp[data-k="${miss[0].k}"]`); try { e && e.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }) } catch(_){} sfx.ko() } else sfx.win();
  const last = H.m >= 2;
  setSheet((miss.length ? `<div class="fb no"><span class="ic">${IC.x}</span><div><b class="ft">${tt('missed')}</b><ul>${miss.map(o => `<li>${fmt(L(o.p.w))}</li>`).join('')}</ul></div></div>` : fbHTML(true, tt('allFound'), '')) + `<button class="btn pri full" id="hnx">${last ? tt('seeScore') : tt('nextMsg')}</button>`);
  $('#hnx').onclick = () => { if (last) huntEnd(); else { H.m++; huntMsg() } };
}
function huntEnd() { const r = H.score / 15; results('indices', H.score, 15, r >= .85 ? tt('huntHi') : r >= .5 ? tt('huntMid') : tt('huntLo'), `<div class="take">${tt('indTake')}</div>`, huntStart, 'quiz') }

/* ---------- Jeu 5 : le quiz ---------- */
const PTS = [0, 1, 2, 3, 2];
let Z = {};
function quizStart() {
  app.className = 'game';
  setBar(tt('g_quiz'), starChip('qP'));
  setView(`<div class="pad" style="padding-bottom:12px"><p class="lead2">${tt('quizLead')}</p></div><div class="vers"><button class="ver v1" id="qe"><b class="tt">${tt('express')}</b><span>${tt('expressD')}</span><span class="meta">10 ×</span></button><button class="ver v2" id="qc" style="animation-delay:80ms"><b class="tt">${tt('full')}</b><span>${tt('fullD')}</span><span class="meta">22 ×</span></button></div>`, 'in');
  setSheet(null);
  const idx = D.QUIZ.map((_, i) => i), byLv = l => l.sort((a, b) => D.QUIZ[a].lv - D.QUIZ[b].lv);
  $('#qe').onclick = () => qGo(byLv(shuffle(idx).slice(0, 10)));
  $('#qc').onclick = () => qGo(byLv(idx.slice()));
}
function qGo(list) { Z = { list, i: 0, score: 0, max: list.reduce((s, k) => s + PTS[D.QUIZ[k].lv], 0), miss: [] }; setChipT('qP', 0); qQ() }
function qQ() {
  const q = D.QUIZ[Z.list[Z.i]], [tx, op] = L(q), lt = tt('letters');
  setView(`<div class="qz"><div class="qz-top"><span class="lvl">${tt('levels')[q.lv]}</span><span class="qmeta"><span class="qp">+${PTS[q.lv]} ${IC.star}</span><span><b>${Z.i + 1}</b>/${Z.list.length}</span></span></div><div class="qz-bar"><i style="width:${Z.i / Z.list.length * 100}%"></i></div><h2 class="qz-q">${fmt(tx)}</h2><div class="choices">${op.map((o, k) => `<button class="ch" data-k="${k}" style="animation:rise .4s ${80 + k * 60}ms both"><span class="lt">${lt[k]}</span><span>${fmt(o)}</span></button>`).join('')}</div></div>`, Z.i ? 'push' : 'in');
  setSheet(null);
  $$('#view .ch').forEach(b => b.onclick = () => qA(+b.dataset.k));
  requestAnimationFrame(() => requestAnimationFrame(() => { const i = $('.qz-bar i'); if (i) i.style.width = ((Z.i + 1) / Z.list.length * 100) + '%' }));
}
function qA(k) {
  const q = D.QUIZ[Z.list[Z.i]], tq = L(q), ex = tq[2], concept = tq[3], good = q.a, ok = k === good;
  $$('#view .ch').forEach((b, j) => { b.disabled = true; b.style.animation = ''; if (j === good) b.classList.add('good'); else if (j === k) b.classList.add('bad') });
  if (ok) { addPts(Z, 'qP', PTS[q.lv]); sfx.ok() } else { Z.miss.push(concept); sfx.ko(); buzz(60) }
  const last = Z.i + 1 >= Z.list.length;
  setSheet(fbHTML(ok, ok ? tt('qGood') + PTS[q.lv] : tt('qBad') + tt('letters')[good] + '.', fmt(ex) + `<span class="learn">${tt('learn')}${fmt(concept)}</span>`) + `<button class="btn pri full" id="qn">${last ? tt('seeScore') : tt('nextQ')}</button>`);
  $('#qn').onclick = () => { if (last) qEnd(); else { Z.i++; qQ() } };
}
function qEnd() {
  const r = Z.score / Z.max;
  results('quiz', Z.score, Z.max, r >= .85 ? tt('quizHi') : r >= .5 ? tt('quizMid') : tt('quizLo'), Z.miss.length ? `<div class="take">${tt('review')}${Z.miss.map(fmt).join(' · ')}.</div>` : `<div class="take">${tt('perfect')}</div>`, quizStart, null);
}

/* ---------- go ---------- */
try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {} } catch(e){}
setLang(lang);
}
