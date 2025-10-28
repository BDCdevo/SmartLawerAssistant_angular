# دليل إعداد المصادقة بالـ Cookies

## 📋 نظرة عامة

تم تحديث النظام ليقرأ JWT Token من **Cookies** بدلاً من **localStorage**. هذا أكثر أماناً لأن:

✅ **HttpOnly Cookies** لا يمكن الوصول إليها من JavaScript (حماية من XSS attacks)
✅ **Secure Cookies** تُرسل فقط عبر HTTPS
✅ **SameSite** يحمي من CSRF attacks
✅ لا حاجة لتخزين Token في localStorage

---

## 🔧 إعداد Backend (ASP.NET Core)

### **1. تعديل Login/Register Response**

في `AuthController.cs`:

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // Validate credentials
    var user = await _authService.ValidateUser(request.EmailOrPhone, request.Password);
    if (user == null)
    {
        return Unauthorized(new { message = "بيانات الدخول غير صحيحة" });
    }

    // Generate JWT Token
    var token = _jwtService.GenerateToken(user);
    var refreshToken = _jwtService.GenerateRefreshToken();

    // Set token in HttpOnly cookie
    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,        // Cannot be accessed by JavaScript
        Secure = true,          // Only sent over HTTPS
        SameSite = SameSiteMode.Strict,  // CSRF protection
        Expires = DateTime.UtcNow.AddHours(24),
        Path = "/"
    };

    Response.Cookies.Append("auth_token", token, cookieOptions);

    // Set refresh token in HttpOnly cookie
    var refreshCookieOptions = new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTime.UtcNow.AddDays(7),
        Path = "/"
    };

    Response.Cookies.Append("refresh_token", refreshToken, refreshCookieOptions);

    // Return success response (without token in body)
    return Ok(new
    {
        success = true,
        message = "تم تسجيل الدخول بنجاح",
        user = new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            role = user.Role,
            phone = user.PhoneNumber
        }
    });
}
```

### **2. تعديل Logout**

```csharp
[HttpPost("logout")]
public IActionResult Logout()
{
    // Delete auth cookies
    Response.Cookies.Delete("auth_token");
    Response.Cookies.Delete("refresh_token");

    return Ok(new { message = "تم تسجيل الخروج بنجاح" });
}
```

### **3. تعديل JWT Configuration**

في `Program.cs` أو `Startup.cs`:

```csharp
// Add CORS configuration to allow credentials
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();  // IMPORTANT: Allow credentials (cookies)
    });
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        // Read token from cookie
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Try to get token from cookie
                var token = context.Request.Cookies["auth_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
```

### **4. استخدام CORS Policy**

```csharp
var app = builder.Build();

// Use CORS (must be before UseAuthentication)
app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
```

---

## 🌐 إعداد Angular

### **1. تفعيل withCredentials في HTTP Requests**

في `app.config.ts` أو `main.ts`:

```typescript
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch()
    ),
    // ... other providers
  ]
};
```

### **2. إنشاء HTTP Interceptor**

في `auth.interceptor.ts`:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Add withCredentials to all requests
  const clonedRequest = req.clone({
    withCredentials: true  // IMPORTANT: Send cookies with requests
  });

  return next(clonedRequest);
};
```

### **3. تحديث Environment**

في `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',  // Backend URL
  withCredentials: true  // Enable cookies
};
```

---

## 🔐 JWT Token Claims المطلوبة

تأكد من أن JWT Token يحتوي على Claims التالية:

```json
{
  "sub": "user-id-123",                    // User ID
  "email": "ahmed@example.com",            // Email
  "firstName": "أحمد",                     // First Name
  "lastName": "محمد",                      // Last Name
  "role": "lawyer",                        // Role
  "phone": "+201234567890",                // Phone (optional)
  "exp": 1735689600,                       // Expiration
  "iat": 1735603200,                       // Issued At
  "iss": "SmartLawyerAPI",                 // Issuer
  "aud": "SmartLawyerApp"                  // Audience
}
```

أو بصيغة ASP.NET Identity Claims:

