import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

// Register Component with phone/email validation
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  checkingPhone = signal(false);
  checkingEmail = signal(false);
  phoneAvailable = signal<boolean | null>(null);
  emailAvailable = signal<boolean | null>(null);

  roles = [
    { value: UserRole.LAWYER, label: 'محامي' },
    { value: UserRole.VIEWER, label: 'مشاهد' },
    { value: UserRole.ASSISTANT, label: 'مساعد قانوني' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.emailAsyncValidator.bind(this)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+2)?(010|011|012|015)\d{8}$/)], [this.phoneAsyncValidator.bind(this)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      city: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  phoneAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value || control.value.length < 11) {
      return of(null);
    }

    this.checkingPhone.set(true);

    return of(control.value).pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(phoneNumber =>
        this.authService.checkPhone(phoneNumber).pipe(
          map(response => {
            this.checkingPhone.set(false);

            if (response.success) {
              const isAvailable = response.data?.isAvailable !== false;
              this.phoneAvailable.set(isAvailable);
              return isAvailable ? null : { phoneTaken: true };
            }

            this.phoneAvailable.set(null);
            return null;
          }),
          catchError(() => {
            this.checkingPhone.set(false);
            this.phoneAvailable.set(null);
            return of(null);
          })
        )
      )
    );
  }

  emailAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value || !control.value.includes('@')) {
      return of(null);
    }

    this.checkingEmail.set(true);

    return of(control.value).pipe(
      debounceTime(800),
      distinctUntilChanged(),
      switchMap(email =>
        this.authService.checkEmail(email).pipe(
          map(response => {
            this.checkingEmail.set(false);

            if (response.success) {
              const isAvailable = response.data?.isAvailable !== false;
              this.emailAvailable.set(isAvailable);
              return isAvailable ? null : { emailTaken: true };
            }

            this.emailAvailable.set(null);
            return null;
          }),
          catchError(() => {
            this.checkingEmail.set(false);
            this.emailAvailable.set(null);
            return of(null);
          })
        )
      )
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { confirmPassword, acceptTerms, ...registerData } = this.registerForm.value;

    console.log('📤 Registering with data:', registerData);

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('❌ Registration error:', err);
        this.error.set(err.error?.message || 'فشل التسجيل. يرجى المحاولة مرة أخرى.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get city() { return this.registerForm.get('city'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }
}
