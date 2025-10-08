import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, interval, Subscription } from 'rxjs';


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
  constructor(private http: HttpClient) {}
  me(): Observable<Profile> { return this.http.get<Profile>(`/auth/me`); }
  update(p: Partial<Profile>): Observable<Profile> { return this.http.put<Profile>(`/auth/me`, p); }
}

// lightweight presence client
@Injectable({ providedIn: 'root' })
export class PresenceClient {
  private hb?: Subscription;
  constructor(private http: HttpClient) {}
  start(): void {
    if (this.hb) return;
    this.hb = interval(30000).subscribe(() => this.heartbeat().subscribe());
    this.heartbeat().subscribe();
  }
  stop(): void { this.hb?.unsubscribe(); this.hb = undefined; }
  heartbeat(): Observable<any> { return this.http.post('/api/presence/heartbeat', {}); }
  batch(users: string[]): Observable<Record<string, boolean>> { return this.http.post<Record<string, boolean>>('/api/presence/batch', { users }); }
}


