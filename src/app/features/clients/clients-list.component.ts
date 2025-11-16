import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientApiService } from '../../core/services/client-api.service';
import { ClientDto, CreateClientDto, UpdateClientDto } from '../../core/models/case-new.model';
import { PagedResult } from '../../core/models/api-response.model';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss'
})
export class ClientsListComponent implements OnInit {
  private clientApiService = inject(ClientApiService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Make Math available in template
  Math = Math;

  clients = signal<ClientDto[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditMode = signal(false);

  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  formData = signal<Partial<ClientDto>>({
    fullName: '',
    nationalId: undefined,
    phone: '',
    email: '',
    address: '',
    dateOfBirth: undefined,
    gender: '',
    maritalStatus: '',
    profession: '',
    isActive: true
  });

  genderOptions = [
    { value: '', label: 'اختر الجنس' },
    { value: 'Male', label: 'ذكر' },
    { value: 'Female', label: 'أنثى' }
  ];

  maritalStatusOptions = [
    { value: '', label: 'اختر الحالة' },
    { value: 'Single', label: 'أعزب/عزباء' },
    { value: 'Married', label: 'متزوج/متزوجة' },
    { value: 'Divorced', label: 'مطلق/مطلقة' },
    { value: 'Widowed', label: 'أرمل/أرملة' }
  ];

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading.set(true);
    console.log('Loading clients...');

    this.clientApiService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Clients API Response:', response);

          if (response.success && response.data) {
            // Handle both array response and PagedResult wrapper
            let items = Array.isArray(response.data)
              ? response.data
              : (response.data.items || []);
            console.log('Loaded Items:', items);

            // Client-side search
            if (this.searchQuery()) {
              const query = this.searchQuery().toLowerCase();
              items = items.filter(c =>
                c.fullName?.toLowerCase().includes(query) ||
                c.phone?.includes(query) ||
                c.email?.toLowerCase().includes(query)
              );
            }

            console.log('Filtered Items:', items);
            this.clients.set(items);
            this.totalItems.set(items.length);
          } else {
            console.warn('No data or unsuccessful response:', response);
            this.clients.set([]);
            this.totalItems.set(0);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          this.clients.set([]);
          this.totalItems.set(0);
          this.loading.set(false);
        }
      });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.formData.set({
      fullName: '',
      nationalId: undefined,
      phone: '',
      email: '',
      address: '',
      dateOfBirth: undefined,
      gender: '',
      maritalStatus: '',
      profession: '',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(client: ClientDto) {
    this.isEditMode.set(true);
    this.formData.set({ ...client });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    const data = this.formData();
    if (!data.fullName?.trim()) {
      this.toastr.error('الاسم الكامل مطلوب');
      return;
    }

    this.loading.set(true);

    const operation = this.isEditMode() && data.id ?
      this.clientApiService.update(data as UpdateClientDto) :
      this.clientApiService.create(data as CreateClientDto);

    console.log('Saving client:', this.isEditMode() ? 'UPDATE' : 'CREATE', data);

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        console.log('Save response:', response);
        if (response.success) {
          this.toastr.success(this.isEditMode() ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
          this.closeModal();
          this.loadClients();
        } else {
          this.toastr.error(response.message || 'حدث خطأ');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Save error:', error);
        this.loading.set(false);
      }
    });
  }

  delete(id: number, fullName: string) {
    if (!confirm(`هل أنت متأكد من حذف العميل "${fullName}"؟`)) return;

    this.loading.set(true);
    this.clientApiService.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم الحذف بنجاح');
          this.loadClients();
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

  restore(id: number) {
    this.loading.set(true);
    this.clientApiService.restore(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم الاسترجاع بنجاح');
          this.loadClients();
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

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
    }
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  }

  updateField(field: keyof ClientDto, value: any) {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
