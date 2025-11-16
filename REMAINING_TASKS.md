# 📋 المهام المتبقية لإكمال تحسينات تحميل البيانات

## 🎯 نظرة عامة
تم إنجاز الهيكل الأساسي والحلول الشاملة. الآن نحتاج إلى تطبيق هذه الحلول على باقي Components و Services.

---

## ✅ ما تم إنجازه

- [x] Error Interceptor محسّن مع رسائل عربية
- [x] Loading Service & Interceptor
- [x] Cache Service للتخزين المؤقت
- [x] Base API Service مع Retry Logic
- [x] Global Loading Component
- [x] Skeleton Loader Components
- [x] تحديث `case-api.service.ts` كمثال
- [x] إصلاح Memory Leaks في `cases-list.component.ts`
- [x] إضافة Global Loading إلى Main Layout
- [x] تسجيل جميع Interceptors في app.config

---

## 🔄 المهام المتبقية

### 1. تحديث API Services (Priority: HIGH)

#### Services التي تحتاج تحديث:

- [ ] `client-api.service.ts`
  ```typescript
  // تحويلها لاستخدام BaseApiService
  // إضافة caching و retry logic
  ```

- [ ] `document-api.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `session-api.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `court-api.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `nationality.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `court-type.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `case-assignment.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `ai-case-analysis.service.ts`
  ```typescript
  // نفس الشيء
  ```

- [ ] `report.service.ts` (أو report-api.service.ts)
  ```typescript
  // نفس الشيء
  ```

- [ ] `rbac.service.ts`
  ```typescript
  // نفس الشيء
  ```

---

### 2. إصلاح Memory Leaks في Components (Priority: HIGH)

#### Components التي تحتاج إصلاح:

- [ ] `clients-list.component.ts`
  - إضافة `DestroyRef`
  - استخدام `takeUntilDestroyed` في جميع subscriptions
  - إزالة console.log statements

- [ ] `documents-list.component.ts`
  - نفس الشيء

- [ ] `sessions-list.component.ts`
  - نفس الشيء
  - لاحظ: يحمل 3 APIs في نفس الوقت (sessions, cases, courts)
  - فكّر في lazy loading للـ dropdowns

- [ ] `courts.component.ts`
  - نفس الشيء

- [ ] `court-types.component.ts`
  - نفس الشيء

- [ ] `nationalities.component.ts`
  - نفس الشيء

- [ ] `case-assignments.component.ts`
  - نفس الشيء

- [ ] `dashboard.component.ts`
  - إزالة mock data
  - ربطها بالـ API الفعلي
  - إضافة error handling
  - إضافة retry logic

- [ ] `ai-case-analysis.component.ts`
  - نفس الشيء

- [ ] `ai-assistant.component.ts`
  - نفس الشيء

- [ ] `reports.component.ts`
  - نفس الشيء

- [ ] `profile.component.ts`
  - نفس الشيء

- [ ] `rbac.component.ts`
  - نفس الشيء

---

### 3. إضافة Skeleton Loaders للـ Templates (Priority: MEDIUM)

#### Templates التي تحتاج Skeleton Loaders:

- [ ] `cases-list.component.html`
  ```html
  @if (loading()) {
    <app-skeleton-loader type="table"></app-skeleton-loader>
  }
  ```

- [ ] `clients-list.component.html`
  ```html
  @if (loading()) {
    <app-skeleton-loader type="list" [count]="10"></app-skeleton-loader>
  }
  ```

- [ ] `documents-list.component.html`
  - استخدم `type="card"` أو custom skeleton

- [ ] `sessions-list.component.html`
  - استخدم `type="table"`

- [ ] `courts.component.html`
  - استخدم `type="table"`

- [ ] `court-types.component.html`
  - استخدم `type="list"`

- [ ] `nationalities.component.html`
  - استخدم `type="list"`

- [ ] `case-assignments.component.html`
  - استخدم `type="table"`

