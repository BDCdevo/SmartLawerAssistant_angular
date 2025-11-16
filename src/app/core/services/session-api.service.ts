import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { SessionDto, CreateSessionDto, UpdateSessionDto, SessionSearchDto } from '../models/case-new.model';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService extends BaseApiService {
  protected override get baseUrl(): string {
    return `${environment.apiUrl}/sessions`;
  }

  list(searchDto: SessionSearchDto): Observable<ApiResponse<PagedResult<SessionDto>>> {
    return this.post('/list', searchDto, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 1 * 60 * 1000 } // 1 minute (sessions change frequently)
    });
  }

  getById(id: number): Observable<ApiResponse<SessionDto>> {
    return this.post('/get', { id }, {
      retry: { count: 2, delay: 1000 },
      cache: { enabled: true, ttl: 3 * 60 * 1000 } // 3 minutes
    });
  }

  create(dto: CreateSessionDto): Observable<ApiResponse<SessionDto>> {
    return this.post('/create', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  update(dto: UpdateSessionDto): Observable<ApiResponse<SessionDto>> {
    return this.put('/update', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/delete`, {
      body: { id }
    });
  }

  restore(id: number): Observable<ApiResponse<void>> {
    return this.patch('/restore', { id }, {
      retry: { count: 1, delay: 1000 }
    });
  }
}
