import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

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

    const { emailOrPhone, password } = this.loginForm.value;

    this.authService.login({ emailOrPhone, password }).subscribe({
      next: (response) => {
        console.log('Login successful, response:', response);
        console.log('Navigating to dashboard...');
        this.loading.set(false);

        // Use setTimeout to ensure navigation happens after all processing
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(
            (success) => console.log('Navigation success:', success),
            (error) => console.error('Navigation error:', error)
          );
        }, 100);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error.set(err.error?.message || 'Login failed. Please try again.');
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
}
