import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { CaseDto, CreateCaseDto, UpdateCaseDto, CaseSearchDto } from '../models/case-new.model';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class CaseApiService extends BaseApiService {
  protected override get baseUrl(): string {
    return `${environment.apiUrl}/cases`;
  }

  /**
   * List cases with search filters
   * Uses caching for better performance
   */
  list(searchDto: CaseSearchDto): Observable<ApiResponse<PagedResult<CaseDto>>> {
    return this.post<ApiResponse<PagedResult<CaseDto>>>('/list', searchDto, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 2 * 60 * 1000 } // Cache for 2 minutes
    });
  }

  /**
   * Get case by ID
   * Uses caching
   */
  getById(id: number): Observable<ApiResponse<CaseDto>> {
    return this.post<ApiResponse<CaseDto>>('/get', { id }, {
      retry: { count: 2, delay: 1000 },
      cache: { enabled: true, ttl: 5 * 60 * 1000 } // Cache for 5 minutes
    });
  }

  /**
   * Create new case
   * Invalidates list cache automatically
   */
  create(dto: CreateCaseDto): Observable<ApiResponse<CaseDto>> {
    return this.post<ApiResponse<CaseDto>>('/create', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  /**
   * Update existing case
   * Invalidates related cache automatically
   */
  update(dto: UpdateCaseDto): Observable<ApiResponse<CaseDto>> {
    return this.put<ApiResponse<CaseDto>>('/update', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  /**
   * Delete case
   * Invalidates related cache automatically
   */
  deleteCase(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/delete`, {
      body: { id },
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