- [ ] `dashboard.component.html`
  - استخدم multiple skeleton types:
    - `type="card"` للإحصائيات
    - `type="list"` للأنشطة الأخيرة

- [ ] `reports.component.html`
  - استخدم `type="card"` و charts skeletons

---

### 4. تحسينات إضافية (Priority: LOW)

- [ ] إنشاء Logging Service بدلاً من console.log
  ```typescript
  @Injectable({ providedIn: 'root' })
  export class LoggerService {
    log(message: string, data?: any) {
      if (!environment.production) {
        console.log(message, data);
      }
    }
    // ... error, warn, info
  }
  ```

- [ ] إضافة Environment-based configuration للـ cache TTL
  ```typescript
  // في environment.ts
  export const environment = {
    caching: {
      defaultTTL: 5 * 60 * 1000,
      cases: 2 * 60 * 1000,
      clients: 5 * 60 * 1000,
      // ...
    }
  };
  ```

- [ ] إضافة Unit Tests للـ Services الجديدة
  - `loading.service.spec.ts`
  - `cache.service.spec.ts`
  - `base-api.service.spec.ts`

- [ ] إضافة E2E Tests للـ data loading scenarios

---

## 📝 ملاحظات مهمة

### عند تحديث API Service:

1. احذف inject(HttpClient) القديم
2. extend BaseApiService
3. حدد baseUrl
4. استخدم this.post, this.get, etc. بدلاً من this.http
5. أضف retry و cache config مناسبة

### عند تحديث Component:

1. أضف `private destroyRef = inject(DestroyRef)`
2. أضف `.pipe(takeUntilDestroyed(this.destroyRef))` قبل كل `.subscribe()`
3. احذف console.log statements
4. احذف error toasts (يتم تلقائياً من interceptor)
5. أضف Skeleton Loader في الـ template

### عند اختبار:

1. تحقق من عمل الـ caching (Network tab في DevTools)
2. تحقق من Retry Logic (افصل النت ثم وصّله)
3. تحقق من عدم وجود memory leaks (Components tab في DevTools)
4. تحقق من ظهور الـ error messages بشكل صحيح
5. تحقق من الـ Global Loading Indicator

---

## 🎯 أولويات العمل

### Week 1:
1. تحديث جميع API Services (الأهم)
2. إصلاح Memory Leaks في Main Components (cases, clients, documents, sessions)

### Week 2:
3. إصلاح Memory Leaks في باقي Components
4. إضافة Skeleton Loaders للـ Templates الرئيسية

### Week 3:
5. إضافة Skeleton Loaders لباقي Templates
6. تحسينات إضافية
7. Testing شامل

---

## ✅ Checklist سريع

قبل اعتبار Component "محسّن"، تأكد من:

- [ ] Service يستخدم BaseApiService
- [ ] Service يستخدم caching مناسب
- [ ] Service يستخدم retry logic
- [ ] Component يستخدم takeUntilDestroyed
- [ ] Component لا يحتوي على console.log
- [ ] Component لا يحتوي على error toasts يدوية
- [ ] Template يستخدم Skeleton Loader
- [ ] تم اختبار الـ Component

---

## 🔍 كيفية التحقق من نجاح التحسينات

### 1. Performance:
```
قبل: 3-5 seconds لتحميل القائمة
بعد: 0.5-1 second (مع caching: فوري تقريباً)
```

### 2. Network Requests:
```
قبل: يعيد الطلب في كل مرة
بعد: يستخدم الـ cache لمدة محددة
```

### 3. Memory Usage:
```
قبل: يزيد باستمرار (memory leak)
بعد: ثابت ومستقر
```

### 4. User Experience:
```
قبل: شاشة بيضاء أو spinner بسيط
بعد: Skeleton loader احترافي
```

---

**آخر تحديث:** 2025-01-05
**الحالة:** 🟡 In Progress (40% Complete)

**الملفات المتبقية:** ~15 service + ~15 component
**الوقت المقدر:** 2-3 أسابيع
