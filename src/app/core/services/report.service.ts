import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStatistics {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  pendingCases: number;
  totalClients: number;
  totalDocuments: number;
  upcomingHearings: number;
  recentActivities: RecentActivity[];
  casesByStatus: CaseStatusCount[];
  casesByPriority: CasePriorityCount[];
  monthlyStats: MonthlyStatistics[];
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface CaseStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface CasePriorityCount {
  priority: string;
  count: number;
  percentage: number;
}

export interface MonthlyStatistics {
  month: string;
  year: number;
  totalCases: number;
  closedCases: number;
  revenue?: number;
}

export interface CaseReport {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  clientName: string;
  lawyerName: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface FinancialReport {
  totalRevenue: number;
  pendingPayments: number;
  paidAmount: number;
  monthlyRevenue: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getDashboardStatistics(): Observable<DashboardStatistics> {
    return this.http.get<DashboardStatistics>(`${this.apiUrl}/dashboard`);
  }

  getCaseReports(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
  }): Observable<CaseReport[]> {
    return this.http.get<CaseReport[]>(`${this.apiUrl}/cases`, { params: filters as any });
  }

  getFinancialReport(startDate?: string, endDate?: string): Observable<FinancialReport> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.http.get<FinancialReport>(`${this.apiUrl}/financial`, { params });
  }

  exportReport(type: string, format: 'pdf' | 'excel' | 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/${type}/${format}`, {
      responseType: 'blob'
    });
  }
}
