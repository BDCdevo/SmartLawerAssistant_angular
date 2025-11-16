import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Nationality,
  CreateNationalityDto,
  UpdateNationalityDto,
  NationalitySearchParams,
  IdDto
} from '../models/nationality.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NationalityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Nationalities`;

  /**
   * Get list of nationalities
   * @param params Search parameters
   */
  getList(params?: NationalitySearchParams): Observable<any> {
    let httpParams = new HttpParams();

    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/list`, { params: httpParams });
  }

  /**
   * Get nationality by ID
   * @param id Nationality ID
   */
  getById(id: number): Observable<any> {
    const idDto: IdDto = { id };
    return this.http.post<any>(`${this.apiUrl}/getById`, idDto);
  }

  /**
   * Create new nationality
   * @param data Nationality data
   */
  create(data: CreateNationalityDto): Observable<any> {
    console.log('Creating nationality:', data);
    return this.http.post<any>(`${this.apiUrl}/create`, data);
  }

  /**
   * Update existing nationality
   * @param data Nationality data with ID
   */
  update(data: UpdateNationalityDto): Observable<any> {
    console.log('Updating nationality:', data);
    return this.http.put<any>(`${this.apiUrl}/update`, data);
  }

  /**
   * Soft delete nationality
   * @param id Nationality ID
   */
  delete(id: number): Observable<any> {
    const idDto: IdDto = { id };
    console.log('Deleting nationality:', id);
    return this.http.delete<any>(`${this.apiUrl}/delete`, { body: idDto });
  }

  /**
   * Restore deleted nationality
   * @param id Nationality ID
   */
  restore(id: number): Observable<any> {
    const idDto: IdDto = { id };
    console.log('Restoring nationality:', id);
    return this.http.patch<any>(`${this.apiUrl}/restore`, idDto);
  }
}
