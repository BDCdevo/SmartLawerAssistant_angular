import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourtApiService } from '../../core/services/court-api.service';
import { CourtDto, CourtSearchDto, CreateCourtDto, UpdateCourtDto } from '../../core/models/case-new.model';

@Component({
  selector: 'app-courts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courts.component.html',
  styleUrl: './courts.component.scss'
})
export class CourtsComponent implements OnInit {
  private courtApiService = inject(CourtApiService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  courts = signal<CourtDto[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditMode = signal(false);

  searchTerm = signal('');
  filterGovernorate = signal('');
  filterCity = signal('');
  showActiveOnly = signal<boolean | undefined>(undefined);

  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  formData = signal<Partial<CourtDto>>({
    nameAr: '',
    nameEn: '',
    governorate: '',
    city: '',
    phone: '',
    email: '',
    isActive: true
  });

  Math = Math;

  ngOnInit() {
    this.loadCourts();
  }

  loadCourts() {
    this.loading.set(true);
    const searchDto: CourtSearchDto = {
      q: this.searchTerm() || undefined,
      governorate: this.filterGovernorate() || undefined,
      city: this.filterCity() || undefined,
      isActive: this.showActiveOnly(),
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.courtApiService.list(searchDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const courts = response.data.items || [];
            this.courts.set(courts);
            this.totalItems.set(response.data.totalCount || 0);
          } else {
            this.courts.set([]);
            this.totalItems.set(0);
          }
          this.loading.set(false);
        },
        error: () => {
          // Error handled by interceptor
          this.courts.set([]);
          this.loading.set(false);
        }
      });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.formData.set({ nameAr: '', nameEn: '', governorate: '', city: '', phone: '', email: '', isActive: true });
    this.showModal.set(true);
  }

  openEditModal(court: CourtDto) {
    this.isEditMode.set(true);
    this.formData.set({ ...court });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    const data = this.formData();
    if (!data.nameAr?.trim()) {
      this.toastr.error('الاسم بالعربية مطلوب');
      return;
    }

    this.loading.set(true);
    const operation = this.isEditMode() && data.id ?
      this.courtApiService.update(data as UpdateCourtDto) :
      this.courtApiService.create(data as CreateCourtDto);

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success(this.isEditMode() ? 'تم تحديث المحكمة بنجاح' : 'تم إضافة المحكمة بنجاح');
          this.closeModal();
          this.loadCourts();
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

  delete(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذه المحكمة؟')) return;
    this.loading.set(true);
    this.courtApiService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم حذف المحكمة بنجاح');
            this.loadCourts();
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

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  updateField(field: keyof CourtDto, value: any) {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
