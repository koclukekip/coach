import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  username: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly backendBase = 'http://localhost:8080';
  constructor(private http: HttpClient) {}
  me(): Observable<Profile> { return this.http.get<Profile>(`${this.backendBase}/auth/me`); }
  update(p: Partial<Profile>): Observable<Profile> { return this.http.put<Profile>(`${this.backendBase}/auth/me`, p); }
}


