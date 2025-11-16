import { Component, OnInit, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionApiService } from '../../core/services/session-api.service';
import { CaseApiService } from '../../core/services/case-api.service';
import { CourtApiService } from '../../core/services/court-api.service';
import { SessionDto, SessionSearchDto, CreateSessionDto, UpdateSessionDto, CaseDto, CourtDto } from '../../core/models/case-new.model';
import { ToastrService } from 'ngx-toastr';

interface SessionStatus {
  value: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions-list.component.html',
  styleUrl: './sessions-list.component.scss'
})
export class SessionsListComponent implements OnInit {
  private sessionService = inject(SessionApiService);
  private caseService = inject(CaseApiService);
  private courtService = inject(CourtApiService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  sessions = signal<SessionDto[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  searchQuery = signal('');
  selectedCaseId = signal<number | null>(null);
  selectedCourtId = signal<number | null>(null);
  selectedStatus = signal('');
  fromDate = signal('');
  toDate = signal('');

  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  currentSession = signal<SessionDto | null>(null);

  formData = signal<CreateSessionDto>({
    caseId: 0,
    courtId: undefined,
    title: '',
    startsAtUtc: '',
    endsAtUtc: '',
    room: '',
    judgeName: '',
    status: 'scheduled',
    notes: ''
  });

  cases = signal<CaseDto[]>([]);
  courts = signal<CourtDto[]>([]);

  sessionStatuses: SessionStatus[] = [
    { value: '', label: 'الكل', color: '' },
    { value: 'scheduled', label: 'مجدولة', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'جارية', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'مكتملة', color: 'bg-green-100 text-green-800' },
    { value: 'postponed', label: 'مؤجلة', color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'ملغاة', color: 'bg-red-100 text-red-800' }
  ];

  getTotalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
  Math = Math;

  ngOnInit(): void {
    this.loadSessions();
    this.loadCases();
    this.loadCourts();
  }

  loadSessions(): void {
    this.loading.set(true);
    const searchDto: SessionSearchDto = {
      q: this.searchQuery() || undefined,
      caseId: this.selectedCaseId() || undefined,
      courtId: this.selectedCourtId() || undefined,
      status: this.selectedStatus() || undefined,
      fromUtc: this.fromDate() || undefined,
      toUtc: this.toDate() || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.sessionService.list(searchDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Sessions Response:', response);
          if (response.success && response.data) {
            console.log('Sessions Data:', response.data);
            console.log('Sessions Items:', response.data.items);
            this.sessions.set(response.data.items || []);
            this.totalItems.set(response.data.totalCount || 0);
          } else {
            console.warn('No sessions data or unsuccessful response');
            this.sessions.set([]);
            this.totalItems.set(0);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          this.toastr.error('فشل تحميل الجلسات. الرجاء المحاولة مرة أخرى.');
          this.sessions.set([]);
          this.loading.set(false);
        }
      });
  }

  loadCases(): void {
    this.caseService.list({ page: 1, pageSize: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.cases.set(response.data.items);
          }
        },
        error: () => {
          // Error handled by interceptor
        }
      });
  }

