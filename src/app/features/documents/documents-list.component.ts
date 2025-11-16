import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentApiService } from '../../core/services/document-api.service';
import { CaseApiService } from '../../core/services/case-api.service';
import { ClientApiService } from '../../core/services/client-api.service';
import { DocumentDto, DocumentSearchDto, CaseDto, ClientDto } from '../../core/models/case-new.model';
import { PagedResult } from '../../core/models/api-response.model';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-list.component.html',
  styleUrl: './documents-list.component.scss'
})
export class DocumentsListComponent implements OnInit {
  private documentApiService = inject(DocumentApiService);
  private caseApiService = inject(CaseApiService);
  private clientApiService = inject(ClientApiService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // State signals
  documents = signal<DocumentDto[]>([]);
  loading = signal(false);
  uploading = signal(false);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  searchQuery = signal('');
  selectedCategory = signal('');
  selectedCaseId = signal<number | null>(null);
  selectedClientId = signal<number | null>(null);
  showUploadModal = signal(false);

  // File upload signals
  selectedFile = signal<File | null>(null);
  uploadTitle = signal('');
  uploadCategory = signal('');
  uploadCaseId = signal<number | null>(null);

  // AI Analysis signals
  showAnalysisModal = signal(false);
  selectedDocumentForAnalysis = signal<DocumentDto | null>(null);
  documentAnalysis = signal<any>(null);
  analyzingDocument = signal(false);

  // View mode (grid or list)
  viewMode = signal<'grid' | 'list'>('grid');

  // Dropdown data
  cases = signal<CaseDto[]>([]);
  clients = signal<ClientDto[]>([]);

  // Expose Math for template
  Math = Math;

  // Categories for dropdown
  categories = [
    { value: '', label: 'جميع الفئات' },
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'EVIDENCE', label: 'دليل' },
    { value: 'COURT_FILING', label: 'ملف محكمة' },
    { value: 'CORRESPONDENCE', label: 'مراسلات' },
    { value: 'IDENTIFICATION', label: 'هوية' },
    { value: 'OTHER', label: 'أخرى' }
  ];

  ngOnInit() {
    this.loadDocuments();
    this.loadCases();
    this.loadClients();
  }

