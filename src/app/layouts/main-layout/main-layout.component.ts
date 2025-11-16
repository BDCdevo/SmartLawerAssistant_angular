import { Component, inject, signal, HostListener, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SignalRService } from '../../core/services/signalr.service';
import { RbacService } from '../../core/services/rbac.service';
import { ThemeService } from '../../core/services/theme.service';
import { User, UserRole } from '../../core/models';
import { GlobalLoadingComponent } from '../../shared/components/global-loading/global-loading.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, GlobalLoadingComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private signalRService = inject(SignalRService);
  private rbacService = inject(RbacService);
  public themeService = inject(ThemeService);

  currentUser = signal<User | null>(null);
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);
  isMobile = signal(false);

  // Logo path - using same logo for both themes
  logoPath = 'logo.png';

  // All possible menu items with their required roles
  private allMenuItems = [
    { icon: '📊', label: 'لوحة التحكم', route: '/dashboard', roles: ['all'] },
    { icon: '⚖️', label: 'القضايا', route: '/cases', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER, UserRole.ASSISTANT] },
    { icon: '👥', label: 'العملاء', route: '/clients', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER, UserRole.ASSISTANT] },
    { icon: '📄', label: 'المستندات', route: '/documents', roles: ['all'] },
    { icon: '🏛️', label: 'المحاكم', route: '/courts', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER] },
    { icon: '⚖️', label: 'أنواع المحاكم', route: '/court-types', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER] },
    { icon: '📅', label: 'الجلسات', route: '/sessions', roles: ['all'] },
    { icon: '🔍', label: 'تحليل القضايا AI', route: '/ai-case-analysis', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER] },
    { icon: '💬', label: 'الشات القانوني', route: '/legal-chat', roles: ['all'] },
    { icon: '⏰', label: 'المواعيد', route: '/appointments', roles: ['all'] },
    { icon: '📈', label: 'التقارير', route: '/reports', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { icon: '👨‍⚖️', label: 'تعيينات القضايا', route: '/case-assignments', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAWYER] },
    { icon: '🤖', label: 'إدارة نماذج AI', route: '/ai-model-settings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { icon: '🌍', label: 'الجنسيات', route: '/nationalities', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
  ];

  // Computed signal that filters menu items based on user role
  menuItems = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.allMenuItems.filter(item => {
      // If roles include 'all', everyone can see it
      if (item.roles.includes('all')) return true;

      // Check if user's role is in the allowed roles
      return item.roles.includes(user.role);
    });
  });

  ngOnInit() {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);

      // Initialize roles from backend when user logs in
      if (user) {
        console.log('👤 User logged in, initializing RBAC...');
        this.rbacService.initializeRoles().subscribe({
          next: (response) => {
            console.log('✅ RBAC initialized:', response);
          },
          error: (err) => {
            console.warn('⚠️ RBAC initialization failed (using fallback):', err);
          }
        });

        // Start SignalR connection
        this.signalRService.startConnection();
      }
    });

    this.checkScreenSize();
  }

  ngOnDestroy() {
    // Stop SignalR connection when component is destroyed
    this.signalRService.stopConnection();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // إغلاق user menu عند الضغط خارجه
    if (this.userMenuOpen() && !target.closest('.user-menu-wrap')) {
      this.userMenuOpen.set(false);
    }
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
    // Stop SignalR connection before logout
    console.log('🚪 User initiated logout');
    this.signalRService.stopConnection();

    // Close user menu
    this.userMenuOpen.set(false);

    // Perform logout
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
      'viewer': 'مشاهد',
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
