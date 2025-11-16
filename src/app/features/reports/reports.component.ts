import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportApiService } from '../../core/services/report-api.service';
import { SessionDto, CasesSummaryDto, LawyerWorkloadDto, ClientsSummaryDto, DashboardKpisDto } from '../../core/models/case-new.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportApiService = inject(ReportApiService);

  loading = signal(false);
  selectedReport = signal<string>('overview');

  // Report data
  kpis = signal<DashboardKpisDto | null>(null);
  casesSummary = signal<CasesSummaryDto | null>(null);
  upcomingSessions = signal<SessionDto[]>([]);
  lawyersWorkload = signal<LawyerWorkloadDto[]>([]);
  clientsSummary = signal<ClientsSummaryDto | null>(null);

  reportTypes = [
    { value: 'overview', label: 'نظرة عامة', icon: '📊' },
    { value: 'cases', label: 'تقرير القضايا', icon: '⚖️' },
    { value: 'sessions', label: 'تقرير الجلسات', icon: '📅' },
    { value: 'lawyers', label: 'تقرير المحامين', icon: '👨‍⚖️' },
    { value: 'clients', label: 'تقرير العملاء', icon: '👥' }
  ];

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);

    forkJoin({
      kpis: this.reportApiService.dashboardKpis(),
      casesSummary: this.reportApiService.casesSummary(),
      upcomingSessions: this.reportApiService.sessionsUpcoming(),
      lawyersWorkload: this.reportApiService.lawyersWorkload(),
      clientsSummary: this.reportApiService.clientsSummary()
    }).subscribe({
      next: (responses) => {
        if (responses.kpis.success) {
          this.kpis.set(responses.kpis.data);
        }
        if (responses.casesSummary.success) {
          this.casesSummary.set(responses.casesSummary.data);
        }
        if (responses.upcomingSessions.success) {
          this.upcomingSessions.set(responses.upcomingSessions.data || []);
        }
        if (responses.lawyersWorkload.success) {
          this.lawyersWorkload.set(responses.lawyersWorkload.data || []);
        }
        if (responses.clientsSummary.success) {
          this.clientsSummary.set(responses.clientsSummary.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.loading.set(false);
      }
    });
  }

  printReport() {
    window.print();
  }

  exportPDF() {
    // التحضير للطباعة كـ PDF
    const printContent = document.querySelector('.report-container');
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;

    // إنشاء صفحة للطباعة
    document.body.innerHTML = `
      <html dir="rtl">
        <head>
          <title>تقارير Smart Lawyer</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            @page { size: A4; margin: 2cm; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `;

    window.print();

    // استعادة المحتوى الأصلي
    document.body.innerHTML = originalContents;
    window.location.reload();
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

  getStatusPercentage(status: string): number {
    const summary = this.casesSummary();
    if (!summary || !summary.byStatus) return 0;
    const statusCount = summary.byStatus[status] || 0;
    return summary.total > 0 ? Math.round((statusCount / summary.total) * 100) : 0;
  }

  Math = Math;

  getCurrentDate(): string {
    return new Date().toISOString();
  }

  getReportTitle(): string {
    const report = this.reportTypes.find(r => r.value === this.selectedReport());
    return report ? report.label : 'التقارير';
  }
}
