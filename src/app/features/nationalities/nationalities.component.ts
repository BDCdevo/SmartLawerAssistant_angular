import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NationalityService } from '../../core/services/nationality.service';
import {
  Nationality,
  CreateNationalityDto,
  UpdateNationalityDto
} from '../../core/models/nationality.model';

@Component({
  selector: 'app-nationalities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nationalities.component.html',
  styleUrl: './nationalities.component.scss'
})
export class NationalitiesComponent implements OnInit {
  private nationalityService = inject(NationalityService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Make Math available in template
  Math = Math;

  // State signals
  nationalities = signal<Nationality[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditMode = signal(false);

  // Search & Pagination
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  showActiveOnly = signal<boolean | undefined>(undefined);

  // Form data
  formData = signal<Partial<Nationality>>({
    nameAr: '',
    nameEn: '',
    flagEmoji: '',
    isActive: true
  });

  ngOnInit() {
    this.loadNationalities();
  }

  loadNationalities() {
    this.loading.set(true);

    // Build search DTO - only include fields with values
    const searchDto: any = {};

    // Only add isActive if it has a value (not undefined)
    if (this.showActiveOnly() !== undefined) {
      searchDto.isActive = this.showActiveOnly();
    }

    console.log('Nationalities Search DTO:', searchDto);

    this.nationalityService.getList(searchDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Nationalities Response:', response);

          // Handle different response structures
          let data = [];
          if (response.success && response.data) {
            data = Array.isArray(response.data) ? response.data : response.data.items || [];
          } else if (Array.isArray(response)) {
            data = response;
          } else if (response.data && Array.isArray(response.data)) {
            data = response.data;
          }

          console.log('Nationalities Data:', data);
          console.log('Nationalities Count:', data.length);

          // Apply client-side search filtering
          if (this.searchTerm()) {
            const term = this.searchTerm().toLowerCase();
            data = data.filter((n: Nationality) =>
              n.nameAr?.toLowerCase().includes(term) ||
              n.nameEn?.toLowerCase().includes(term)
            );
            console.log('Filtered Nationalities Count:', data.length);
          }

          this.totalItems.set(data.length);

          // Apply client-side pagination
          const start = (this.currentPage() - 1) * this.pageSize();
          const end = start + this.pageSize();
          const paginatedData = data.slice(start, end);

          console.log('Paginated Nationalities:', paginatedData);
          this.nationalities.set(paginatedData);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading nationalities:', error);
          this.toastr.error('فشل تحميل الجنسيات. الرجاء المحاولة مرة أخرى.');
          this.nationalities.set([]);
          this.loading.set(false);
        }
      });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadNationalities();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadNationalities();
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.formData.set({
      nameAr: '',
      nameEn: '',
      flagEmoji: '',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(nationality: Nationality) {
    this.isEditMode.set(true);
    this.formData.set({ ...nationality });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.formData.set({
      nameAr: '',
      nameEn: '',
      flagEmoji: '',
      isActive: true
    });
  }

  saveNationality() {
    const data = this.formData();

    if (!data.nameAr || data.nameAr.trim() === '') {
      this.toastr.error('الاسم بالعربية مطلوب');
      return;
    }

    this.loading.set(true);

    if (this.isEditMode() && data.id) {
      // Update
      const updateDto: UpdateNationalityDto = {
        id: data.id,
        nameAr: data.nameAr,
        nameEn: data.nameEn || undefined,
        flagEmoji: data.flagEmoji || undefined,
        isActive: data.isActive ?? true
      };

      this.nationalityService.update(updateDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('تم تحديث الجنسية بنجاح');
            this.closeModal();
            this.loadNationalities();
          },
          error: () => {
            // Error handled by interceptor
            this.loading.set(false);
          }
        });
    } else {
      // Create
      const createDto: CreateNationalityDto = {
        nameAr: data.nameAr,
        nameEn: data.nameEn || undefined,
        flagEmoji: data.flagEmoji || undefined,
        isActive: data.isActive ?? true
      };

      this.nationalityService.create(createDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('تم إضافة الجنسية بنجاح');
            this.closeModal();
            this.loadNationalities();
          },
          error: () => {
            // Error handled by interceptor
            this.loading.set(false);
          }
        });
    }
  }

  deleteNationality(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذه الجنسية؟')) {
      return;
    }

    this.loading.set(true);

    this.nationalityService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('تم حذف الجنسية بنجاح');
          this.loadNationalities();
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  restoreNationality(id: number) {
    this.loading.set(true);

    this.nationalityService.restore(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('تم استرجاع الجنسية بنجاح');
          this.loadNationalities();
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      this.loadNationalities();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
      this.loadNationalities();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadNationalities();
    }
  }

  // Update form field
  updateField(field: keyof Nationality, value: any) {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
