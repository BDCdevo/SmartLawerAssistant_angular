# ⚠️ إصلاح CORS المطلوب على Backend

## 🔴 المشكلة الحالية:

```
Access to XMLHttpRequest at 'http://smartlawerassistant.runasp.net/api/Auth/login'
from origin 'http://localhost:4205' has been blocked by CORS policy
```

**الخطأ:** Backend لا يسمح بطلبات من Angular Frontend.

---

## ✅ الحل المطلوب على Backend:

### **في Program.cs أو Startup.cs:**

#### **1. إضافة CORS Policy:**

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "http://localhost:4201",
            "http://localhost:4205",  // Add all development ports
            "http://localhost:4300"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();  // IMPORTANT for cookies
    });
});

// Or allow all origins (for development only - NOT for production!)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

#### **2. استخدام CORS في Middleware Pipeline:**

```csharp
var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: UseCors must be BEFORE UseAuthentication and UseAuthorization
app.UseCors("AllowAngularApp");  // أو app.UseCors() للـ default policy

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

---

## 🎯 CORS Configuration Options:

### **Option 1: Development (السماح لجميع Origins)**
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin => true)  // Allow any origin
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

### **Option 2: Specific Origins (Production)**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins(
            "https://yourdomain.com",
            "https://app.yourdomain.com"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
```

### **Option 3: By Environment**
```csharp
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
    else
    {
        options.AddPolicy("Production", policy =>
        {
            policy.WithOrigins("https://yourdomain.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    }
});
```

---

## 🔐 إعدادات Cookie (بعد إصلاح CORS):

### **عند تفعيل Cookies:**

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var user = await _authService.ValidateUser(request.EmailOrPhone, request.Password);
    if (user == null)
        return Unauthorized(new { message = "بيانات الدخول غير صحيحة" });

    var token = _jwtService.GenerateToken(user);

    // Set token in cookie (after CORS is fixed)
    var cookieOptions = new CookieOptions
    {
        HttpOnly = false,  // false حتى Angular تقدر تقرأه (للتطوير)
        Secure = false,    // false للتطوير على HTTP
        SameSite = SameSiteMode.Lax,
        Path = "/",
        Expires = DateTime.UtcNow.AddHours(24)
    };

    Response.Cookies.Append("auth_token", token, cookieOptions);

    // Return response
    return Ok(new
    {
        success = true,
        message = "LoginSuccessful",
        data = new
        {
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            token = token  // أيضاً في Body كـ fallback
        }
    });
}
```

---

## 📋 Checklist للتحقق:

- [ ] إضافة `builder.Services.AddCors()`
- [ ] إضافة `app.UseCors()` قبل `UseAuthentication()`
- [ ] السماح بـ Origins (localhost:4200, 4205, etc.)
- [ ] تفعيل `AllowCredentials()` إذا استخدمت Cookies
- [ ] إعادة تشغيل Backend
- [ ] اختبار Login من Postman
- [ ] اختبار Login من Angular

---

## 🧪 اختبار CORS:

### **في Postman:**

1. أضف Header:
```
Origin: http://localhost:4205
```

2. أرسل Request

3. تحقق من Response Headers:
```
Access-Control-Allow-Origin: http://localhost:4205
Access-Control-Allow-Credentials: true
```

### **في Browser:**

افتح Console وجرب:

```javascript
fetch('http://smartlawerassistant.runasp.net/api/Auth/login', {
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
    'Origin': 'http://localhost:4205'
  }
})
.then(r => console.log('Preflight Response:', r))
.catch(e => console.error('Preflight Error:', e));
```

---

## 🚨 حل مؤقت (Development Only):

إذا كنت تستخدم IIS Express أو Kestrel:

### **في launchSettings.json:**

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "launchBrowser": true,
      "launchUrl": "swagger",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_CORS_ALLOW_ANY_ORIGIN": "true"  // Temporary
      },
      "applicationUrl": "http://localhost:5000"
    }
  }
}
```

---

## 📞 ما يجب عمله الآن:

### **الخيار 1: إصلاح Backend CORS (الأفضل)**
1. افتح Backend Project
2. أضف CORS configuration (الكود أعلاه)
3. أعد تشغيل Backend
4. جرب Login

### **الخيار 2: استخدام Proxy (مؤقت)**
أضف في Angular:
```json
// proxy.conf.json
{
  "/api": {
    "target": "http://smartlawerassistant.runasp.net",
    "secure": false,
    "changeOrigin": true
  }
}
```

ثم شغل:
```bash
ng serve --proxy-config proxy.conf.json
```

---

## ⏭️ بعد إصلاح CORS:

1. فعّل `withCredentials` مرة أخرى في credentials.interceptor.ts
2. Backend يحفظ Token في Cookie
3. Angular تقرأه تلقائياً
4. كل شيء يعمل بسلاسة

---

**الآن Login معطل بسبب CORS. يجب إصلاح Backend أولاً!** ⚠️
