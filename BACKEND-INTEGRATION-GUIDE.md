# دليل التكامل مع Backend - Smart Lawyer Portal

## ✅ الوضع الحالي

Angular الآن **جاهز تماماً** للتكامل مع الـ Backend الموجود.

---

## 📋 Response Format من Backend (✅ موجود)

### **Login Response:**

```json
{
  "success": true,
  "message": "LoginSuccessful",
  "code": null,
  "data": {
    "firstName": "Ahmed",
    "lastName": "Salem",
    "email": "superadmin@test.local",
    "roleName": "SuperAdmin",
    "phoneNumber": "+201015819700",
    "city": null,
    "token": "eyJhbGci..."
  },
  "errors": null,
  "meta": null,
  "traceId": null,
  "timestamp": "2025-10-28T13:14:03.0897093+00:00",
  "links": null
}
```

**✅ Angular يدعم هذا الـ Format بالكامل!**

---

## 🔐 JWT Token Claims (✅ موجود)

### **Token Payload:**

```json
{
  "nameid": "18228cc5-7582-424c-9de9-72e2ef695ad7",
  "unique_name": "superadmin",
  "email": "superadmin@test.local",
  "DisplayName": "Super Administrator",
  "role": "SuperAdmin",
  "RoleName": "SuperAdmin",
  "permission": "*",
  "nbf": 1761657242,
  "exp": 1764249242,
  "iat": 1761657242,
  "iss": "https://localhost:7230",
  "aud": "MyAudience"
}
```

**✅ Angular يقرأ جميع هذه الـ Claims تلقائياً!**

---

## ⚙️ ما يحدث في Angular:

### **1. عند إرسال Login:**
```typescript
// Request
POST http://smartlawerassistant.runasp.net/api/Auth/login
{
  "emailOrPhone": "01015819700",
  "password": "Ahmed104@#"
}
```

### **2. عند استقبال Response:**

```javascript
✅ Auth response: { success: true, data: {...} }
✅ Token found: Yes
✅ Decoded token payload: { nameid, email, role, ... }
✅ User from token: { id, email, firstName, lastName, role, phone }

// بناء User Object
✅ Login successful! User data:
   - Name: Ahmed Salem
   - Email: superadmin@test.local
   - Role: SuperAdmin
   - Phone: +201015819700

✅ isAuthenticated: true
```

### **3. استخراج البيانات (Priority):**

| البيان | المصدر الأول | المصدر الثاني | Fallback |
|--------|--------------|----------------|----------|
| **firstName** | response.data.firstName | token.DisplayName | 'مستخدم' |
| **lastName** | response.data.lastName | - | '' |
| **email** | response.data.email | token.email | '' |
| **phone** | response.data.phoneNumber | - | '' |
| **role** | response.data.roleName | token.role/RoleName | 'client' |
| **id** | token.nameid | - | '' |

---

## 🎯 Roles المدعومة:

Angular يتعرف تلقائياً على:

| Backend Role | Angular UserRole | العرض بالعربية |
|--------------|------------------|----------------|
| `SuperAdmin` | SUPER_ADMIN | مدير عام |
| `admin` | ADMIN | مدير النظام |
| `lawyer` | LAWYER | محامي |
| `client` | CLIENT | عميل |
| `assistant` | ASSISTANT | مساعد |

---

## 🚨 المطلوب من Backend: CORS فقط!

### **في Program.cs:**

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// ========== إضافة CORS (المطلوب الوحيد!) ==========
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ... باقي الـ services

var app = builder.Build();

// ========== استخدام CORS (قبل Authentication) ==========
app.UseCors();  // ✅ مهم جداً

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

---

## 📡 Endpoints المتوقعة:

### **✅ Login (موجود):**
```
POST /api/Auth/login
Body: { emailOrPhone, password }
Response: { success, data: { token, firstName, lastName, email, phoneNumber, roleName } }
```

