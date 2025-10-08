import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SlotStatus = 'OPEN' | 'REQUESTED' | 'BOOKED' | 'REJECTED' | 'CANCELLED';

export interface ScheduleSlot {
  id: number;
  conversationId: number;
  start: string; // ISO string
  end: string;   // ISO string
  status: SlotStatus;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient) {}

  list(conversationId: number): Observable<ScheduleSlot[]> {
    return this.http.get<ScheduleSlot[]>(`/api/schedule/conversations/${conversationId}/slots`);
  }

  create(conversationId: number, startIso: string, endIso: string, title?: string): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/conversations/${conversationId}/slots`, { start: startIso, end: endIso, title });
  }

  // Student requests a slot (awaiting coach approval)
  request(conversationId: number, startIso: string, endIso: string, title?: string): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/conversations/${conversationId}/request`, { start: startIso, end: endIso, title });
  }

  listForCoach(): Observable<ScheduleSlot[]> {
    return this.http.get<ScheduleSlot[]>(`/api/schedule/coach`);
  }

  createForCoach(studentUsername: string, startIso: string, endIso: string, title?: string): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/coach/slots?studentUsername=${encodeURIComponent(studentUsername)}`, { start: startIso, end: endIso, title });
  }

  book(slotId: number): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/slots/${slotId}/book`, {});
  }

  cancel(slotId: number): Observable<void> {
    return this.http.post<void>(`/api/schedule/slots/${slotId}/cancel`, {});
  }

  // Coach actions
  approve(slotId: number): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/slots/${slotId}/approve`, {});
  }

  reject(slotId: number): Observable<ScheduleSlot> {
    return this.http.post<ScheduleSlot>(`/api/schedule/slots/${slotId}/reject`, {});
  }

  // Public coach availability (OPEN only)
  listCoachOpen(coachUsername: string): Observable<ScheduleSlot[]> {
    return this.http.get<ScheduleSlot[]>(`/api/schedule/coach/${encodeURIComponent(coachUsername)}/open`);
  }
}


