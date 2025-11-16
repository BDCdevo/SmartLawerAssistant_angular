import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  profileForm: FormGroup;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  currentUser = this.authService.currentUser;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      // Add more fields as needed
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.error.set(null);

    // First, try to get from current user
    if (this.currentUser) {
      // Show data immediately if available
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        phone: this.currentUser.phone
      });
      // Don't show loading if we already have data
      this.loading.set(false);
    } else {
      // Show loading only if no data available
      this.loading.set(true);
    }

    // Then fetch from API to get latest data
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.loading.set(false);
        console.log('✅ Profile API Response:', response);

        const data = response.data || response;
        console.log('📋 Profile Data:', data);

        const profileData = {
          firstName: data.firstName || data.first_name || '',
          lastName: data.lastName || data.last_name || '',
          email: data.email || '',
          phone: data.phoneNumber || data.phone || ''
        };

        console.log('✍️ Setting form values:', profileData);
        this.profileForm.patchValue(profileData);
      },
      error: (err) => {
        this.loading.set(false);
        // Only show error if we don't have any data
        if (!this.currentUser) {
          this.error.set('فشل تحميل بيانات الملف الشخصي');
        }
        console.error('❌ Load profile error:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.success.set('تم تحديث الملف الشخصي بنجاح');
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'فشل تحديث الملف الشخصي');
        console.error('Update profile error:', err);
      }
    });
  }

  get firstName() {
    return this.profileForm.get('firstName');
  }

  get lastName() {
    return this.profileForm.get('lastName');
  }

  get email() {
    return this.profileForm.get('email');
  }

  get phone() {
    return this.profileForm.get('phone');
  }
}
