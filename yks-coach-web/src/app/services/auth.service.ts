import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSignal = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  constructor(private http: HttpClient) {}

  get token(): string | null { return this.tokenSignal(); }
  isAuthenticated() { return !!this.tokenSignal(); }

  requireAuth(): boolean {
    return this.isAuthenticated();
  }
  isCoach(): boolean {
    const t = this.tokenSignal();
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1] ?? ''));
      return payload?.role === 'COACH' || payload?.role === 'ADMIN';
    } catch { return false; }
  }

  register(username: string, password: string, fullName?: string, email?: string, phone?: string, role?: 'USER' | 'COACH'): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`/auth/register`, { username, password, fullName, email, phone, role }).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`/auth/login`, { username, password }).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  logout(): void {
    this.setToken(null);
  }

  private setToken(token: string | null): void {
    this.tokenSignal.set(token);
    try {
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
      }
    } catch {}
  }
}


