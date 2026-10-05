import { S, ui, stats, calc, acc, accBal, sum, save, uid, lg, custDebt } from '../store.js';
import { act, fmt, esc, dt, F, fld, sel, accOpts, openSheet, toast, render, empty, chips, row } from '../ui.js';

export function payments() {
  const L = [...S.payments].sort((a, b) => b.ts - a.ts);
  return `<div class="stat" style="margin-bottom:12px"><small>إجمالي المحصّل من الديون</small><b class="ok">${fmt(sum(S.payments, p => p.amount))}</b></div>
  <button class="btn pri block" data-a="pay">+ دفعة جديدة</button>
  <div class="list">${L.map(p => {
    const c = S.customers.find(x => x.id === p.cid);
    return `<div class="item static"><div class="av">💳</div><div class="grow"><b>${esc(c ? c.name : '—')}</b><small>${dt(p.ts)} · ${acc(p.acc).icon} ${esc(acc(p.acc).name)}${p.note ? ' · ' + esc(p.note) : ''}</small></div><b class="ok">${fmt(p.amount)}</b></div>`;
  }).join('') || empty('لا توجد دفعات')}</div>`;
}

export function expenses() {
  const L = [...S.expenses].sort((a, b) => b.ts - a.ts);
  return `<div class="stat" style="margin-bottom:12px"><small>إجمالي المصروفات</small><b class="bad">${fmt(sum(S.expenses, e => e.amount))}</b></div>
  <button class="btn pri block" data-a="addExp">+ إضافة مصروف</button>
  <div class="list">${L.map(e => `<div class="item static"><div class="av">💸</div><div class="grow"><b>${esc(e.cat)}</b><small>${dt(e.ts)} · ${acc(e.acc).icon} ${esc(acc(e.acc).name)}${e.note ? ' · ' + esc(e.note) : ''}</small></div><b class="bad">${fmt(e.amount)}</b></div>`).join('') || empty('لا توجد مصروفات')}</div>`;
}

act.addExp = () => openSheet(
  'إضافة مصروف',
  `${sel('k', 'النوع', ['مواصلات', 'أكياس', 'إيجار', 'كهرباء', 'تلف بضاعة', 'مصاريف أخرى'].map(x => [x, x]))}${fld('a', 'المبلغ', 'number')}${sel('ac', 'الدفع من', accOpts())}${fld('nt', 'ملاحظات (اختياري)')}`,
  'إضافة',
  () => {
    const a = +F('a');
    if (!(a > 0)) return toast('أدخل مبلغًا صحيحًا'), false;
    S.expenses.push({ id: uid(), ts: Date.now(), cat: F('k'), amount: a, acc: +F('ac'), note: F('nt') });
    lg('exp', a, 'مصروف: ' + F('k'));
    save(); render();
  }
);

export function profits() {
  const s = stats();
  return chips() + `<div class="hero"><small>صافي الربح</small><div class="big" style="margin-bottom:0">${fmt(s.net)}</div></div>
  <div class="card">${row('المبيعات', fmt(s.total))}${row('تكلفة البضاعة', fmt(s.cost))}${row('إجمالي الربح', fmt(s.gross), s.gross >= 0 ? 'ok' : 'bad')}${row('المصروفات', fmt(s.exp), 'bad')}${row('صافي الربح', fmt(s.net), s.net >= 0 ? 'ok' : 'bad')}</div>`;
}

export function reports() {
  const s = stats(), c = calc();
  const top = S.customers
    .map(x => ({ n: x.name, d: custDebt(x.id) }))
    .filter(x => x.d > 0)
    .sort((a, b) => b.d - a.d);
  const low = S.products.filter(p => p.qty <= 5);

  return chips() + `
  <div class="card"><h4>🛒 تقرير المبيعات</h4>
    ${row('عدد العمليات', s.n)}
    ${row('القطع المباعة', s.qty)}
    ${row('إجمالي المبيعات', fmt(s.total))}
    ${row('المقبوض عند البيع', fmt(s.paid))}
    ${row('الدين', fmt(s.debt), 'bad')}
    ${row('المحصّل (مع الدفعات)', fmt(s.collected), 'ok')}
  </div>

  <div class="card"><h4>📈 تقرير الأرباح</h4>
    ${row('إجمالي الربح', fmt(s.gross))}
    ${row('المصروفات', fmt(s.exp), 'bad')}
    ${row('صافي الربح', fmt(s.net), s.net >= 0 ? 'ok' : 'bad')}
  </div>

  <div class="card"><h4>📦 تقرير المخزون</h4>
    ${row('عدد المنتجات', S.products.length)}
    ${row('قيمة المخزون', fmt(c.stock))}
    ${S.products.map(p => row(esc(p.name), p.qty + ' قطعة')).join('')}
    ${low.length ? `<div class="warn" style="margin-top:8px">⚠️ قريب من النفاد: ${low.map(p => esc(p.name)).join('، ')}</div>` : ''}
  </div>

  <div class="card"><h4>💵 أرصدة الحسابات</h4>
    ${S.accounts.map(a => row(a.icon + ' ' + esc(a.name), fmt(accBal(a.id)))).join('')}
  </div>

  <div class="card"><h4>👥 تقرير الديون</h4>
    ${row('إجمالي الديون', fmt(c.debts), 'bad')}
    ${row('عدد المدينين', top.length)}
    ${top.slice(0, 5).map(x => row(esc(x.n), fmt(x.d), 'bad')).join('')}
  </div>`;
}