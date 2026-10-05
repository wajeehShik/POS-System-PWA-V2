import { $, act } from './ui.js';

let dp = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

export function initPWA() {
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); dp = e; });
  addEventListener('appinstalled', () => $('#inst').classList.remove('on'));
  if (!standalone()) setTimeout(() => $('#inst').classList.add('on'), 700);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}

act.instClose = () => $('#inst').classList.remove('on');
act.doInstall = async () => {
  if (dp) { dp.prompt(); await dp.userChoice; dp = null; return act.instClose(); }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $('#instTxt').innerHTML = ios
    ? 'اضغط زر <b>المشاركة</b> في سفاري، ثم اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.'
    : 'من قائمة المتصفح (⋮) اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.';
  $('#instBtn').hidden = true;
};