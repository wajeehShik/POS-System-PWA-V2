import { S, calc, stats, custDebt, accBal } from '../store.js';
import { fmt, esc, row } from '../ui.js';

export function home() {
  const c = calc(), t = stats('today');
  const debtors = S.customers.filter(x => custDebt(x.id) > 0).length;
  const low = S.products.filter(p => p.qty <= 5).length;
  return `<div class="hero" data-a="go" data-v="capital" style="cursor:pointer"><small>رأس المال الحالي</small><div class="big">${fmt(c.capital)}</div>
  <div class="sub"><div>💵 الأرصدة<b>${fmt(c.cash)}</b></div><div>📦 البضاعة<b>${fmt(c.stock)}</b></div><div>👥 الديون<b>${fmt(c.debts)}</b></div></div></div>
  <div class="btns"><button class="btn pri" data-a="sell">🛒 بيع جديد</button><button class="btn" data-a="addStock">📦 شراء بضاعة</button></div>
  <div class="grid">
    <div class="stat"><small>📈 إجمالي الربح</small><b class="${c.gross >= 0 ? 'ok' : 'bad'}">${fmt(c.gross)}</b></div>
    <div class="stat"><small>🛒 مبيعات اليوم</small><b>${fmt(t.total)}</b></div>
    <div class="stat"><small>💰 المحصّل اليوم</small><b class="ok">${fmt(t.collected)}</b></div>
    <div class="stat"><small>📉 مصروفات اليوم</small><b class="bad">${fmt(t.exp)}</b></div>
    <div class="stat"><small>📦 عدد المنتجات</small><b>${S.products.length}</b></div>
    <div class="stat"><small>👤 الزبائن المدينون</small><b>${debtors}</b></div>
  </div>
  <div class="card"><h4>رصيد كل حساب</h4>${S.accounts.map(a => row(a.icon + ' ' + esc(a.name), fmt(accBal(a.id)), accBal(a.id) < 0 ? 'bad' : '')).join('')}</div>
  ${low ? `<div class="card" data-a="go" data-v="stock" style="cursor:pointer"><b class="warn">⚠️ ${low} منتج قريب من النفاد</b></div>` : ''}`;
}