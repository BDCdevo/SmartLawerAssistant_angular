import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgSelectModule } from '@ng-select/ng-select';
import { AiCaseAnalysisService } from '../../core/services/ai-case-analysis.service';
import { CaseService } from '../../core/services/case.service';
import { DocumentService } from '../../core/services/document.service';
import {
  CaseAnalysisRequestDto,
  CaseAnalysisResult,
  AIModel
} from '../../core/models';

@Component({
  selector: 'app-ai-case-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './ai-case-analysis.component.html',
  styleUrl: './ai-case-analysis.component.scss'
})
export class AiCaseAnalysisComponent implements OnInit {
  private aiService = inject(AiCaseAnalysisService);
  private caseService = inject(CaseService);
  private documentService = inject(DocumentService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Signals
  isLoading = signal(false);
  isLoadingCases = signal(false);
  isLoadingDocuments = signal(false);
  analysisResult = signal<CaseAnalysisResult | null>(null);
  availableModels = signal<AIModel[]>([]);
  currentModel = signal<string>('');
  selectedFile = signal<File | null>(null);

  // Data lists
  casesList = signal<any[]>([]);
  documentsList = signal<any[]>([]);

  // Forms
  analysisForm!: FormGroup;

  // Analysis modes
  analysisMode = signal<'case-document' | 'file'>('case-document');

  ngOnInit(): void {
    this.initializeForms();
    this.loadAvailableModels();
    this.loadCurrentModel();
    this.loadCases();
  }

  private initializeForms(): void {
    // Form لتحليل قضية ومستند
    this.analysisForm = this.fb.group({
      caseId: [null, Validators.required],
      documentId: [null, Validators.required]
    });

    // Watch for case selection changes
    this.analysisForm.get('caseId')?.valueChanges.subscribe(caseId => {
      if (caseId) {
        this.loadDocumentsByCase(caseId);
        this.analysisForm.patchValue({ documentId: null });
      } else {
        this.documentsList.set([]);
      }
    });
  }

  private loadAvailableModels(): void {
    this.aiService.getAvailableModels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (models) => {
          this.availableModels.set(models || []);
        },
        error: () => {
          this.availableModels.set([]);
        }
      });
  }

  private loadCurrentModel(): void {
    this.aiService.getCurrentModel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (model) => {
          if (model) {
            this.currentModel.set(model.model);
          }
        },
        error: () => {
          // Error handled by interceptor
        }
      });
  }

  private loadCases(): void {
    this.isLoadingCases.set(true);
    this.caseService.getCasesList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoadingCases.set(false);
          // Handle different response structures
          if (Array.isArray(response)) {
            this.casesList.set(response);
          } else if (response.data && Array.isArray(response.data)) {
            this.casesList.set(response.data);
          } else if (response.items && Array.isArray(response.items)) {
            this.casesList.set(response.items);
          } else {
            this.casesList.set([]);
          }
        },
        error: () => {
          this.isLoadingCases.set(false);
          this.casesList.set([]);
          this.toastr.error('فشل تحميل القضايا', 'خطأ');
        }
      });
  }

  private loadDocumentsByCase(caseId: number): void {
    this.isLoadingDocuments.set(true);
    this.documentService.getDocumentsByCasePost({ caseId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoadingDocuments.set(false);
          // Handle different response structures
          if (Array.isArray(response)) {
            this.documentsList.set(response);
          } else if (response.data && Array.isArray(response.data)) {
            this.documentsList.set(response.data);
          } else if (response.items && Array.isArray(response.items)) {
            this.documentsList.set(response.items);
          } else {
            this.documentsList.set([]);
          }
        },
        error: () => {
          this.isLoadingDocuments.set(false);
          this.documentsList.set([]);
          this.toastr.error('فشل تحميل المستندات', 'خطأ');
        }
      });
  }

  setAnalysisMode(mode: 'case-document' | 'file'): void {
    this.analysisMode.set(mode);
    this.analysisResult.set(null);
    this.resetForms();
  }

  private resetForms(): void {
    this.analysisForm.reset();
    this.selectedFile.set(null);
    this.documentsList.set([]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.toastr.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت', 'خطأ');
        input.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword',
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'text/plain', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('نوع الملف غير مدعوم. الأنواع المدعومة: PDF, Word, Text, Images', 'خطأ');
        input.value = '';
        return;
      }

      this.selectedFile.set(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  analyzeCaseDocument(): void {
    if (this.analysisForm.invalid) {
      this.toastr.warning('يرجى اختيار قضية على الأقل', 'تحذير');
      return;
    }

    const formValue = this.analysisForm.value;

    // Validate that either documentId is selected
    if (!formValue.documentId) {
      this.toastr.warning('يرجى اختيار مستند من القضية للتحليل', 'تحذير');
      return;
    }

    const request: CaseAnalysisRequestDto = {
      caseId: formValue.caseId,
      documentId: formValue.documentId
    };

    this.performAnalysis(request);
  }


  analyzeFile(): void {
    const file = this.selectedFile();
    if (!file) {
      this.toastr.warning('يرجى اختيار ملف للتحليل', 'تحذير');
      return;
    }

    this.isLoading.set(true);
    this.analysisResult.set(null);

    this.aiService.analyzeExternalFile(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.analysisResult.set(response.data);
            this.toastr.success('تم تحليل الملف بنجاح', 'نجح');
          } else {
            this.toastr.error(response.message || 'فشل تحليل الملف', 'خطأ');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error?.error?.message?.includes('not supported') || error?.error?.message?.includes('Unsupported')) {
            this.toastr.warning('نوع الملف غير مدعوم. الرجاء استخدام ملفات PDF أو Word أو Text', 'تنبيه', {
              timeOut: 5000
            });
          }
        }
      });
  }

  private performAnalysis(request: CaseAnalysisRequestDto): void {
    this.isLoading.set(true);
    this.analysisResult.set(null);

    this.aiService.analyzeCase(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.analysisResult.set(response.data);
            this.toastr.success('تم التحليل بنجاح', 'نجح');
          } else {
            this.toastr.error(response.message || 'فشل التحليل', 'خطأ');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error?.error?.message?.includes('not found')) {
            this.toastr.warning('القضية أو المستند المطلوب غير موجود', 'تنبيه', {
              timeOut: 5000
            });
          }
        }
    });
  }

  changeModel(modelId: string): void {
    if (!modelId) return;

    this.aiService.setDefaultModel(modelId).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentModel.set(modelId);
          this.toastr.success('تم تغيير النموذج بنجاح', 'نجح');
        } else {
          this.toastr.error(response.message || 'فشل تغيير النموذج', 'خطأ');
        }
      },
      error: () => {
        // Error handled by interceptor
      }
    });
  }

  getRiskLevelClass(level?: string): string {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
      case 'critical':
        return 'risk-critical';
      default:
        return '';
    }
  }

  getRiskLevelText(level?: string): string {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'منخفض';
      case 'medium':
        return 'متوسط';
      case 'high':
        return 'عالي';
      case 'critical':
        return 'حرج';
      default:
        return 'غير محدد';
    }
  }

  downloadAnalysisReport(): void {
    const result = this.analysisResult();
    if (!result) return;

    // إنشاء محتوى التقرير
    let reportContent = '=== تقرير تحليل القضية ===\n\n';

    // إضافة معلومات النموذج والتاريخ
    if (result.modelUsed) {
      reportContent += `النموذج المستخدم: ${result.modelUsed}\n`;
    }
    if (result.timestamp) {
      reportContent += `تاريخ التحليل: ${new Date(result.timestamp).toLocaleString('ar-EG')}\n`;
    }
    reportContent += '\n' + '='.repeat(60) + '\n\n';

    // إذا كان هناك محتوى كامل في pleaFull أو rawResponse، نستخدمه
    if (result.pleaFull || result.rawResponse) {
      const fullContent = result.pleaFull || result.rawResponse;

      // إزالة HTML tags وتنظيف المحتوى
      const cleanContent = fullContent!
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&lt;/g, '<')   // Replace &lt; with <
        .replace(/&gt;/g, '>')   // Replace &gt; with >
        .replace(/&amp;/g, '&')  // Replace &amp; with &
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove multiple blank lines

      reportContent += cleanContent;
    } else {
      // إذا لم يكن هناك محتوى كامل، نستخدم الحقول المنفصلة
      if (result.summary) {
        reportContent += `الملخص:\n${result.summary}\n\n`;
      }

      if (result.strengths && result.strengths.length > 0) {
        reportContent += 'نقاط القوة:\n';
        result.strengths.forEach((s, i) => {
          reportContent += `${i + 1}. ${s}\n`;
        });
        reportContent += '\n';
      }

      if (result.weaknesses && result.weaknesses.length > 0) {
        reportContent += 'نقاط الضعف:\n';
        result.weaknesses.forEach((w, i) => {
          reportContent += `${i + 1}. ${w}\n`;
        });
        reportContent += '\n';
      }

      if (result.recommendations && result.recommendations.length > 0) {
        reportContent += 'التوصيات:\n';
        result.recommendations.forEach((r, i) => {
          reportContent += `${i + 1}. ${r}\n`;
        });
        reportContent += '\n';
      }

      if (result.nextSteps && result.nextSteps.length > 0) {
        reportContent += 'الخطوات التالية:\n';
        result.nextSteps.forEach((step, i) => {
          reportContent += `${i + 1}. ${step}\n`;
        });
        reportContent += '\n';
      }

      if (result.riskAssessment) {
        reportContent += `\nتقييم المخاطر:\n`;
        reportContent += `المستوى: ${this.getRiskLevelText(result.riskAssessment.level)}\n`;
        reportContent += `النتيجة: ${result.riskAssessment.score}/100\n`;
      }
    }

    // إضافة تذييل
    reportContent += '\n\n' + '='.repeat(60) + '\n';
    reportContent += 'تم إنشاء هذا التقرير بواسطة نظام المحامي الذكي\n';
    reportContent += `تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}\n`;

    // تحميل التقرير
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير-تحليل-القضية-${new Date().getTime()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastr.success('تم تنزيل التقرير بنجاح', 'نجح');
  }

  formatAnalysisContent(content: string): string {
    if (!content) return '';

    // Convert markdown-like headings to HTML
    let formatted = content
      // Convert ### headings to h3
      .replace(/###\s+\*\*(.+?)\*\*/g, '<h3 class="legal-heading">$1</h3>')
      // Convert ### headings without bold
      .replace(/###\s+(.+?)$/gm, '<h3 class="legal-heading">$1</h3>')
      // Convert ** bold ** to <strong>
      .replace(/\*\*(.+?)\*\*/g, '<strong class="legal-bold">$1</strong>')
      // Convert lists
      .replace(/^\s*-\s+(.+?)$/gm, '<li class="legal-list-item">$1</li>')
      // Convert numbered lists
      .replace(/^\s*\d+\.\s+(.+?)$/gm, '<li class="legal-ordered-item">$1</li>')
      // Convert blockquotes (> text)
      .replace(/^>\s+(.+?)$/gm, '<blockquote class="legal-quote">$1</blockquote>')
      // Convert horizontal rules
      .replace(/^---$/gm, '<hr class="legal-divider">')
      // Convert line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Wrap consecutive <li> in <ul> or <ol>
    formatted = formatted.replace(/(<li class="legal-list-item">.*?<\/li>)+/g, '<ul class="legal-list">$&</ul>');
    formatted = formatted.replace(/(<li class="legal-ordered-item">.*?<\/li>)+/g, '<ol class="legal-ordered-list">$&</ol>');

    return formatted;
  }

  printAnalysisReport(): void {
    window.print();
  }

  clearAnalysis(): void {
    this.analysisResult.set(null);
    this.resetForms();
  }
}
