import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.model';
import { ClientDto, CreateClientDto, UpdateClientDto } from '../models/case-new.model';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class ClientApiService extends BaseApiService {
  protected override get baseUrl(): string {
    return `${environment.apiUrl}/clients`;
  }

  list(): Observable<ApiResponse<PagedResult<ClientDto>>> {
    console.log('ClientApiService.list() - URL:', `${this.baseUrl}/list`);
    return this.post('/list', {}, {
      retry: { count: 2, delay: 1000, backoff: true },
      cache: { enabled: true, ttl: 3 * 60 * 1000 } // 3 minutes
    });
  }

  getById(id: number): Observable<ApiResponse<ClientDto>> {
    return this.post('/get', { id }, {
      retry: { count: 2, delay: 1000 },
      cache: { enabled: true, ttl: 5 * 60 * 1000 } // 5 minutes
    });
  }

  create(dto: CreateClientDto): Observable<ApiResponse<ClientDto>> {
    return this.post('/create', dto, {
      retry: { count: 1, delay: 1500 }
    });
  }

  update(dto: UpdateClientDto): Observable<ApiResponse<ClientDto>> {
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
