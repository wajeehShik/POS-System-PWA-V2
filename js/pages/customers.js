import { S, save, uid, lg, acc, custDebt, sum } from '../store.js';
import { act, fmt, esc, dt, F, fld, sel, accOpts, openSheet, toast, render, empty, row } from '../ui.js';

const balText = d => d > 0 ? `دين ${fmt(d)}` : d < 0 ? `رصيد ${fmt(-d)}` : 'مسدّد';
const cleanPhone = s => String(s || '').replace(/[\s\-()]/g, '');
const okPhone = s => /^\+?\d{9,15}$/.test(s);
// 0599123456 ← 970599123456 (للواتساب)
const waNum = s => s.startsWith('+') ? s.slice(1) : s.startsWith('00') ? s.slice(2) : s.startsWith('0') ? '970' + s.slice(1) : s;

export function debts() {
  const L = S.customers.map(c => ({ ...c, d: custDebt(c.id) })).sort((a, b) => b.d - a.d);
  const owe = sum(L.filter(c => c.d > 0), c => c.d), pre = sum(L.filter(c => c.d < 0), c => -c.d);
  return `<div class="grid">
    <div class="stat"><small>إجمالي الديون عليهم</small><b class="bad">${fmt(owe)}</b></div>
    <div class="stat"><small>أرصدة مقدّمة لهم</small><b class="ok">${fmt(pre)}</b></div>
  </div>
  <div class="btns"><button class="btn pri" data-a="addCust">+ زبون جديد</button><button class="btn" data-a="pay">💳 تسجيل دفعة</button></div>
  <div class="list">${L.map(c => `<div class="item" data-a="go" data-v="customer" data-p="${c.id}"><div class="av">${esc(c.name[0])}</div>
    <div class="grow"><b>${esc(c.name)}</b><small dir="ltr" style="text-align:right">${c.phone ? '📞 ' + esc(c.phone) : '⚠️ بدون رقم'}</small></div>
    <div style="text-align:left"><b class="${c.d > 0 ? 'bad' : c.d < 0 ? 'ok' : 'mut'}">${fmt(Math.abs(c.d))}</b><small>${c.d > 0 ? 'دين عليه' : c.d < 0 ? 'رصيد مقدّم' : 'مسدّد'}</small></div></div>`).join('') || empty('لا يوجد زبائن')}</div>`;
}

act.addCust = () => openSheet('زبون جديد',
  `${fld('n', 'اسم الزبون')}
  ${fld('ph', 'رقم الجوال', 'tel', '', 'inputmode="tel" dir="ltr" placeholder="05XXXXXXXX"')}
  ${fld('a', 'دفعة مقدّمة (اختياري — إذا دفع مسبقًا)', 'number')}
  ${sel('ac', 'استلام الدفعة في', accOpts())}`,
  'إضافة', () => {
    const n = F('n').trim(), ph = cleanPhone(F('ph')), a = +F('a') || 0, ac = +F('ac');
    if (!n) return toast('أدخل اسم الزبون'), false;
    if (!okPhone(ph)) return toast('أدخل رقم جوال صحيح (أرقام فقط)'), false;
    if (a < 0) return toast('المبلغ غير صحيح'), false;
    const id = uid();
    S.customers.push({ id, name: n, phone: ph });
    if (a > 0) {
      S.payments.push({ id: uid(), ts: Date.now(), cid: id, amount: a, acc: ac, note: 'دفعة مقدّمة' });
      lg('pay', a, `دفعة مقدّمة من ${n} عبر ${acc(ac).name}`);
    }
    save(); render(); toast('تمت الإضافة ✓');
  });

act.editCust = el => {
  const id = +el.dataset.p, c = S.customers.find(x => x.id === id);
  openSheet('تعديل الزبون',
    `${fld('n', 'اسم الزبون', 'text', c.name)}
    ${fld('ph', 'رقم الجوال', 'tel', c.phone || '', 'inputmode="tel" dir="ltr" placeholder="05XXXXXXXX"')}`,
    'حفظ', () => {
      const n = F('n').trim(), ph = cleanPhone(F('ph'));
      if (!n) return toast('أدخل اسم الزبون'), false;
      if (!okPhone(ph)) return toast('أدخل رقم جوال صحيح (أرقام فقط)'), false;
      Object.assign(c, { name: n, phone: ph }); save(); render(); toast('تم الحفظ ✓');
    });
};

