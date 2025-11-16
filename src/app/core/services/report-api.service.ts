import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CasesSummaryDto,
  SessionDto,
  LawyerWorkloadDto,
  ClientsSummaryDto,
  DashboardKpisDto
} from '../models/case-new.model';

@Injectable({
  providedIn: 'root'
})
export class ReportApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Reports`;

  casesSummary(): Observable<ApiResponse<CasesSummaryDto>> {
    return this.http.get<ApiResponse<CasesSummaryDto>>(`${this.apiUrl}/cases-summary`);
  }

  sessionsUpcoming(): Observable<ApiResponse<SessionDto[]>> {
    return this.http.get<ApiResponse<SessionDto[]>>(`${this.apiUrl}/sessions-upcoming`);
  }

  lawyersWorkload(): Observable<ApiResponse<LawyerWorkloadDto[]>> {
    return this.http.get<ApiResponse<LawyerWorkloadDto[]>>(`${this.apiUrl}/lawyers-workload`);
  }

  clientsSummary(): Observable<ApiResponse<ClientsSummaryDto>> {
    return this.http.get<ApiResponse<ClientsSummaryDto>>(`${this.apiUrl}/clients-summary`);
  }

  dashboardKpis(): Observable<ApiResponse<DashboardKpisDto>> {
    return this.http.get<ApiResponse<DashboardKpisDto>>(`${this.apiUrl}/dashboard-kpis`);
  }

  dashboardIndicators(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard/indicators`);
  }
}
