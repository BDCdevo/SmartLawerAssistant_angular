import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  passwordForm: FormGroup;
  notificationForm: FormGroup;

  savingPassword = signal(false);
  savingNotifications = signal(false);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  notificationSuccess = signal<string | null>(null);

  // Notification settings
  emailNotifications = signal(true);
  smsNotifications = signal(false);
  caseUpdates = signal(true);
  appointmentReminders = signal(true);
  documentAlerts = signal(true);

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      caseUpdates: [true],
      appointmentReminders: [true],
      documentAlerts: [true]
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    // Simulate API call (replace with actual API call)
    setTimeout(() => {
      this.savingPassword.set(false);
      this.passwordSuccess.set('تم تغيير كلمة المرور بنجاح');
      this.passwordForm.reset();
      setTimeout(() => this.passwordSuccess.set(null), 3000);
    }, 1000);
  }

  onNotificationSubmit(): void {
    this.savingNotifications.set(true);
    this.notificationSuccess.set(null);

    // Update signal values
    this.emailNotifications.set(this.notificationForm.value.emailNotifications);
    this.smsNotifications.set(this.notificationForm.value.smsNotifications);
    this.caseUpdates.set(this.notificationForm.value.caseUpdates);
    this.appointmentReminders.set(this.notificationForm.value.appointmentReminders);
    this.documentAlerts.set(this.notificationForm.value.documentAlerts);

    // Simulate API call (replace with actual API call)
    setTimeout(() => {
      this.savingNotifications.set(false);
      this.notificationSuccess.set('تم حفظ إعدادات الإشعارات بنجاح');
      setTimeout(() => this.notificationSuccess.set(null), 3000);
    }, 1000);
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }
}