export function customer(id) {
  const c = S.customers.find(x => x.id === id);
  if (!c) return debts();
  const tx = [
    ...S.sales.filter(s => s.cid === id && s.total - s.paid > 0).map(s => ({ ts: s.ts, t: 'أخذ بضاعة — ' + esc(s.name) + ' × ' + s.qty, a: s.total - s.paid, bad: 1 })),
    ...S.payments.filter(p => p.cid === id).map(p => ({ ts: p.ts, t: `دفع (${acc(p.acc).icon} ${esc(acc(p.acc).name)})` + (p.note ? ' — ' + esc(p.note) : ''), a: p.amount }))
  ].sort((a, b) => b.ts - a.ts);
  const d = custDebt(id);
  const lbl = d > 0 ? 'عليه دين' : d < 0 ? 'له رصيد مقدّم' : 'الحساب مسدّد';
  const contact = c.phone
    ? `<div dir="ltr" style="margin:6px 0 10px;color:var(--mut)">📞 ${esc(c.phone)}</div>
       <div class="btns" style="margin-bottom:0">
         <a class="btn sm" style="text-decoration:none;text-align:center;color:inherit" href="tel:${esc(c.phone)}">📞 اتصال</a>
         <a class="btn sm" style="text-decoration:none;text-align:center;color:inherit" target="_blank" rel="noopener" href="https://wa.me/${waNum(c.phone)}">💬 واتساب</a>
       </div>`
    : `<div class="warn" style="margin:8px 0">⚠️ ما في رقم جوال لهذا الزبون</div>`;
  return `<div class="card" style="text-align:center"><div class="av" style="margin:0 auto 8px;width:56px;height:56px;font-size:24px">${esc(c.name[0])}</div><b>${esc(c.name)}</b>
  ${contact}
  <button class="btn sm" style="margin-top:10px" data-a="editCust" data-p="${id}">✏️ تعديل الاسم / الجوال</button>
  <div class="mut" style="margin-top:14px">${lbl}</div>
  <div style="font-size:30px;font-weight:800" class="${d > 0 ? 'bad' : d < 0 ? 'ok' : 'mut'}">${fmt(Math.abs(d))}</div>
  <button class="btn pri block" style="margin-top:12px" data-a="pay" data-p="${id}">+ إضافة دفعة</button></div>
  <div class="card"><h4>العمليات</h4>${tx.map(x => row(dt(x.ts, 0) + ' — ' + x.t, (x.bad ? '+' : '−') + fmt(x.a), x.bad ? 'bad' : 'ok')).join('') || empty('لا توجد عمليات')}</div>`;
}

act.pay = el => {
  const cid = el && el.dataset && el.dataset.p ? +el.dataset.p : null;
  if (!S.customers.length) return toast('أضف زبونًا أولاً');
  openSheet('إضافة دفعة',
    `${sel('c', 'الزبون', S.customers.map(c => [c.id, `${c.name} — ${balText(custDebt(c.id))}`]), cid)}
    ${fld('a', 'المبلغ', 'number')}
    ${sel('ac', 'طريقة الدفع', accOpts())}
    ${fld('nt', 'ملاحظات (اختياري)')}
    <div class="mut" style="font-size:12px;margin-bottom:12px">إذا المبلغ أكبر من الدين، الزيادة بتنحفظ كرصيد مقدّم للزبون.</div>`,
    'تسجيل الدفعة', () => {
      const id = +F('c'), a = +F('a'), ac = +F('ac');
      if (!(a > 0)) return toast('أدخل مبلغًا صحيحًا'), false;
      const before = custDebt(id);
      S.payments.push({ id: uid(), ts: Date.now(), cid: id, amount: a, acc: ac, note: F('nt') });
      lg('pay', a, `دفعة من ${S.customers.find(c => c.id === id).name} عبر ${acc(ac).name}`);
      save(); render();
      toast(a > before && before >= 0 ? 'تم التسجيل — الزيادة صارت رصيد مقدّم ✓' : 'تم تسجيل الدفعة ✓');
    });
};