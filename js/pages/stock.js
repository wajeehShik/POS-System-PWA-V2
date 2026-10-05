import { S, ui, save, uid, lg, acc, accBal } from '../store.js';
import { act, fmt, esc, dt, ymd, ts, F, fld, sel, accOpts, openSheet, toast, render, empty, $ } from '../ui.js';

export function stock() {
  const seg = `<div class="seg"><button class="${ui.tab === 'products' ? 'on' : ''}" data-a="tab" data-v="products">المنتجات</button><button class="${ui.tab === 'buys' ? 'on' : ''}" data-a="tab" data-v="buys">المشتريات</button></div>`;
  const btn = `<button class="btn pri block" data-a="addStock">+ إضافة بضاعة</button>`;
  if (ui.tab === 'buys') {
    const L = [...S.purchases].sort((a, b) => b.ts - a.ts);
    return seg + btn + `<div class="list">${L.map(p => `<div class="item static"><div class="av">🟠</div><div class="grow"><b>${esc(p.name)}</b><small>${dt(p.ts, 0)} · ${p.qty} قطعة · القطعة ${fmt(p.unit)} · من ${acc(p.acc).icon} ${esc(acc(p.acc).name)}</small>${p.note ? `<small>${esc(p.note)}</small>` : ''}</div><b>${fmt(p.total)}</b></div>`).join('') || empty('لا توجد مشتريات')}</div>`;
  }
  return seg + btn + `<div class="list">${S.products.map(p => `<div class="item" data-a="editProd" data-p="${p.id}"><div class="av">${esc(p.name[0])}</div>
  <div class="grow"><b>${esc(p.name)}</b>${p.qty <= 5 ? '<span class="badge">قارب على النفاد</span>' : ''}<small>الكمية: ${p.qty} · تكلفة القطعة ${fmt(p.cost)}</small></div>
  <div style="text-align:left"><small class="mut">قيمة المخزون</small><b>${fmt(p.qty * p.cost)}</b></div></div>`).join('') || empty('لا توجد بضاعة بعد')}</div>`;
}

act.tab = el => { ui.tab = el.dataset.v; render(); };
act.pUpd = () => {
  const q = +F('q') || 0, t = +F('c') || 0;
  $('#ptot').textContent = 'سعر القطعة: ' + (q > 0 ? fmt(t / q) : '—');
};

act.addStock = () => openSheet('إضافة بضاعة', `<datalist id="pl">${S.products.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
  ${fld('n', 'اسم المنتج', 'text', '', 'list="pl"')}
  <div class="g2">${fld('q', 'الكمية', 'number', '', 'data-i="pUpd"')}${fld('c', 'السعر الإجمالي (لكل الكمية)', 'number', '', 'data-i="pUpd"')}</div>
  <div class="total" id="ptot">سعر القطعة: —</div>
  <div class="g2">${fld('d', 'تاريخ الشراء', 'date', ymd())}${sel('ac', 'الدفع من', accOpts())}</div>
  ${fld('nt', 'ملاحظات (اختياري)')}`, 'إضافة', () => {
  const n = F('n').trim(), q = +F('q'), total = +F('c'), a = +F('ac');
  if (!n || !(q > 0) || !(total >= 0)) return toast('أكمل البيانات بشكل صحيح'), false;
  const unit = total / q, bal = accBal(a);
  if (total > bal + 0.001) return toast(`رصيد ${acc(a).name} غير كافٍ (${fmt(bal)}) — أضف رأس مال أولاً`), false;
  let p = S.products.find(x => x.name === n);
  if (p) { p.cost = (p.qty * p.cost + total) / (p.qty + q); p.qty += q; }
  else { p = { id: uid(), name: n, qty: q, cost: unit }; S.products.push(p); }
  S.purchases.push({ id: uid(), ts: ts(F('d')), pid: p.id, name: n, qty: q, unit, total, acc: a, note: F('nt') });
  lg('buy', total, `شراء ${n} × ${q} من ${acc(a).name}`);
  save(); render(); toast('تمت الإضافة ✓');
});

act.editProd = el => {
  const id = +el.dataset.p, p = S.products.find(x => x.id === id);
  openSheet('تعديل المنتج', `${fld('n', 'الاسم', 'text', p.name)}
  <div class="g2">${fld('q', 'الكمية', 'number', p.qty, 'data-i="pUpd"')}${fld('c', 'إجمالي تكلفة الكمية', 'number', +(p.qty * p.cost).toFixed(2), 'data-i="pUpd"')}</div>
  <div class="total" id="ptot"></div>
  <button class="btn red block" style="margin-bottom:12px" data-a="delProd" data-p="${id}">🗑 حذف المنتج</button>`, 'حفظ', () => {
    const q = +F('q'), t = +F('c');
    if (!F('n').trim() || q < 0 || t < 0) return toast('تحقق من القيم'), false;
    if (q !== p.qty) lg('adj', 0, `تعديل مخزون ${p.name} (${p.qty} ← ${q})`);
    Object.assign(p, { name: F('n').trim(), qty: q, cost: q > 0 ? t / q : p.cost }); save(); render();
  });
  act.pUpd();
};
act.delProd = el => {
  if (!confirm('حذف المنتج؟')) return;
  const id = +el.dataset.p, p = S.products.find(x => x.id === id);
  lg('adj', 0, 'حذف منتج: ' + p.name);
  S.products = S.products.filter(x => x.id !== id); save(); act.sheetClose(); render();
};