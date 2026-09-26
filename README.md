# نظام حجز مكتبة النجاح + Dashboard

## التشغيل
1. ثبّت Node.js.
2. افتح Terminal داخل المجلد.
3. نفّذ:
   npm install
   npm start
4. صفحة الحجز:
   http://localhost:3000/
5. لوحة الإدارة:
   http://localhost:3000/dashboard

## مفتاح الداشبورد
المفتاح الافتراضي: najah2026
يفضل تغييره على السيرفر:
Windows CMD:
set ADMIN_KEY=كلمة_سر_قوية
npm start

Linux:
ADMIN_KEY=كلمة_سر_قوية npm start

## ما تم إلغاؤه
تم إلغاء فتح WhatsApp عند إرسال الحجز. الطلب يُحفظ مباشرة في data/bookings.json، وأي صورة إيصال في data/receipts.

## ملاحظات
هذا الإصدار مناسب كبداية وتشغيل على استضافة Node.js. قبل الاستخدام العام يفضل إضافة قاعدة بيانات حقيقية، حسابات مستخدمين، HTTPS ونسخ احتياطي.
