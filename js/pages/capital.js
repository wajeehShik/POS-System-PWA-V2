import { S, calc, acc, accBal, accIn, sum, save, uid, lg, custDebt } from '../store.js';
import { act, fmt, esc, dt, ymd, ts, F, fld, sel, accOpts, openSheet, toast, render, empty, row } from '../ui.js';

export function capital() {
  const c = calc();
  return `<div class="hero"><small>رأس المال الحالي</small><div class="big">${fmt(c.capital)}</div>
  <div class="sub"><div>💵 الأرصدة<b>${fmt(c.cash)}</b></div><div>📦 البضاعة<b>${fmt(c.stock)}</b></div><div>👥 الديون<b>${fmt(c.debts)}</b></div></div></div>
  <div class="btns"><button class="btn pri" data-a="addCap">+ إضافة رأس مال</button><button class="btn" data-a="addAcc">+ حساب جديد</button></div>
  <div class="card"><h4>المقارنة</h4>${row('إجمالي رأس المال المضاف', fmt(c.injected))}${row('رأس المال الحالي', fmt(c.capital))}
  ${c.prepaid > 0 ? row('أرصدة مقدّمة للزبائن (التزام)', fmt(c.prepaid), 'bad') : ''}
  ${row('الزيادة / النقص', (c.diff >= 0 ? '+' : '') + fmt(c.diff), c.diff >= 0 ? 'ok' : 'bad')}${row('صافي الربح', fmt(c.net), c.net >= 0 ? 'ok' : 'bad')}</div>
  <div class="card" style="text-align:center">${c.diff > 0 ? '📈 رأس مالك زاد' : c.diff < 0 ? '📉 رأس مالك نقص' : 'رأس مالك ثابت'}</div>
  <h4 style="margin:6px 4px">الحسابات (اضغط للتفاصيل)</h4>
  <div class="list" style="margin-top:6px">${S.accounts.map(a => `<div class="item" data-a="go" data-v="account" data-p="${a.id}"><div class="av">${a.icon}</div><div class="grow"><b>${esc(a.name)}</b></div><b class="${accBal(a.id) < 0 ? 'bad' : ''}">${fmt(accBal(a.id))}</b></div>`).join('')}</div>`;
}

export function account(id) {
  const a = S.accounts.find(x => x.id === id);
  if (!a) return capital();
  const cap = S.capital.filter(x => x.acc === id), sl = S.sales.filter(x => x.acc === id && x.paid > 0),
    py = S.payments.filter(x => x.acc === id), pu = S.purchases.filter(x => x.acc === id), ex = S.expenses.filter(x => x.acc === id);
  const mv = [
    ...cap.map(x => ({ ts: x.ts, t: '💰 إضافة رأس مال' + (x.note ? ' — ' + esc(x.note) : ''), a: x.amount, in: 1 })),
    ...sl.map(x => ({ ts: x.ts, t: '🟢 بيع ' + esc(x.name), a: x.paid, in: 1 })),
    ...py.map(x => ({ ts: x.ts, t: '🔵 دفعة من ' + esc((S.customers.find(c => c.id === x.cid) || {}).name), a: x.amount, in: 1 })),
    ...pu.map(x => ({ ts: x.ts, t: `🟠 اشتريت: ${esc(x.name)} × ${x.qty}`, a: x.total })),
    ...ex.map(x => ({ ts: x.ts, t: '🔴 مصروف: ' + esc(x.cat), a: x.amount }))
  ].sort((p, q) => q.ts - p.ts);
  return `<div class="hero"><small>${a.icon} ${esc(a.name)} — الرصيد</small><div class="big" style="margin-bottom:0">${fmt(accBal(id))}</div></div>
  <button class="btn pri block" data-a="addCap" data-p="${id}" style="margin-bottom:12px">+ إضافة رأس مال لهذا الحساب</button>
  <div class="card">${row('رأس المال المضاف', fmt(sum(cap, x => x.amount)))}${row('مقبوض من المبيعات', fmt(sum(sl, x => x.paid)))}${row('مقبوض من الدفعات', fmt(sum(py, x => x.amount)))}
  ${row('مشتريات بضاعة منه', fmt(sum(pu, x => x.total)), 'bad')}${row('مصروفات منه', fmt(sum(ex, x => x.amount)), 'bad')}</div>
  <div class="card"><h4>كل الحركات (وما اشتريته منه)</h4>${mv.map(x => row(dt(x.ts, 0) + ' — ' + x.t, (x.in ? '+' : '−') + fmt(x.a), x.in ? 'ok' : 'bad')).join('') || empty('لا توجد حركات')}</div>`;
}

act.addCap = el => {
  const pre = el.dataset.p ? +el.dataset.p : 1;
  openSheet('إضافة رأس مال', `${fld('a', 'المبلغ', 'number')}${sel('ac', 'إضافته إلى حساب', accOpts(), pre)}${fld('d', 'التاريخ', 'date', ymd())}${fld('nt', 'ملاحظات (اختياري)')}`, 'إضافة', () => {
    const a = +F('a'); if (!(a > 0)) return toast('أدخل مبلغًا صحيحًا'), false;
    S.capital.push({ id: uid(), ts: ts(F('d')), acc: +F('ac'), amount: a, note: F('nt') });
    lg('cap', a, `إضافة رأس مال إلى ${acc(+F('ac')).name}`); save(); render(); toast('تمت الإضافة ✓');
  });
};
act.addAcc = () => openSheet('حساب / طريقة دفع جديدة', `${fld('n', 'الاسم (مثال: محفظة جوال)')}${fld('i', 'رمز (إيموجي)', 'text', '💳')}`, 'إضافة', () => {
  const n = F('n').trim(); if (!n) return toast('أدخل الاسم'), false;
  S.accounts.push({ id: uid(), name: n, icon: F('i').trim() || '💳' }); save(); render();
});