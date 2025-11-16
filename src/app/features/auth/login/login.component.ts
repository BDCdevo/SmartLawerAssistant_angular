import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ForgetPasswordComponent } from '../forget-password/forget-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ForgetPasswordComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  @ViewChild(ForgetPasswordComponent) forgetPasswordComponent!: ForgetPasswordComponent;

  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  isEmail(value: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  }

  isPhone(value: string): boolean {
    const phonePattern = /^[\d\s\+\-\(\)]+$/;
    return phonePattern.test(value) && value.replace(/\D/g, '').length >= 10;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Trim whitespace from inputs
    const emailOrPhone = this.loginForm.value.emailOrPhone?.trim();
    const password = this.loginForm.value.password?.trim();

    this.authService.login({ emailOrPhone, password }).subscribe({
      next: (response) => {
        this.loading.set(false);
        // Navigate to dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 100);
      },
      error: (err) => {
        // Error already shown by interceptor, but set custom message for login
        let errorMessage = 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';

        if (err.status === 0) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من أن السرفر يعمل على المنفذ 5210';
        } else if (err.status === 401 || err.status === 400) {
          errorMessage = 'البريد الإلكتروني/الهاتف أو كلمة المرور غير صحيحة';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  get emailOrPhone() {
    return this.loginForm.get('emailOrPhone');
  }

  get password() {
    return this.loginForm.get('password');
  }

  openForgetPassword() {
    this.forgetPasswordComponent?.openModal();
  }
}
