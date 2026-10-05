import { S, stats, save, uid, lg, acc, custDebt, ui } from '../store.js';
import { act, fmt, esc, dt, F, fld, sel, accOpts, openSheet, toast, render, empty, chips, row, $ } from '../ui.js';

const balText = d => d > 0 ? `دين ${fmt(d)}` : d < 0 ? `رصيد ${fmt(-d)}` : 'مسدّد';
const okPhone = s => /^\+?\d{9,15}$/.test(s);
export function sales() {
  const s = stats(ui.per), L = [...s.list].sort((a, b) => b.ts - a.ts);
  return chips() + `<div class="hero"><small>ربح الفترة من المبيعات</small><div class="big">${fmt(s.gross)}</div>
  <div class="sub"><div>🛒 المبيعات<b>${fmt(s.total)}</b></div><div>🧾 العمليات<b>${s.n}</b></div><div>👤 على الحساب<b>${fmt(s.debt)}</b></div></div></div>
  <button class="btn pri block" data-a="sell">+ بيع جديد</button>
  <div class="list">${L.map(x => {
    const profit = x.total - x.cost, debt = x.total - x.paid, c = S.customers.find(k => k.id === x.cid);
    return `<div class="card sale" style="margin:0"><div class="top"><div><b>${esc(x.name)} × ${x.qty}</b><br><small>${dt(x.ts)}</small></div>
    <span class="tag ${debt > 0 ? 'd' : ''}">${debt > 0 ? 'على الحساب' : 'مدفوع'}</span></div>
    ${row('سعر البيع', fmt(x.total))}${row('تكلفة البضاعة', fmt(x.cost))}${row('الربح', fmt(profit), profit >= 0 ? 'ok' : 'bad')}
    ${x.paid > 0 ? row('المدفوع في', `${acc(x.acc).icon} ${esc(acc(x.acc).name)} · ${fmt(x.paid)}`) : ''}
    ${debt > 0 ? row('على حساب ' + esc(c ? c.name : '—'), fmt(debt), 'bad') : ''}
    <button class="btn red sm" style="margin-top:10px" data-a="delSale" data-p="${x.id}">حذف العملية</button></div>`;
  }).join('') || empty('لا توجد مبيعات في هذه الفترة')}</div>`;
}

let stype = 'full';
act.sell = () => {
  const ps = S.products.filter(p => p.qty > 0);
  if (!ps.length) return toast('أضف بضاعة أولاً');
  stype = 'full';
  openSheet('بيع جديد', `${sel('p', 'المنتج', ps.map(p => [p.id, `${p.name} (${p.qty})`]), '', 'data-i="sellUpd"')}
  <div class="g2">${fld('q', 'عدد القطع', 'number', 1, 'data-i="sellUpd"')}${fld('t', 'سعر البيع الإجمالي', 'number', '', 'data-i="sellUpd"')}</div>
  <div class="total" id="tot"></div>
  <div class="seg"><button id="s_full" data-a="sType" data-v="full">✅ دفع كامل</button><button id="s_debt" data-a="sType" data-v="debt">👤 على الحساب</button></div>
  <div id="payBox">${sel('ac', 'طريقة الدفع / الاستلام في', accOpts())}</div>
  <div id="debtBox" hidden>
    ${sel('c', 'الزبون', [...S.customers.map(c => [c.id, `${c.name} — ${balText(custDebt(c.id))}`]), ['new', '＋ زبون جديد']], '', 'data-i="custPick"')}
    <div id="cnw" hidden>${fld('cn', 'اسم الزبون الجديد')}${fld('cp', 'رقم جوال الزبون', 'tel', '', 'inputmode="tel" dir="ltr" placeholder="05XXXXXXXX"')}</div>
    ${fld('pd', 'المبلغ المدفوع الآن (إن وجد)', 'number', 0, 'data-i="sellUpd"')}
    <div class="mut" style="font-size:12px;margin-bottom:12px">إذا الزبون عنده رصيد مقدّم، بينخصم منه تلقائيًا.</div>
  </div>`, 'تأكيد البيع', doSell);
  $('#cnw').hidden = S.customers.length > 0;
  act.sType({ dataset: { v: 'full' } });
};
act.custPick = el => { $('#cnw').hidden = el.value !== 'new'; act.sellUpd(); };
act.sType = el => {
  stype = el.dataset.v;
  $('#s_full').classList.toggle('on', stype === 'full'); $('#s_debt').classList.toggle('on', stype === 'debt');
  $('#debtBox').hidden = stype !== 'debt'; act.sellUpd();
};
act.sellUpd = () => {
  const p = S.products.find(x => x.id == F('p')), q = +F('q') || 0, t = +F('t') || 0;
  if (!p) return;
  const cost = q * p.cost, profit = t - cost;
  let h = `التكلفة: ${fmt(cost)} · الربح: <span class="${profit >= 0 ? 'ok' : 'bad'}">${fmt(profit)}</span>`;
  if (stype === 'debt') {
    const s = F('c'), cur = (s && s !== 'new') ? custDebt(+s) : 0, after = cur + t - (+F('pd') || 0);
    h += `<br>${after > 0 ? 'الدين عليه بعد البيع: ' + fmt(after) : after < 0 ? 'يبقى له رصيد: ' + fmt(-after) : 'الحساب مسدّد'}`;
  }
  $('#tot').innerHTML = h;
};

function doSell() {
  const p = S.products.find(x => x.id == F('p')), q = +F('q'), t = +F('t');
  if (!(q > 0) || !(t > 0)) return toast('أدخل العدد وسعر البيع'), false;
  if (q > p.qty) return toast('المتوفر فقط ' + p.qty), false;
  let paid = t, cid = null;
  if (stype === 'debt') {
    paid = +F('pd') || 0;
    if (paid < 0 || paid >= t) return toast('المدفوع يجب أن يكون أقل من سعر البيع'), false;
    const s = F('c');
    if (s === 'new' || !S.customers.length) {
           const n = F('cn').trim(), ph = F('cp').replace(/[\s\-()]/g, '');
      if (!n) return toast('أدخل اسم الزبون'), false;
      if (!okPhone(ph)) return toast('أدخل رقم جوال صحيح (أرقام فقط)'), false;
      cid = uid(); S.customers.push({ id: cid, name: n, phone: ph });
    } else cid = +s;
  }
  const cost = q * p.cost, a = +F('ac');
  p.qty -= q;
  S.sales.push({ id: uid(), ts: Date.now(), pid: p.id, name: p.name, qty: q, total: t, cost, paid, acc: a, cid });
  lg('sale', t, `بيع ${p.name} × ${q} (ربح ${fmt(t - cost)})` + (stype === 'debt' ? ' — على الحساب' : ''));
  save(); render(); toast('تم البيع ✓');
}

act.delSale = el => {
  if (!confirm('حذف العملية وإرجاع البضاعة للمخزون؟')) return;
  const s = S.sales.find(x => x.id === +el.dataset.p), p = S.products.find(x => x.id === s.pid);
  if (p) p.qty += s.qty;
  S.sales = S.sales.filter(x => x !== s);
  lg('adj', 0, `حذف عملية بيع: ${s.name} × ${s.qty}`); save(); render();
};