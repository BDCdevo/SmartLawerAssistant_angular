import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { CourtDto, CreateCourtDto, UpdateCourtDto, CourtSearchDto } from '../models/case-new.model';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class CourtApiService extends BaseApiService {
  protected override get baseUrl(): string {
    return `${environment.apiUrl}/courts`;
  }

  list(searchDto: CourtSearchDto): Observable<ApiResponse<PagedResult<CourtDto>>> {
    return this.post('/list', searchDto, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 10 * 60 * 1000 } // 10 minutes (courts don't change often)
    });
  }

  getById(id: number): Observable<ApiResponse<CourtDto>> {
    return this.post('/get', { id }, {
      retry: { count: 2, delay: 1000 },
      cache: { enabled: true, ttl: 15 * 60 * 1000 } // 15 minutes
    });
  }

  create(dto: CreateCourtDto): Observable<ApiResponse<CourtDto>> {
    return this.post('/create', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  update(dto: UpdateCourtDto): Observable<ApiResponse<CourtDto>> {
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
