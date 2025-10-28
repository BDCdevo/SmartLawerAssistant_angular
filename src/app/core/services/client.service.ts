import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, CreateClientRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = '/api/clients'; // Update with your API URL

  getClients(search?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (search) {
      params = params.append('search', search);
    }
    return this.http.get<Client[]>(this.apiUrl, { params });
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(data: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data);
  }

  updateClient(id: string, data: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, data);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getClientCases(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/cases`);
  }
}
