import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document, UploadDocumentRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/documents'; // Update with your API URL

  getDocuments(filters?: {
    caseId?: string;
    clientId?: string;
    category?: string;
  }): Observable<Document[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params = params.append(key, value);
        }
      });
    }

    return this.http.get<Document[]>(this.apiUrl, { params });
  }

  getDocumentById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${id}`);
  }

  uploadDocument(data: UploadDocumentRequest): Observable<Document> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    formData.append('category', data.category);

    if (data.caseId) {
      formData.append('caseId', data.caseId);
    }

    if (data.clientId) {
      formData.append('clientId', data.clientId);
    }

    if (data.tags) {
      formData.append('tags', JSON.stringify(data.tags));
    }

    return this.http.post<Document>(this.apiUrl, formData);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  getDocumentsByCase(caseId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/case/${caseId}`);
  }

  getDocumentsByClient(clientId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/client/${clientId}`);
  }
}
