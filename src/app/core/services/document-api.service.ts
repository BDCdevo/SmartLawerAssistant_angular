import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { DocumentDto, DocumentSearchDto, CaseDocumentSearchDto } from '../models/case-new.model';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentApiService extends BaseApiService {
  protected override get baseUrl(): string {
    return `${environment.apiUrl}/documents`;
  }

  list(searchDto: DocumentSearchDto): Observable<ApiResponse<PagedResult<DocumentDto>>> {
    return this.post('/list', searchDto, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 2 * 60 * 1000 } // 2 minutes
    });
  }

  listByCase(searchDto: CaseDocumentSearchDto): Observable<ApiResponse<PagedResult<DocumentDto>>> {
    return this.post('/list-by-case', searchDto, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 2 * 60 * 1000 } // 2 minutes
    });
  }

  upload(formData: FormData): Observable<ApiResponse<DocumentDto>> {
    return this.post('/upload', formData, {
      retry: { count: 1, delay: 2000 }
      // No caching for uploads
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

  download(id: number): Observable<Blob> {
    // Download doesn't use base service (different response type)
    return this.http.post(`${this.baseUrl}/download`, { id }, {
      responseType: 'blob',
      headers: { skipLoading: 'true' } // Don't show global loading for downloads
    });
  }

  // AI Analysis endpoints
  analyzeDocument(id: number, force: boolean = false): Observable<ApiResponse<any>> {
    const url = force ? '/analysis/analyze?force=true' : '/analysis/analyze';
    return this.post(url, { id }, {
      retry: { count: 1, delay: 2000 }
    });
  }

  getDocumentAnalysis(id: number): Observable<ApiResponse<any>> {
    return this.post('/analysis/get', { id }, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 5 * 60 * 1000 } // 5 minutes
    });
  }

  reanalyzeDocument(id: number): Observable<ApiResponse<any>> {
    return this.post('/analysis/reanalyze', { id }, {
      retry: { count: 1, delay: 2000 }
    });
  }
}
