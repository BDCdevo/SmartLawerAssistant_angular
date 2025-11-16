import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

enum ForgetPasswordStep {
  ENTER_PHONE = 1,
  VERIFY_OTP = 2,
  RESET_PASSWORD = 3
}

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent {
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  showModal = signal(false);
  currentStep = signal(ForgetPasswordStep.ENTER_PHONE);
  loading = signal(false);

  phoneNumber = signal('');
  otpCode = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  ForgetPasswordStep = ForgetPasswordStep;

  openModal() {
    this.showModal.set(true);
    this.resetForm();
  }

  closeModal() {
    this.showModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.currentStep.set(ForgetPasswordStep.ENTER_PHONE);
    this.phoneNumber.set('');
    this.otpCode.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  sendOTP() {
    const phone = this.phoneNumber();

    if (!phone || phone.length < 11) {
      this.toastr.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    this.loading.set(true);

    this.authService.forgetPassword(phone).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم إرسال رمز التحقق إلى هاتفك');
          this.currentStep.set(ForgetPasswordStep.VERIFY_OTP);
        } else {
          this.toastr.error(response.message || 'فشل إرسال رمز التحقق');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error sending OTP:', err);
        this.toastr.error('حدث خطأ أثناء إرسال رمز التحقق');
        this.loading.set(false);
      }
    });
  }

  verifyOTP() {
    const phone = this.phoneNumber();
    const otp = this.otpCode();

    if (!otp || otp.length !== 4) {
      this.toastr.error('يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    this.loading.set(true);

    this.authService.verifyForgetPasswordOtp(phone, otp).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم التحقق من الرمز بنجاح');
          this.currentStep.set(ForgetPasswordStep.RESET_PASSWORD);
        } else {
          this.toastr.error(response.message || 'رمز التحقق غير صحيح');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error verifying OTP:', err);
        this.toastr.error('رمز التحقق غير صحيح');
        this.loading.set(false);
      }
    });
  }

  resetPassword() {
    const phone = this.phoneNumber();
    const password = this.newPassword();
    const confirm = this.confirmPassword();

    if (!password || password.length < 6) {
      this.toastr.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirm) {
      this.toastr.error('كلمات المرور غير متطابقة');
      return;
    }

    this.loading.set(true);

    this.authService.resetPassword(phone, password).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم تغيير كلمة المرور بنجاح');
          this.closeModal();
        } else {
          this.toastr.error(response.message || 'فشل تغيير كلمة المرور');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        this.toastr.error('حدث خطأ أثناء تغيير كلمة المرور');
        this.loading.set(false);
      }
    });
  }

  goBack() {
    if (this.currentStep() === ForgetPasswordStep.VERIFY_OTP) {
      this.currentStep.set(ForgetPasswordStep.ENTER_PHONE);
      this.otpCode.set('');
    } else if (this.currentStep() === ForgetPasswordStep.RESET_PASSWORD) {
      this.currentStep.set(ForgetPasswordStep.VERIFY_OTP);
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
  }
}
