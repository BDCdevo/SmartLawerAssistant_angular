# دليل استخدام JWT Token في النظام

## 📋 نظرة عامة

تم تحديث نظام المصادقة ليدعم قراءة بيانات المستخدم من JWT Token بشكل تلقائي. النظام الآن يدعم:

- ✅ فك تشفير JWT Token تلقائياً
- ✅ استخراج بيانات المستخدم من Token Claims
- ✅ دعم أسماء Claims المختلفة (ASP.NET, Auth0, Firebase, etc.)
- ✅ التحقق من صلاحية Token
- ✅ عرض البيانات في الواجهة بشكل صحيح

---

## 🔧 بنية JWT Token المدعومة

النظام يدعم استخراج البيانات من Claims التالية:

### **User ID:**
- `sub`
- `userId`
- `id`
- `nameid`
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`

### **Email:**
- `email`
- `emailaddress`
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`

### **الاسم الأول:**
- `firstName`
- `given_name`
- `FirstName`

### **الاسم الأخير:**
- `lastName`
- `family_name`
- `LastName`

### **الاسم الكامل:**
- `name`
- `Name`
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`

### **الدور (Role):**
- `role`
- `Role`
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`

### **رقم الهاتف:**
- `phone`
- `phoneNumber`
- `PhoneNumber`

### **الصورة الشخصية:**
- `avatar`
- `picture`

---

## 🔐 مثال على JWT Payload

```json
{
  "sub": "user123",
  "email": "ahmed@example.com",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "lawyer",
  "phone": "+201234567890",
  "exp": 1735689600,
  "iat": 1735603200
}
```

أو بصيغة ASP.NET Identity:

```json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "user123",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "ahmed@example.com",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "lawyer",
  "given_name": "أحمد",
  "family_name": "محمد",
  "exp": 1735689600,
  "iat": 1735603200
}
```

---

## 📝 استخدام النظام

### **1. Login Response Format**

يجب أن يكون الـ response من API بأحد الصيغ التالية:

```typescript
// Option 1: Token + User Object
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user123",
    "email": "ahmed@example.com",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "lawyer",
    "phone": "+201234567890"
  }
}

// Option 2: Token Only (user data will be extracted from token)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here"
}

// Option 3: Nested data
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": { ... }
  }
}
```

### **2. أولوية قراءة البيانات**

النظام يقرأ البيانات بالترتيب التالي:
1. **response.user** - إذا كان موجود في الـ response
2. **Token Claims** - استخراج من الـ JWT Token
3. **Fallback** - قيم افتراضية

---

## 🛠️ الدوال المتاحة

### **في AuthService:**

```typescript
// التحقق من صلاحية Token
authService.isTokenValid(): boolean

// الحصول على تاريخ انتهاء Token
authService.getTokenExpirationDate(): Date | null

// إعادة تحميل بيانات المستخدم من Token
authService.reloadUserFromToken(): void

// الحصول على المستخدم الحالي
authService.currentUser: User | null
```

### **في JwtHelper:**

```typescript
// فك تشفير Token
JwtHelper.decode(token: string): DecodedToken | null

// التحقق من انتهاء صلاحية Token
JwtHelper.isTokenExpired(token: string): boolean

// استخراج User ID
JwtHelper.getUserId(token: string): string | null

// استخراج Email
JwtHelper.getEmail(token: string): string | null

// استخراج Role
JwtHelper.getRole(token: string): string | null
```

---

## 🎨 عرض البيانات في UI

### **في MainLayout (Header):**

```html
<!-- Avatar with initials -->
<button class="user-avatar">
  {{ userInitials() }}
</button>

<!-- User Menu -->
<div class="user-menu">
  <div class="user-name">{{ userFullName() }}</div>
  <div class="user-email">{{ userEmail() }}</div>
  <div class="user-role">{{ userRole() }}</div>
</div>
```

### **الدوال المساعدة:**

```typescript
// الحصول على الأحرف الأولى من الاسم
userInitials(): string  // مثال: "أم" من "أحمد محمد"

// الحصول على الاسم الكامل
userFullName(): string  // مثال: "أحمد محمد"

// الحصول على البريد الإلكتروني
userEmail(): string

// الحصول على الدور بالعربية
userRole(): string  // مثال: "محامي"
```

---

## 🔄 معالجة الحالات الخاصة

### **1. عدم وجود اسم في Token:**
- النظام يستخدم `email.split('@')[0]` كاسم أول
- الاسم الأخير يكون فارغ

### **2. Token منتهي الصلاحية:**
- النظام يتحقق من exp claim
- يقوم بعمل logout تلقائي

### **3. Token غير صالح:**
- يتم عرض قيم افتراضية: "مستخدم" + "؟"
- يُطلب من المستخدم تسجيل الدخول مرة أخرى

### **4. إعادة تحميل الصفحة:**
- النظام يقرأ Token من localStorage
- يفك تشفيره تلقائياً
- يستعيد بيانات المستخدم

---

## 🐛 التشخيص والـ Debug

### **في Console:**

```javascript
// عرض Token الحالي
localStorage.getItem('auth_token')

// عرض بيانات المستخدم
localStorage.getItem('current_user')

// فك تشفير Token يدوياً
const token = localStorage.getItem('auth_token');
console.log(JSON.parse(atob(token.split('.')[1])));
```

### **Log Messages:**

النظام يطبع الرسائل التالية في Console:

- ✅ `Auth response:` - الـ response من API
- ✅ `User from token:` - البيانات المستخرجة من Token
- ✅ `Decoded token payload:` - محتوى Token
- ✅ `Final user set:` - البيانات النهائية للمستخدم
- ⚠️ `Token is expired` - Token منتهي
- ⚠️ `Invalid token format` - صيغة Token خاطئة
- ❌ `Error decoding token:` - خطأ في فك التشفير

---

## ✨ المميزات الجديدة

1. **دعم متعدد لـ Claims:** يعمل مع ASP.NET, Auth0, Firebase, etc.
2. **تحقق تلقائي:** يتحقق من صلاحية Token
3. **Fallback ذكي:** يستخدم Email كاسم إذا لم يكن متوفر
4. **تخزين محلي:** يحفظ البيانات للاستخدام بعد إعادة التحميل
5. **عرض متقدم:** يعرض الدور بالعربية في UI
6. **معالجة أخطاء:** يتعامل مع جميع الحالات الخاصة

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من Console للـ error messages
2. تأكد من صيغة Token الصادر من API
3. تحقق من Claims الموجودة في Token
4. استخدم JwtHelper للتشخيص

---

**تم التحديث:** 2024-11-01
**الإصدار:** 2.0
