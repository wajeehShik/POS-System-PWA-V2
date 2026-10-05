import { S, save, setS, def } from '../store.js';
import { act, fmt, esc, dt, F, fld, toast, render, empty, row, $ } from '../ui.js';

export function more() {
  const m = [ ['payments', '💳', 'الدفعات'], ['expenses', '💸', 'المصروفات'], ['profits', '📈', 'الأرباح'], ['reports', '📊', 'التقارير'], ['log', '🧾', 'سجل العمليات'], ['settings', '⚙️', 'الإعدادات']];
  return `<div class="menu">${m.map(([r, i, t]) => `<div class="item" data-a="go" data-v="${r}"><span>${i}</span><b>${t}</b></div>`).join('')}</div>`;
}

export function log() {
  const ic = { sale: '🟢', pay: '🔵', buy: '🟠', exp: '🔴', adj: '🟡', cap: '💰' };
  return `<div class="list" style="margin-top:0">${[...S.log].reverse().map(l => `<div class="item static"><div class="av" style="background:var(--bg)">${ic[l.type] || '•'}</div><div class="grow"><b>${esc(l.text)}</b><small>${dt(l.ts)}</small></div>${l.amount ? `<b>${fmt(l.amount)}</b>` : ''}</div>`).join('') || empty('لا توجد عمليات')}</div>`;
}

export function settings() {
  return `<div class="card"><h4>اسم البسطة</h4>${fld('sn', '', 'text', S.shop)}<button class="btn pri block" data-a="saveShop">حفظ</button></div>
  <div class="card"><h4>معلومات المستخدم</h4>${row('اسم المستخدم', '123')}</div>
  <div class="card"><h4>النسخ الاحتياطي</h4>
  <button class="btn block" data-a="exportData" style="margin-bottom:8px">⬇️ تصدير نسخة احتياطية</button>
  <button class="btn block" data-a="pickFile">⬆️ استيراد نسخة احتياطية</button>
  <input id="imp" type="file" accept=".json" hidden data-i="importData"></div>
  <div class="card"><button class="btn red block" data-a="resetData" data-v="data" style="margin-bottom:8px">تصفير البيانات</button>
  <button class="btn red block" data-a="resetData" data-v="all" style="margin-bottom:8px">حذف الحساب والبيانات</button>
  <button class="btn block" data-a="logout">تسجيل الخروج</button></div>`;
}

act.saveShop = () => { S.shop = F('sn').trim() || 'بسطتي'; save(); toast('تم الحفظ ✓'); render(); };
act.exportData = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
  a.download = 'bastah-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
};
act.pickFile = () => $('#imp').click();
act.importData = el => {
  const f = el.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!d.products) throw 0; setS(d); save(); toast('تم الاستيراد ✓'); render(); } catch { toast('الملف غير صالح'); } };
  r.readAsText(f);
};