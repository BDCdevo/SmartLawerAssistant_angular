import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);
  isMobile = signal(false);

  menuItems = [
    { icon: '📊', label: 'لوحة التحكم', route: '/dashboard' },
    { icon: '⚖️', label: 'القضايا', route: '/cases' },
    { icon: '👥', label: 'العملاء', route: '/clients' },
    { icon: '📄', label: 'المستندات', route: '/documents' },
    { icon: '🤖', label: 'المساعد الذكي', route: '/ai-assistant' },
    { icon: '📅', label: 'المواعيد', route: '/appointments' },
    { icon: '📈', label: 'التقارير', route: '/reports' }
  ];

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile.set(window.innerWidth <= 768);
    // إغلاق الـ sidebar تلقائياً عند تغيير الحجم للموبايل
    if (this.isMobile() && this.sidebarOpen()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  logout(): void {
    this.authService.logout();
  }

  userInitials(): string {
    const user = this.currentUser();
    if (!user) return '؟';

    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';

    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    } else if (firstInitial) {
      return firstInitial.toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return '؟';
  }

  userFullName(): string {
    const user = this.currentUser();
    if (!user) return 'مستخدم';

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'مستخدم';
  }

  userEmail(): string {
    const user = this.currentUser();
    return user?.email || '';
  }

  userRole(): string {
    const user = this.currentUser();
    if (!user || !user.role) return '';

    const roleLabels: Record<string, string> = {
      'superadmin': 'مدير عام',
      'admin': 'مدير النظام',
      'lawyer': 'محامي',
      'client': 'عميل',
      'assistant': 'مساعد'
    };

    return roleLabels[user.role.toLowerCase()] || user.role;
  }

  onSidebarEnter(): void {
    // فقط على الديسكتوب (hover)
    if (!this.isMobile()) {
      this.sidebarOpen.set(true);
    }
  }

  onSidebarLeave(): void {
    // فقط على الديسكتوب (hover) - على الموبايل يُغلق بالـ overlay
    if (!this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  closeSidebarOnMobile(): void {
    // إغلاق الـ sidebar على الموبايل فقط
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }
}
