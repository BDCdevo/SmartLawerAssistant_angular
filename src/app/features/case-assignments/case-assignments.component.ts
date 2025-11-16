import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CaseAssignmentService } from '../../core/services/case-assignment.service';
import {
  CaseAssignment,
  AssignCaseUserDto,
  UnassignCaseUserDto,
  CaseAssignmentSearchDto
} from '../../core/models/case-assignment.model';

@Component({
  selector: 'app-case-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './case-assignments.component.html',
  styleUrl: './case-assignments.component.scss'
})
export class CaseAssignmentsComponent implements OnInit {
  private assignmentService = inject(CaseAssignmentService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Make Math available in template
  Math = Math;

  // State
  assignments = signal<CaseAssignment[]>([]);
  loading = signal(false);

  // Filters
  filterCaseId = signal<number | undefined>(undefined);
  filterUserId = signal('');
  filterRole = signal('');
  showActiveOnly = signal(true);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  // Modal
  showAssignModal = signal(false);
  showUnassignModal = signal(false);

  // Form data for assign
  assignForm = signal<AssignCaseUserDto>({
    caseId: 0,
    userId: '',
    role: '',
    notes: ''
  });

  // Selected assignment for unassign
  selectedAssignment = signal<CaseAssignment | null>(null);
  unassignNotes = signal('');

  // Role options
  roleOptions = [
    { value: '', label: 'الكل' },
    { value: 'Lawyer', label: 'محامي' },
    { value: 'Assistant', label: 'مساعد' },
    { value: 'Consultant', label: 'مستشار' }
  ];

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.loading.set(true);

    const params: CaseAssignmentSearchDto = {
      caseId: this.filterCaseId(),
      userId: this.filterUserId() || undefined,
      role: this.filterRole() || undefined,
      activeOnly: this.showActiveOnly(),
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.assignmentService.list(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          let data = [];
          if (response.success && response.data) {
            data = Array.isArray(response.data) ? response.data : response.data.items || [];
            this.totalItems.set(response.data.totalCount || data.length);
          } else if (Array.isArray(response)) {
            data = response;
            this.totalItems.set(data.length);
          }

          this.assignments.set(data);
          this.loading.set(false);
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadAssignments();
  }

  clearFilters() {
    this.filterCaseId.set(undefined);
    this.filterUserId.set('');
    this.filterRole.set('');
    this.showActiveOnly.set(true);
    this.currentPage.set(1);
    this.loadAssignments();
  }

  // Assign Modal
  openAssignModal() {
    this.assignForm.set({
      caseId: 0,
      userId: '',
      role: '',
      notes: ''
    });
    this.showAssignModal.set(true);
  }

  closeAssignModal() {
    this.showAssignModal.set(false);
  }

  assignUser() {
    const form = this.assignForm();

    if (!form.caseId || form.caseId <= 0) {
      this.toastr.error('الرجاء إدخال رقم القضية');
      return;
    }

    if (!form.userId || form.userId.trim() === '') {
      this.toastr.error('الرجاء إدخال معرف المستخدم');
      return;
    }

    this.loading.set(true);

    this.assignmentService.assign(form)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم تعيين المستخدم للقضية بنجاح');
            this.closeAssignModal();
            this.loadAssignments();
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  // Unassign Modal
  openUnassignModal(assignment: CaseAssignment) {
    this.selectedAssignment.set(assignment);
    this.unassignNotes.set('');
    this.showUnassignModal.set(true);
  }

  closeUnassignModal() {
    this.showUnassignModal.set(false);
    this.selectedAssignment.set(null);
    this.unassignNotes.set('');
  }

  unassignUser() {
    const assignment = this.selectedAssignment();
    if (!assignment) return;

    const unassignDto: UnassignCaseUserDto = {
      id: assignment.id,
      caseId: assignment.caseId,
      userId: assignment.userId,
      notes: this.unassignNotes()
    };

    this.loading.set(true);

    this.assignmentService.unassign(unassignDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم إلغاء التعيين بنجاح');
            this.closeUnassignModal();
            this.loadAssignments();
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  deleteAssignment(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا التعيين؟')) {
      return;
    }

    this.loading.set(true);

    this.assignmentService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم حذف التعيين بنجاح');
            this.loadAssignments();
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  restoreAssignment(id: number) {
    this.loading.set(true);

    this.assignmentService.restore(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم استرجاع التعيين بنجاح');
            this.loadAssignments();
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      this.loadAssignments();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
      this.loadAssignments();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadAssignments();
    }
  }

  // Helper methods
  getRoleLabel(role?: string): string {
    if (!role) return '-';
    const option = this.roleOptions.find(opt => opt.value === role);
    return option ? option.label : role;
  }

  formatDate(date?: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  updateAssignField(field: keyof AssignCaseUserDto, value: any) {
    this.assignForm.update(form => ({ ...form, [field]: value }));
  }
}