  loadCourts(): void {
    this.courtService.list({ page: 1, pageSize: 1000, isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.courts.set(response.data.items);
          }
        },
        error: () => {
          // Error handled by interceptor
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadSessions();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadSessions();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage.set(page);
      this.loadSessions();
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, totalPages);
      }
    }

    return pages;
  }

  openCreateModal(): void {
    this.formData.set({
      caseId: 0,
      courtId: undefined,
      title: '',
      startsAtUtc: '',
      endsAtUtc: '',
      room: '',
      judgeName: '',
      status: 'scheduled',
      notes: ''
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createSession(): void {
    // Validate form first
    if (!this.validateCreateForm()) {
      return;
    }

    const data = this.formData();
    this.loading.set(true);

    this.sessionService.create(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم إنشاء الجلسة بنجاح', 'نجاح العملية');
            this.closeCreateModal();
            this.loadSessions();
          } else {
            this.toastr.error(response.message || 'فشل في إنشاء الجلسة', 'خطأ');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error creating session:', error);
          this.toastr.error('حدث خطأ أثناء إنشاء الجلسة', 'خطأ');
          this.loading.set(false);
        }
      });
  }

  openEditModal(session: SessionDto): void {
    this.currentSession.set(session);

    // Convert UTC dates to local datetime-local format
    let startDate = '';
    if (session.startsAtUtc) {
      try {
        const date = new Date(session.startsAtUtc);
        startDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      } catch (error) {
        console.error('Error converting start date:', error);
      }
    }

    let endDate = '';
    if (session.endsAtUtc) {
      try {
        const date = new Date(session.endsAtUtc);
        endDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      } catch (error) {
        console.error('Error converting end date:', error);
      }
    }

    this.formData.set({
      caseId: session.caseId,
      courtId: session.courtId,
      title: session.title || '',
      startsAtUtc: startDate,
      endsAtUtc: endDate,
      room: session.room || '',
      judgeName: session.judgeName || '',
      status: session.status || 'scheduled',
      notes: session.notes || ''
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.currentSession.set(null);
  }

  updateSession(): void {
    const session = this.currentSession();
    if (!session) return;

    // Validate form first
    if (!this.validateCreateForm()) {
      return;
    }

    const data = this.formData();
    const updateDto: UpdateSessionDto = {
      id: session.id,
      ...data
    };

    this.loading.set(true);
    this.sessionService.update(updateDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم تحديث الجلسة بنجاح', 'نجاح العملية');
            this.closeEditModal();
            this.loadSessions();
          } else {
            this.toastr.error(response.message || 'فشل في تحديث الجلسة', 'خطأ');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating session:', error);
          this.toastr.error('حدث خطأ أثناء تحديث الجلسة', 'خطأ');
          this.loading.set(false);
        }
      });
  }

  openDeleteModal(session: SessionDto): void {
    this.currentSession.set(session);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.currentSession.set(null);
  }

  deleteSession(): void {
    const session = this.currentSession();
    if (!session) return;

    this.loading.set(true);
    this.sessionService.delete(session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم حذف الجلسة بنجاح');
            this.closeDeleteModal();
            this.loadSessions();
          }
          this.loading.set(false);
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  getStatusLabel(status?: string): string {
    const found = this.sessionStatuses.find(s => s.value === status);
    return found ? found.label : status || '-';
  }

  getStatusColor(status?: string): string {
    const found = this.sessionStatuses.find(s => s.value === status);
    return found ? found.color : '';
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  formatTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  updateFormField(field: keyof CreateSessionDto, value: any): void {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  // Convert UTC datetime string to local datetime-local input format
  convertToLocalDateTime(utcDateString: string): string {
    if (!utcDateString) return '';
    try {
      const date = new Date(utcDateString);
      // Format: YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error converting date:', error);
      return '';
    }
  }

  // Validate form before submission
  validateCreateForm(): boolean {
    const data = this.formData();

    if (!data.caseId || data.caseId === 0) {
      this.toastr.error('يرجى اختيار القضية', 'خطأ في البيانات');
      return false;
    }

    if (!data.startsAtUtc) {
      this.toastr.error('يرجى تحديد تاريخ ووقت بداية الجلسة', 'خطأ في البيانات');
      return false;
    }

    // Validate that end date is after start date if provided
    if (data.endsAtUtc && data.startsAtUtc) {
      const startDate = new Date(data.startsAtUtc);
      const endDate = new Date(data.endsAtUtc);

      if (endDate <= startDate) {
        this.toastr.error('تاريخ انتهاء الجلسة يجب أن يكون بعد تاريخ البداية', 'خطأ في البيانات');
        return false;
      }
    }

    return true;
  }
}
