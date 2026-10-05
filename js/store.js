const K = 'bastah_v2';

export const def = () => ({
  shop: 'بسطتي',
  accounts: [
    { id: 1, name: 'نقدي', icon: '💵' },
    { id: 2, name: 'جوال باي', icon: '📱' },
    { id: 3, name: 'باي بال', icon: '🅿️' },
    { id: 4, name: 'بنك فلسطين', icon: '🏦' }
  ],
  capital: [],
  products: [],
  customers: [],
  purchases: [],
  sales: [],
  payments: [],
  expenses: [],
  log: [],
  seq: 10
});

const load = () => { try { return Object.assign(def(), JSON.parse(localStorage.getItem(K)) || {}); } catch { return def(); } };

export let S = load();
export const setS = d => { S = Object.assign(def(), d); };
export const save = () => localStorage.setItem(K, JSON.stringify(S));
export const uid = () => S.seq++;
export const ui = { per: 'today', from: '', to: '', tab: 'products' };
export const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
export const lg = (type, amount, text) => S.log.push({ id: uid(), ts: Date.now(), type, amount, text });

/* ---------- الحسابات ---------- */
export const acc = id => S.accounts.find(a => a.id === id) || { name: '—', icon: '•' };
export const accIn = id =>
  sum(S.capital.filter(x => x.acc === id), x => x.amount) +
  sum(S.sales.filter(x => x.acc === id), x => x.paid) +
  sum(S.payments.filter(x => x.acc === id), x => x.amount);
export const accOut = id =>
  sum(S.purchases.filter(x => x.acc === id), x => x.total) +
  sum(S.expenses.filter(x => x.acc === id), x => x.amount);
export const accBal = id => accIn(id) - accOut(id);

/* ---------- الزبائن: موجب = دين عليه، سالب = رصيد مقدّم له ---------- */
export const custDebt = id => {
  const d = sum(S.sales.filter(s => s.cid === id), s => s.total - s.paid) -
            sum(S.payments.filter(p => p.cid === id), p => p.amount);
  return Math.round(d * 100) / 100;
};

/* ---------- المعادلات الرئيسية ---------- */
export function calc() {
  const cash = sum(S.accounts, a => accBal(a.id));
  const stock = sum(S.products, p => p.qty * p.cost);
  const ds = S.customers.map(c => custDebt(c.id));
  const debts = sum(ds.filter(d => d > 0), d => d);
  const prepaid = sum(ds.filter(d => d < 0), d => -d);   // أموال زبائن عندك (التزام)
  const sales = sum(S.sales, s => s.total), cost = sum(S.sales, s => s.cost);
  const exp = sum(S.expenses, e => e.amount);
  const capital = cash + stock + debts - prepaid;
  const injected = sum(S.capital, c => c.amount);
  return { cash, stock, debts, prepaid, capital, injected, diff: capital - injected, sales, cost, gross: sales - cost, exp, net: sales - cost - exp };
}

/* ---------- الفترات ---------- */
export function range(p = ui.per) {
  const D = 864e5, t = new Date().setHours(0, 0, 0, 0);
  if (p === 'today') return [t, t + D];
  if (p === 'yesterday') return [t - D, t];
  if (p === 'week') { const w = t - ((new Date(t).getDay() + 1) % 7) * D; return [w, w + 7 * D]; }
  if (p === 'month') { const d = new Date(t); return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()]; }
  return [ui.from ? new Date(ui.from).getTime() : 0, ui.to ? new Date(ui.to).getTime() + D : Infinity];
}
export function stats(p = ui.per) {
  const [a, b] = range(p), In = x => x.ts >= a && x.ts < b;
  const list = S.sales.filter(In), ex = S.expenses.filter(In), py = S.payments.filter(In);
  const total = sum(list, x => x.total), cost = sum(list, x => x.cost), paid = sum(list, x => x.paid), exp = sum(ex, x => x.amount), pays = sum(py, x => x.amount);
  return { list, n: list.length, qty: sum(list, x => x.qty), total, cost, gross: total - cost, exp, net: total - cost - exp, paid, debt: total - paid, pays, collected: paid + pays };
}