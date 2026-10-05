import { S, def, setS, save } from './store.js';
import { $, act, setRender, closeSheet } from './ui.js';
import { initPWA } from './pwa.js';
import { home } from './pages/home.js';
import { stock } from './pages/stock.js';
import { sales } from './pages/sales.js';
import { debts, customer } from './pages/customers.js';
import { capital, account } from './pages/capital.js';
import { payments, expenses, profits, reports } from './pages/finance.js';
import { more, log, settings } from './pages/system.js';

const USER = '123', PASS = '123';
const pages = { home, stock, sales, capital, more, debts, customer, account, payments, expenses, profits, reports, log, settings };
const titles = { stock: 'البضاعة', sales: 'المبيعات', capital: 'رأس المال', more: 'المزيد', debts: 'الزبائن', customer: 'تفاصيل الزبون', account: 'تفاصيل الحساب', payments: 'الدفعات', expenses: 'المصروفات', profits: 'الأرباح', reports: 'التقارير', log: 'سجل العمليات', settings: 'الإعدادات' };
const mains = ['home', 'stock', 'sales', 'debts', 'capital', 'more'];
const parent = { customer: 'debts', account: 'capital' };
let route = 'home', param = null;

export function go(r, p = null) { route = r; param = p; render(); }
function render() {
  $('#title').textContent = route === 'home' ? S.shop : titles[route];
  $('#back').style.display = mains.includes(route) ? 'none' : '';
  $('#main').innerHTML = pages[route](param);
  const on = mains.includes(route) ? route : route === 'account' ? 'capital' : route === 'customer' ? 'debts' : 'more';
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.r === on));
  scrollTo(0, 0);
}
setRender(render);

act.go = el => go(el.dataset.v, el.dataset.p ? +el.dataset.p : null);
act.back = () => go(parent[route] || 'more');

/* ---------- تسجيل الدخول ---------- */
function start() {
  const ok = localStorage.getItem('bastah_auth') === '1';
  $('#login').hidden = ok; $('#app').hidden = !ok;
  if (ok) go('home');
}
act.login = () => {
  if ($('#lu').value.trim() === USER && $('#lp').value === PASS) { localStorage.setItem('bastah_auth', '1'); start(); }
  else { const t = $('#toast'); t.textContent = 'اسم المستخدم أو كلمة السر غير صحيحة'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); }
};
act.logout = () => { localStorage.removeItem('bastah_auth'); closeSheet(); start(); };
act.resetData = el => {
  const all = el.dataset.v === 'all';
  if (!confirm(all ? 'سيتم حذف كل شيء نهائيًا. متأكد؟' : 'سيتم تصفير كل البيانات. متأكد؟')) return;
  setS(def()); save();
  all ? act.logout() : render();
};

/* ---------- الأحداث العامة ---------- */
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) act[el.dataset.a]?.(el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-i]'); if (el) act[el.dataset.i]?.(el, e); });
$('#lp').addEventListener('keydown', e => { if (e.key === 'Enter') act.login(); });

initPWA();
start();