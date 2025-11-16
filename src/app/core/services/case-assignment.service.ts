import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CaseAssignment,
  CaseAssignmentSearchDto,
  AssignCaseUserDto,
  UnassignCaseUserDto
} from '../models/case-assignment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaseAssignmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/CaseAssignments`;

  /**
   * Get list of case assignments
   * @param params Search parameters
   */
  list(params?: CaseAssignmentSearchDto): Observable<any> {
    const searchDto: CaseAssignmentSearchDto = {
      caseId: params?.caseId,
      userId: params?.userId,
      role: params?.role,
      activeOnly: params?.activeOnly ?? true,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10
    };

    return this.http.post<any>(`${this.apiUrl}/list`, searchDto);
  }

  /**
   * Get specific assignment by ID
   * @param id Assignment ID
   */
  get(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/get`, { id });
  }

  /**
   * Assign user to case
   * @param data Assignment data
   */
  assign(data: AssignCaseUserDto): Observable<any> {
    console.log('Assigning user to case:', data);
    return this.http.post<any>(`${this.apiUrl}/assign`, data);
  }

  /**
   * Unassign user from case
   * @param data Unassignment data
   */
  unassign(data: UnassignCaseUserDto): Observable<any> {
    console.log('Unassigning user from case:', data);
    return this.http.post<any>(`${this.apiUrl}/unassign`, data);
  }

  /**
   * Delete assignment (soft delete)
   * @param id Assignment ID
   */
  delete(id: number): Observable<any> {
    console.log('Deleting assignment:', id);
    return this.http.delete<any>(`${this.apiUrl}/delete`, { body: { id } });
  }

  /**
   * Restore deleted assignment
   * @param id Assignment ID
   */
  restore(id: number): Observable<any> {
    console.log('Restoring assignment:', id);
    return this.http.patch<any>(`${this.apiUrl}/restore`, { id });
  }
}