```json
{
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "user-id-123",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "ahmed@example.com",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "lawyer",
  "given_name": "أحمد",
  "family_name": "محمد",
  "exp": 1735689600,
  "iat": 1735603200
}
```

---

## 🛠️ اختبار الإعداد

### **1. في Browser Console:**

```javascript
// عرض جميع الـ Cookies
document.cookie

// عرض Cookies من Angular
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

const authService = inject(AuthService);
console.log('All Cookies:', authService.getAllCookies());
console.log('Token:', authService.getToken());
console.log('Current User:', authService.currentUser);
console.log('Is Authenticated:', authService.isAuthenticated);
```

### **2. في Network Tab:**

افتح Developer Tools → Network Tab وشوف:

✅ **Login Request:**
- Response Headers يجب أن يحتوي على `Set-Cookie`
- مثال: `Set-Cookie: auth_token=eyJhbG...; Path=/; HttpOnly; Secure; SameSite=Strict`

✅ **Subsequent Requests:**
- Request Headers يجب أن يحتوي على `Cookie`
- مثال: `Cookie: auth_token=eyJhbG...`

### **3. في Application Tab:**

Developer Tools → Application → Cookies → localhost

يجب أن تشوف:
- ✅ `auth_token` - HttpOnly ✓, Secure ✓, SameSite: Strict
- ✅ `refresh_token` - HttpOnly ✓, Secure ✓, SameSite: Strict

---

## 🐛 حل المشاكل الشائعة

### **Problem 1: Cookie لا يظهر في Browser**

**الحل:**
```csharp
// تأكد من إعدادات Cookie الصحيحة
var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    Secure = false,  // false للتطوير على HTTP
    SameSite = SameSiteMode.Lax,  // Lax للتطوير
    Path = "/"
};
```

### **Problem 2: CORS Error**

**الحل:**
```csharp
// في Backend
app.UseCors(policy => policy
    .WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials()  // IMPORTANT!
);
```

```typescript
// في Angular - HTTP Interceptor
const clonedRequest = req.clone({
  withCredentials: true  // IMPORTANT!
});
```

### **Problem 3: Token لا يُرسل مع Requests**

**الحل:**
- تأكد من `withCredentials: true` في Angular
- تأكد من `AllowCredentials()` في Backend CORS
- تأكد من Domain و Path صحيحين

### **Problem 4: HttpOnly Cookie لا يظهر في document.cookie**

**هذا طبيعي!** HttpOnly cookies لا تظهر في JavaScript.

**للتحقق:**
- افتح Developer Tools → Application → Cookies
- أو استخدم Network Tab لرؤية Cookie في Headers

---

## 📊 مقارنة: Cookies vs localStorage

| Feature | Cookies (HttpOnly) | localStorage |
|---------|-------------------|--------------|
| **XSS Protection** | ✅ محمي | ❌ غير محمي |
| **CSRF Protection** | ✅ مع SameSite | ❌ |
| **Automatic Sending** | ✅ نعم | ❌ يدوي |
| **Size Limit** | 4KB | 5-10MB |
| **Server Access** | ✅ نعم | ❌ لا |
| **Client Access** | ❌ HttpOnly فقط | ✅ نعم |
| **Expiration** | ✅ تلقائي | ❌ يدوي |

---

## ✅ Checklist للـ Production

- [ ] استخدم `Secure: true` (HTTPS only)
- [ ] استخدم `HttpOnly: true`
- [ ] استخدم `SameSite: Strict` أو `Lax`
- [ ] حدد `Expires` مناسب
- [ ] فعّل CORS بشكل صحيح مع `AllowCredentials`
- [ ] استخدم HTTPS في Production
- [ ] اختبر على جميع Browsers
- [ ] راجع Security Headers

---

## 📞 الدعم والمساعدة

**الأسماء المدعومة للـ Cookies:**

Frontend يبحث عن الأسماء التالية تلقائياً:
- `auth_token` (مفضل)
- `token`
- `jwt`
- `access_token`
- `accessToken`

**Refresh Token:**
- `refresh_token` (مفضل)
- `refreshToken`
- `refresh`

---

**تم التحديث:** 2024-11-01
**الإصدار:** 2.0 (Cookie-based Authentication)
