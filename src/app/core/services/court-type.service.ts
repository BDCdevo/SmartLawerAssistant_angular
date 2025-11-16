import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourtType, CreateCourtTypeDto, UpdateCourtTypeDto } from '../models/court-type.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourtTypeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/CourtTypes`;

  list(q?: string, isActive?: boolean): Observable<any> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<any>(`${this.apiUrl}/list`, { params });
  }

  get(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/get`, { id });
  }

  create(data: CreateCourtTypeDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, data);
  }

  update(data: UpdateCourtTypeDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete`, { body: { id } });
  }

  restore(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/restore`, { id });
  }
}
