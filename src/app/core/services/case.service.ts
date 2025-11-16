import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Case, CreateCaseRequest, CaseNote } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private http = inject(HttpClient);
  private apiUrl = '/api/cases'; // Update with your API URL

  getCases(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Observable<Case[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params = params.append(key, value);
        }
      });
    }

    return this.http.get<Case[]>(this.apiUrl, { params });
  }

  /**
   * Get cases list using POST method (for AI features)
   * Endpoint: /api/cases/list
   */
  getCasesList(searchDto?: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/list`, searchDto || {});
  }

  getCaseById(id: string): Observable<Case> {
    return this.http.get<Case>(`${this.apiUrl}/${id}`);
  }

  createCase(data: CreateCaseRequest): Observable<Case> {
    return this.http.post<Case>(this.apiUrl, data);
  }

  updateCase(id: string, data: Partial<Case>): Observable<Case> {
    return this.http.put<Case>(`${this.apiUrl}/${id}`, data);
  }

  deleteCase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addNote(caseId: string, content: string): Observable<CaseNote> {
    return this.http.post<CaseNote>(`${this.apiUrl}/${caseId}/notes`, { content });
  }

  getCaseNotes(caseId: string): Observable<CaseNote[]> {
    return this.http.get<CaseNote[]>(`${this.apiUrl}/${caseId}/notes`);
  }

  getCasesByClient(clientId: string): Observable<Case[]> {
    return this.http.get<Case[]>(`${this.apiUrl}/client/${clientId}`);
  }

  getCasesByLawyer(lawyerId: string): Observable<Case[]> {
    return this.http.get<Case[]>(`${this.apiUrl}/lawyer/${lawyerId}`);
  }

  getCaseStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }
}
