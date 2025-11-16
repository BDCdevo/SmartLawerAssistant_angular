import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourtTypeService } from '../../core/services/court-type.service';
import { CourtType, CreateCourtTypeDto, UpdateCourtTypeDto } from '../../core/models/court-type.model';

@Component({
  selector: 'app-court-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './court-types.component.html',
  styleUrl: './court-types.component.scss'
})
export class CourtTypesComponent implements OnInit {
  private courtTypeService = inject(CourtTypeService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  courtTypes = signal<CourtType[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditMode = signal(false);
  searchTerm = signal('');
  showActiveOnly = signal<boolean | undefined>(undefined);

  formData = signal<Partial<CourtType>>({
    nameAr: '',
    nameEn: '',
    isActive: true
  });

  ngOnInit() {
    this.loadCourtTypes();
  }

  loadCourtTypes() {
    this.loading.set(true);
    this.courtTypeService.list(this.searchTerm(), this.showActiveOnly())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          let data = response.success && response.data ?
            (Array.isArray(response.data) ? response.data : [response.data]) :
            (Array.isArray(response) ? response : []);
          this.courtTypes.set(data);
          this.loading.set(false);
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.formData.set({ nameAr: '', nameEn: '', isActive: true });
    this.showModal.set(true);
  }

  openEditModal(courtType: CourtType) {
    this.isEditMode.set(true);
    this.formData.set({ ...courtType });
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
    const dto = this.isEditMode() && data.id ?
      { id: data.id, nameAr: data.nameAr!, nameEn: data.nameEn, isActive: data.isActive ?? true } :
      { nameAr: data.nameAr!, nameEn: data.nameEn, isActive: data.isActive ?? true };

    const operation = this.isEditMode() && data.id ?
      this.courtTypeService.update(dto as UpdateCourtTypeDto) :
      this.courtTypeService.create(dto as CreateCourtTypeDto);

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success(this.isEditMode() ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
        this.closeModal();
        this.loadCourtTypes();
      },
      error: () => {
        // Error handled by interceptor
        this.loading.set(false);
      }
    });
  }

  delete(id: number) {
    if (!confirm('هل أنت متأكد؟')) return;
    this.loading.set(true);
    this.courtTypeService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('تم الحذف بنجاح');
          this.loadCourtTypes();
        },
        error: () => {
          // Error handled by interceptor
          this.loading.set(false);
        }
      });
  }

  updateField(field: keyof CourtType, value: any) {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
