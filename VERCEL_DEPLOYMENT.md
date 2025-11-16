# دليل النشر على Vercel

## خطوات النشر

### 1. ربط المشروع بـ Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط على "Add New Project"
3. استورد repository من GitHub
4. اختر `SmartLawerAssistant_angular`

### 2. إعدادات المشروع

في صفحة إعدادات المشروع على Vercel:

#### Build & Development Settings

- **Framework Preset**: Other (يتم الكشف تلقائياً من vercel.json)
- **Root Directory**: `smart-lawyer-portal`
- **Build Command**: `npm run build` (يتم تعيينه تلقائياً)
- **Output Directory**: `dist/smart-lawyer-portal/browser` (يتم تعيينه تلقائياً)
- **Install Command**: `npm install` (يتم تعيينه تلقائياً)

#### Node.js Version

تأكد من استخدام Node.js 18.x أو أحدث:
- في Project Settings → General → Node.js Version
- اختر `18.x` أو `20.x`

### 3. Environment Variables (مهم جداً!)

⚠️ **ملاحظة**: لن يعمل المشروع بدون إضافة المتغيرات التالية!

في صفحة Project Settings → Environment Variables، أضف:

#### للـ Production Environment:

لا توجد متغيرات بيئية مطلوبة حالياً لأن جميع الإعدادات موجودة في `environment.prod.ts`.

ولكن إذا أردت تخصيص API URL في المستقبل، يمكنك إضافة:

```
API_URL=https://mohami.bdcbiz.com
SIGNALR_HUB=https://mohami.bdcbiz.com/notificationHub
```

### 4. إعدادات إضافية (اختيارية)

#### Custom Domain

1. اذهب إلى Settings → Domains
2. أضف domain خاص بك
3. اتبع التعليمات لإعداد DNS

#### HTTPS & SSL

- يتم تفعيل HTTPS تلقائياً على Vercel
- لا حاجة لأي إعدادات إضافية

### 5. النشر

بعد إضافة جميع الإعدادات:

1. اضغط "Deploy"
2. انتظر اكتمال عملية Build (عادة 2-3 دقائق)
3. بعد النجاح، ستحصل على رابط مثل: `https://your-project.vercel.app`

### 6. النشر التلقائي

من الآن فصاعداً:
- كل push إلى `master` branch سيتم نشره تلقائياً
- كل pull request سيحصل على preview deployment خاص به

---

## استكشاف الأخطاء الشائعة

### خطأ: "404 on reload"

✅ **محلول**: ملف `vercel.json` يحتوي على rewrites للتعامل مع Angular routing

### خطأ: "Build failed - Budget exceeded"

✅ **محلول**: تم رفع حدود الـ budgets في `angular.json`

### خطأ: "Cannot find module"

❌ **الحل**:
- تأكد من أن `node_modules` موجود في `.vercelignore`
- تأكد من صحة `package.json` dependencies
- جرب Clear Cache & Redeploy من Vercel dashboard

### خطأ: "API calls failing"

❌ **الحل**:
1. تحقق من CORS settings في backend
2. تأكد من أن API URL صحيح في `environment.prod.ts`
3. في Vercel dashboard → Functions → تحقق من logs

### خطأ: "SignalR connection failed"

❌ **الحل**:
1. تأكد من أن SignalR Hub يستخدم HTTPS
2. تحقق من CORS policy في backend
3. تأكد من أن WebSocket connections مسموح بها

---

## ملاحظات مهمة

### 1. API Proxy

⚠️ **تنبيه**: ملف `proxy.conf.json` يعمل فقط في Development!

في Production على Vercel:
- جميع الطلبات تذهب مباشرة إلى `https://mohami.bdcbiz.com`
- تأكد من تفعيل CORS في backend للسماح بـ domain الخاص بـ Vercel

### 2. Authentication Cookies

تأكد من إعداد backend cookies بشكل صحيح:

```csharp
// في Backend (ASP.NET Core)
services.AddCors(options =>
{
    options.AddPolicy("AllowVercel",
        builder => builder
            .WithOrigins("https://your-project.vercel.app")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});
```

### 3. Performance

لأفضل أداء:
- استخدم lazy loading للـ modules
- فعّل compression في backend
- استخدم CDN للـ assets الكبيرة

---

## معلومات الدعم

- [Vercel Documentation](https://vercel.com/docs)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)
- [Vercel CLI](https://vercel.com/docs/cli) للنشر من Terminal

---

## إعدادات vercel.json

تم إنشاء ملف `vercel.json` مع:

✅ Rewrites للـ Angular routing
✅ Security headers (X-Frame-Options, X-XSS-Protection, etc.)
✅ Cache headers للـ static assets
✅ تحديد output directory الصحيح
✅ Build command المناسب

تم إعداد كل شيء! فقط قم برفع المشروع على GitHub واربطه بـ Vercel.
