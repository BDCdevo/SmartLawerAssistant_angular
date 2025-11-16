import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CaseApiService } from '../../core/services/case-api.service';
import { CaseDto, CaseSearchDto } from '../../core/models/case-new.model';
import { PagedResult } from '../../core/models/api-response.model';

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cases-list.component.html',
  styleUrls: ['./cases-list.component.scss']
})
export class CasesListComponent implements OnInit {
  private caseApiService = inject(CaseApiService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Expose Math to template
  Math = Math;

  // Signals for reactive state
  cases = signal<CaseDto[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);

  // Search signals
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('');

  // Computed values
  hasData = computed(() => {
    const cases = this.cases();
    return cases && cases.length > 0;
  });
  isEmpty = computed(() => {
    const cases = this.cases();
    return !this.loading() && (!cases || cases.length === 0);
  });
  showPagination = computed(() => this.totalPages() > 1);

  // Pagination array for UI
  paginationPages = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();

    // Show max 5 pages
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  });

  // Status options for filter
  statusOptions = [
    { value: '', label: 'الكل' },
    { value: 'Open', label: 'مفتوحة' },
    { value: 'InProgress', label: 'قيد التنفيذ' },
    { value: 'Closed', label: 'مغلقة' },
    { value: 'Pending', label: 'معلقة' }
  ];

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.loading.set(true);
    this.error.set(null);

    const searchDto: CaseSearchDto = {
      q: this.searchQuery() || undefined,
      status: this.selectedStatus() || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.caseApiService.list(searchDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const pagedResult: PagedResult<CaseDto> = response.data;
            // Ensure items is always an array
            this.cases.set(pagedResult.items || []);
            this.totalCount.set(pagedResult.totalCount || 0);
            this.totalPages.set(pagedResult.totalPages || 0);
            this.currentPage.set(pagedResult.page || 1);
          } else {
            this.error.set(response.message || 'فشل في تحميل القضايا');
            this.cases.set([]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          // Error is already handled by error interceptor
          this.error.set('فشل في تحميل القضايا');
          this.cases.set([]);
          this.loading.set(false);
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadCases();
  }

  onStatusChange(): void {
    this.currentPage.set(1);
    this.loadCases();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.currentPage.set(1);
    this.loadCases();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadCases();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  createCase(): void {
    // Navigate to create case page or open modal
    this.router.navigate(['/cases-new/create']);
  }

  editCase(caseItem: CaseDto): void {
    // Navigate to edit case page or open modal
    this.router.navigate(['/cases-new/edit', caseItem.id]);
  }

  viewCase(caseItem: CaseDto): void {
    // Navigate to view case details page
    this.router.navigate(['/cases-new/view', caseItem.id]);
  }

  deleteCase(caseItem: CaseDto): void {
    if (confirm(`هل أنت متأكد من حذف القضية رقم ${caseItem.number} لسنة ${caseItem.year}؟`)) {
      this.loading.set(true);
      this.error.set(null);

      this.caseApiService.deleteCase(caseItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.toastr.success('تم حذف القضية بنجاح');
              this.loadCases();
            } else {
              this.loading.set(false);
            }
          },
          error: () => {
            // Error is already handled by error interceptor
            this.loading.set(false);
          }
        });
    }
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackByCase(index: number, item: CaseDto): number {
    return item.id;
  }
}