### **🔜 Register (متوقع):**
```
POST /api/Auth/register
Body: { email, password, firstName, lastName, phone, role }
Response: نفس format الـ login
```

### **🔜 Refresh Token (متوقع):**
```
POST /api/Auth/refresh
Body: { refreshToken }
Response: { token, refreshToken }
```

### **🔜 Logout (متوقع):**
```
POST /api/Auth/logout
Response: { success, message }
```

---

## 🧪 اختبار التكامل:

### **خطوة 1: أضف CORS في Backend**
```csharp
builder.Services.AddCors(...);
app.UseCors();
```

### **خطوة 2: أعد تشغيل Backend**

### **خطوة 3: جرب في Postman**
```
POST http://smartlawerassistant.runasp.net/api/Auth/login

Headers:
Content-Type: application/json
Origin: http://localhost:4200

Body:
{
  "emailOrPhone": "01015819700",
  "password": "Ahmed104@#"
}
```

**Response Headers يجب أن يحتوي على:**
```
Access-Control-Allow-Origin: *
```

### **خطوة 4: جرب من Angular**
1. افتح `http://localhost:4200`
2. اذهب لـ `/auth/login`
3. أدخل البيانات:
   - Email/Phone: `01015819700`
   - Password: `Ahmed104@#`
4. اضغط Login
5. ستنتقل تلقائياً إلى Dashboard
6. ستشوف اسمك "Ahmed Salem" في الـ Header

---

## 📊 Console Logs المتوقعة (بعد CORS):

```javascript
✅ Auth response: { success: true, message: "LoginSuccessful", data: {...} }
Available cookies: {}
Token found: ✅ Yes
Decoded token payload: { nameid, email, role, DisplayName, ... }
User from token: { id: "18228...", email: "superadmin@...", ... }

✅ Login successful! User data:
   - Name: Ahmed Salem
   - Email: superadmin@test.local
   - Role: SuperAdmin
   - Phone: +201015819700

✅ isAuthenticated: true

Login successful, response: {...}
Navigating to dashboard...
Navigation success: true
```

---

## 🎨 ما سيظهر في UI بعد Login:

### **في Header:**
```
مرحباً، Ahmed Salem
```

### **User Avatar:**
```
AS  ← الأحرف الأولى
```

### **User Menu (عند النقر على Avatar):**
```
┌─────────────────────────┐
│  AS  Ahmed Salem        │
│      superadmin@test..  │
│      مدير عام           │
├─────────────────────────┤
│ 👤 الملف الشخصي        │
│ ⚙️ الإعدادات            │
│ 🚪 تسجيل الخروج         │
└─────────────────────────┘
```

---

## ✅ Checklist للـ Backend Developer:

- [ ] فتح `Program.cs`
- [ ] إضافة `builder.Services.AddCors(...)` بعد `WebApplication.CreateBuilder`
- [ ] إضافة `app.UseCors()` قبل `UseAuthentication()`
- [ ] حفظ الملف
- [ ] إعادة تشغيل Backend (Ctrl+F5)
- [ ] اختبار في Postman مع Header: `Origin: http://localhost:4200`
- [ ] التحقق من Response Headers: `Access-Control-Allow-Origin: *`
- [ ] اختبار Login من Angular

---

## 🔧 نسخة Code جاهزة للـ Copy:

```csharp
// في Program.cs - بعد var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// في Program.cs - بعد var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
```

---

## 📞 Support:

إذا CORS لا يزال لا يعمل بعد التعديلات، جرب:

### **Alternative CORS Config:**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowAll");
```

---

**🎯 الخلاصة:**
- ✅ Angular: جاهز 100%
- ✅ Response Format: متطابق
- ✅ JWT Claims: مدعوم كامل
- ❌ CORS: **المطلوب الوحيد من Backend**

**بمجرد إضافة CORS، كل شيء سيعمل تلقائياً!** 🚀
