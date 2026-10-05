import { S, ui } from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const act = {};                       // سجل الأوامر (data-a)
let _r = () => {};
export const setRender = f => { _r = f; };
export const render = () => _r();

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = n => (Math.round((n || 0) * 100) / 100).toLocaleString('en-US') + ' ₪';
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const dt = (t, time = 1) => {
  const d = new Date(t);
  return DAYS[d.getDay()] + ' ' + d.toLocaleDateString('en-GB') + (time ? ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
};


export const ymd = (t = Date.now()) => { const d = new Date(t); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
export const ts = d => (!d || d === ymd()) ? Date.now() : new Date(d + 'T12:00').getTime();

export const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2400); };
export const empty = t => `<div class="empty">${t}</div>`;
export const row = (a, b, c = '') => `<div class="row2"><span>${a}</span><b class="${c}">${b}</b></div>`;

export const F = id => $('#f_' + id).value;
export const fld = (id, lb, type = 'text', val = '', x = '') =>
  `<label>${lb}<input id="f_${id}" type="${type}" value="${esc(val)}" ${type === 'number' ? 'inputmode="decimal" step="any" min="0"' : ''} ${x}></label>`;
export const sel = (id, lb, opts, val = '', x = '') =>
  `<label>${lb}<select id="f_${id}" ${x}>${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
export const accOpts = () => S.accounts.map(a => [a.id, a.icon + ' ' + a.name]);

/* ---------- نافذة الإدخال ---------- */
let fn = null;
export function openSheet(title, body, okText, f) {
  $('#sh').innerHTML = `<div class="grab"></div><h3>${title}</h3>${body}<div class="rw"><button class="btn" data-a="sheetClose">إلغاء</button><button class="btn pri" data-a="sheetOk">${okText}</button></div>`;
  fn = f; $('#ov').classList.add('on');
}
export const closeSheet = () => $('#ov').classList.remove('on');
act.sheetClose = closeSheet;
act.sheetOk = () => { if (fn() !== false) closeSheet(); };
act.ov = (el, e) => { if (e.target === el) closeSheet(); };

/* ---------- فلتر الفترة ---------- */
export function chips() {
  const o = { today: 'اليوم', yesterday: 'أمس', week: 'هذا الأسبوع', month: 'هذا الشهر', custom: 'فترة مخصصة' };
  return `<div class="chips">${Object.entries(o).map(([k, v]) => `<button class="${ui.per === k ? 'on' : ''}" data-a="per" data-v="${k}">${v}</button>`).join('')}</div>
  ${ui.per === 'custom' ? `<div class="g2" style="margin-bottom:12px"><label>من<input type="date" value="${ui.from}" data-i="from"></label><label>إلى<input type="date" value="${ui.to}" data-i="to"></label></div>` : ''}`;
}
act.per = el => { ui.per = el.dataset.v; render(); };
act.from = el => { ui.from = el.value; render(); };
act.to = el => { ui.to = el.value; render(); };