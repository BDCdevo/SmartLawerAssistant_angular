import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService, DashboardStatistics, RecentActivity } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);

  stats = signal<DashboardStatistics>({
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    pendingCases: 0,
    totalClients: 0,
    totalDocuments: 0,
    upcomingHearings: 0,
    recentActivities: [],
    casesByStatus: [],
    casesByPriority: [],
    monthlyStats: []
  });

  recentActivities = signal<RecentActivity[]>([]);

  // Typewriter animation
  logoPath = 'logo.png';
  typedText = signal('');
  private currentPhraseIndex = 0;
  private currentCharIndex = 0;
  private isDeleting = false;
  private typingSpeed = 100;
  private deletingSpeed = 50;
  private pauseBeforeDelete = 2000;
  private pauseBeforeNext = 500;
  private typingTimeout?: ReturnType<typeof setTimeout>;

  private phrases = [
    'نظام ذكي متكامل لإدارة المكاتب القانونية',
    'حلول قانونية مدعومة بالذكاء الاصطناعي',
    'إدارة احترافية للقضايا والموكلين',
    'منصة رقمية شاملة للخدمات القانونية',
    'تكنولوجيا متقدمة في خدمة القانون والعدالة'
  ];

  ngOnInit() {
    this.loadDashboardData();
    this.startTypingAnimation();
  }

  ngOnDestroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private startTypingAnimation() {
    const type = () => {
      const currentPhrase = this.phrases[this.currentPhraseIndex];

      if (!this.isDeleting && this.currentCharIndex < currentPhrase.length) {
        // Typing
        this.typedText.set(currentPhrase.substring(0, this.currentCharIndex + 1));
        this.currentCharIndex++;
        this.typingTimeout = setTimeout(type, this.typingSpeed);
      } else if (this.isDeleting && this.currentCharIndex > 0) {
        // Deleting
        this.typedText.set(currentPhrase.substring(0, this.currentCharIndex - 1));
        this.currentCharIndex--;
        this.typingTimeout = setTimeout(type, this.deletingSpeed);
      } else if (!this.isDeleting && this.currentCharIndex === currentPhrase.length) {
        // Pause before deleting
        this.isDeleting = true;
        this.typingTimeout = setTimeout(type, this.pauseBeforeDelete);
      } else if (this.isDeleting && this.currentCharIndex === 0) {
        // Move to next phrase
        this.isDeleting = false;
        this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
        this.typingTimeout = setTimeout(type, this.pauseBeforeNext);
      }
    };

    type();
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isAdmin() {
    return this.currentUser?.role === UserRole.ADMIN ||
           this.currentUser?.role === UserRole.SUPER_ADMIN;
  }

  get isLawyer() {
    return this.currentUser?.role === UserRole.LAWYER;
  }

  get isViewer() {
    return this.currentUser?.role === UserRole.VIEWER;
  }

  // Backward compatibility alias
  get isClient() {
    return this.isViewer;
  }

  loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // استخدام بيانات تجريبية مؤقتاً
    // عندما يكون الـ API جاهز، قم بإلغاء التعليق عن الكود التالي واستخدمه بدلاً من البيانات التجريبية

    /*
    this.reportService.getDashboardStatistics().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.recentActivities.set(data.recentActivities || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error.set('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
        this.loading.set(false);
      }
    });
    */

    // بيانات تجريبية مؤقتة
    setTimeout(() => {
      const mockData: DashboardStatistics = {
        totalCases: 45,
        activeCases: 28,
        closedCases: 12,
        pendingCases: 5,
        totalClients: 67,
        totalDocuments: 234,
        upcomingHearings: 8,
        recentActivities: [
          {
            id: '1',
            type: 'case_created',
            description: 'تم إضافة قضية جديدة: قضية رقم 2024-001',
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 دقيقة مضت
          },
          {
            id: '2',
            type: 'document_uploaded',
            description: 'تم رفع مستند جديد: عقد الاتفاق للقضية 2024-001',
            timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 دقيقة مضت
          },
          {
            id: '3',
            type: 'hearing_scheduled',
            description: 'تم تحديد موعد جلسة جديدة في 2024-11-05',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // ساعتين مضت
          },
          {
            id: '4',
            type: 'client_added',
            description: 'تم إضافة عميل جديد: أحمد محمد علي',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 ساعات مضت
          },
          {
            id: '5',
            type: 'case_updated',
            description: 'تم تحديث حالة القضية 2023-045 إلى "قيد المعالجة"',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // يوم واحد مضى
          }
        ],
        casesByStatus: [
          { status: 'active', count: 28, percentage: 62 },
          { status: 'closed', count: 12, percentage: 27 },
          { status: 'pending', count: 5, percentage: 11 }
        ],
        casesByPriority: [
          { priority: 'urgent', count: 8, percentage: 18 },
          { priority: 'high', count: 15, percentage: 33 },
          { priority: 'medium', count: 18, percentage: 40 },
          { priority: 'low', count: 4, percentage: 9 }
        ],
        monthlyStats: [
          { month: 'أكتوبر', year: 2024, totalCases: 12, closedCases: 8, revenue: 45000 },
          { month: 'سبتمبر', year: 2024, totalCases: 15, closedCases: 10, revenue: 52000 },
          { month: 'أغسطس', year: 2024, totalCases: 10, closedCases: 7, revenue: 38000 }
        ]
      };

      this.stats.set(mockData);
      this.recentActivities.set(mockData.recentActivities);
      this.loading.set(false);
    }, 1000); // محاكاة تحميل البيانات
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'case_created': '⚖️',
      'case_updated': '📝',
      'case_closed': '✅',
      'document_uploaded': '📄',
      'hearing_scheduled': '📅',
      'client_added': '👤',
      'payment_received': '💰',
      'note_added': '📌',
      'default': '🔔'
    };
    return icons[type] || icons['default'];
  }

  getActivityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'case_created': 'قضية جديدة',
      'case_updated': 'تحديث قضية',
      'case_closed': 'إغلاق قضية',
      'document_uploaded': 'رفع مستند',
      'hearing_scheduled': 'جدولة جلسة',
      'client_added': 'عميل جديد',
      'payment_received': 'استلام دفعة',
      'note_added': 'إضافة ملاحظة',
      'default': 'نشاط'
    };
    return labels[type] || labels['default'];
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'open': 'مفتوحة',
      'in_progress': 'قيد المعالجة',
      'pending': 'معلقة',
      'closed': 'مغلقة',
      'active': 'نشطة'
    };
    return labels[status.toLowerCase()] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return labels[priority.toLowerCase()] || priority;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'open': '#1890ff',
      'in_progress': '#fa8c16',
      'pending': '#faad14',
      'closed': '#52c41a',
      'active': '#722ed1'
    };
    return colors[status.toLowerCase()] || '#8c8c8c';
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': '#52c41a',
      'medium': '#faad14',
      'high': '#fa541c',
      'urgent': '#f5222d'
    };
    return colors[priority.toLowerCase()] || '#8c8c8c';
  }
}