  loadCases() {
    this.caseApiService.list({ page: 1, pageSize: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Handle both response formats
            const casesArray: any[] = Array.isArray(response.data)
              ? response.data
              : (response.data.items && Array.isArray(response.data.items))
                ? response.data.items
                : [];
            console.log('✅ Cases loaded:', casesArray.length);
            this.cases.set(casesArray);
          }
        },
        error: (error) => {
          console.error('❌ Error loading cases:', error);
        }
      });
  }

  loadClients() {
    this.clientApiService.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Handle both response formats
            const clientsArray: any[] = Array.isArray(response.data)
              ? response.data
              : (response.data.items && Array.isArray(response.data.items))
                ? response.data.items
                : [];
            console.log('✅ Clients loaded:', clientsArray.length);
            this.clients.set(clientsArray);
          }
        },
        error: (error) => {
          console.error('❌ Error loading clients:', error);
        }
      });
  }

  loadDocuments() {
    this.loading.set(true);

    // Build search DTO - only include fields with values
    const searchDto: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    // Only add q if it has a value
    if (this.searchQuery()?.trim()) {
      searchDto.q = this.searchQuery().trim();
    }

    // Only add category if it has a value
    if (this.selectedCategory()) {
      searchDto.category = this.selectedCategory();
    }

    // Only add caseId if it has a value
    if (this.selectedCaseId()) {
      searchDto.caseId = this.selectedCaseId();
    }

    // Only add clientId if it has a value
    if (this.selectedClientId()) {
      searchDto.clientId = this.selectedClientId();
    }

    console.log('📤 Documents Search DTO:', searchDto);

    this.documentApiService.list(searchDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('📥 Documents Response:', response);
          if (response.success && response.data) {
            console.log('📄 Documents Data:', response.data);

            // Handle both response formats:
            // 1. data: [ {...}, {...} ] with meta: { total, page, ... }
            // 2. data: { items: [...], totalCount: ... }
            if (Array.isArray(response.data)) {
              // Format 1: data is array, pagination in meta
              this.documents.set(response.data);
              this.totalItems.set(response.meta?.total || response.data.length);
              console.log(`✅ Loaded ${response.data.length} documents (total: ${response.meta?.total || 0})`);
            } else if (response.data.items && Array.isArray(response.data.items)) {
              // Format 2: data is object with items array
              this.documents.set(response.data.items);
              this.totalItems.set(response.data.totalCount || 0);
              console.log(`✅ Loaded ${response.data.items.length} documents (total: ${response.data.totalCount || 0})`);
            } else {
              console.warn('⚠️ Unexpected response format:', response.data);
              this.documents.set([]);
              this.totalItems.set(0);
            }
          } else {
            console.warn('⚠️ No documents data or unsuccessful response');
            this.documents.set([]);
            this.totalItems.set(0);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading documents:', error);
          this.toastr.error('فشل تحميل المستندات. الرجاء المحاولة مرة أخرى.');
          this.documents.set([]);
          this.loading.set(false);
        }
      });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onCategoryChange() {
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadDocuments();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  openUploadModal() {
    this.showUploadModal.set(true);
    this.resetUploadForm();
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
    this.resetUploadForm();
  }

  uploadDocument() {
    const file = this.selectedFile();
    if (!file) {
      this.toastr.error('الرجاء اختيار ملف');
      return;
    }

    if (!this.uploadTitle().trim()) {
      this.toastr.error('الرجاء إدخال عنوان المستند');
      return;
    }

    if (!this.uploadCategory()) {
      this.toastr.error('الرجاء اختيار فئة المستند');
      return;
    }

    if (!this.uploadCaseId()) {
      this.toastr.error('الرجاء اختيار القضية');
      return;
    }

    this.uploading.set(true);

    const formData = new FormData();
    formData.append('File', file);
    formData.append('Title', this.uploadTitle());
    formData.append('Category', this.uploadCategory());
    formData.append('CaseId', this.uploadCaseId()!.toString());

    this.documentApiService.upload(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم رفع المستند بنجاح');
            this.closeUploadModal();
            this.loadDocuments();
          }
          this.uploading.set(false);
        },
        error: () => {
          // Error handled by interceptor
          this.uploading.set(false);
        }
      });
  }

  resetUploadForm() {
    this.selectedFile.set(null);
    this.uploadTitle.set('');
    this.uploadCategory.set('');
    this.uploadCaseId.set(null);

    // Reset file input
    const fileInput = window.document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadDocuments();
  }

  restoreDocument(doc: DocumentDto) {
    if (!confirm(`هل أنت متأكد من استرجاع المستند "${doc.title}"؟`)) {
      return;
    }

    this.loading.set(true);
    this.documentApiService.restore(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم استرجاع المستند بنجاح');
            this.loadDocuments();
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

  downloadDocument(doc: DocumentDto) {
    this.toastr.info('جاري تحميل المستند...');

    this.documentApiService.download(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = doc.fileName || `document-${doc.id}`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastr.success('تم تحميل المستند بنجاح');
        },
        error: () => {
          // Error handled by interceptor
        }
      });
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'doc':
      case 'docx': return '📘';
      case 'xls':
      case 'xlsx': return '📗';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      default: return '📄';
    }
  }

  getOriginalFileName(document: any): string {
    return document?.originalFileName || '-';
  }

  getStoredFileName(document: any): string {
    return document?.storedFileName || '-';
  }

  getCategoryColor(category?: string): string {
    switch (category) {
      case 'CONTRACT': return 'bg-blue-100 text-blue-800';
      case 'EVIDENCE': return 'bg-green-100 text-green-800';
      case 'COURT_FILING': return 'bg-purple-100 text-purple-800';
      case 'CORRESPONDENCE': return 'bg-yellow-100 text-yellow-800';
      case 'IDENTIFICATION': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  deleteDocument(doc: DocumentDto) {
    if (!confirm(`هل أنت متأكد من حذف المستند "${doc.title}"؟`)) {
      return;
    }

    this.loading.set(true);
    this.documentApiService.delete(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم حذف المستند بنجاح');
            this.loadDocuments();
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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';

    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

  // AI Analysis methods
  openAnalysisModal(doc: DocumentDto) {
    this.selectedDocumentForAnalysis.set(doc);
    this.showAnalysisModal.set(true);
    this.getAnalysis(doc);
  }

  closeAnalysisModal() {
    this.showAnalysisModal.set(false);
    this.selectedDocumentForAnalysis.set(null);
    this.documentAnalysis.set(null);
  }

  getAnalysis(doc: DocumentDto) {
    this.analyzingDocument.set(true);
    this.documentAnalysis.set(null);

    this.documentApiService.getDocumentAnalysis(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.documentAnalysis.set(response.data);
          }
          this.analyzingDocument.set(false);
        },
        error: () => {
          this.analyzingDocument.set(false);
        }
      });
  }

  analyzeDocument(doc: DocumentDto) {
    this.analyzingDocument.set(true);
    this.toastr.info('جاري تحليل المستند بواسطة الذكاء الاصطناعي...');

    this.documentApiService.analyzeDocument(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تم تحليل المستند بنجاح');
            this.getAnalysis(doc);
          } else {
            this.analyzingDocument.set(false);
          }
        },
        error: () => {
          this.analyzingDocument.set(false);
        }
      });
  }

  reanalyzeDocument(doc: DocumentDto) {
    this.analyzingDocument.set(true);
    this.toastr.info('جاري إعادة تحليل المستند...');

    this.documentApiService.reanalyzeDocument(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('تمت إعادة تحليل المستند بنجاح');
            this.getAnalysis(doc);
          } else {
            this.analyzingDocument.set(false);
          }
        },
        error: () => {
          this.analyzingDocument.set(false);
        }
      });
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  // Parse objectionsJson from string to array
  getObjections(): any[] {
    const analysis = this.documentAnalysis();
    if (!analysis || !analysis.objectionsJson) return [];

    try {
      return JSON.parse(analysis.objectionsJson);
    } catch (e) {
      console.error('Failed to parse objectionsJson:', e);
      return [];
    }
  }

  // Format analysis date
  formatAnalysisDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
