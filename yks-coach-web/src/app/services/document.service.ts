import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocItem { id: number; filename: string; }

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  list(): Observable<DocItem[]> { return this.http.get<DocItem[]>(`/api/docs`); }
  upload(file: File): Observable<DocItem> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<DocItem>(`/api/docs`, form);
  }
  downloadUrl(id: number): string { return `/api/docs/${id}`; }
}


