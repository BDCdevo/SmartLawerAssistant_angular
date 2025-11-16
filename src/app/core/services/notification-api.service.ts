import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { NotificationDto } from '../models/case-new.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Notifications`;

  unread(take: number = 20): Observable<ApiResponse<NotificationDto[]>> {
    return this.http.get<ApiResponse<NotificationDto[]>>(`${this.apiUrl}/unread?take=${take}`);
  }

  my(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<NotificationDto>>> {
    return this.http.get<ApiResponse<PagedResult<NotificationDto>>>(`${this.apiUrl}/my?page=${page}&pageSize=${pageSize}`);
  }

  markRead(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/mark-read/${id}`, {});
  }

  readAll(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/read-all`, {});
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
