import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conversation {
  id: number;
  studentUsername: string;
  coachUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ConversationMessage {
  id: number;
  from: string;
  text: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private http: HttpClient) {}

  request(coachUsername: string): Observable<Conversation> {
    return this.http.post<Conversation>(`/api/conversations/request`, { coachUsername });
  }

  accept(id: number): Observable<Conversation> {
    return this.http.post<Conversation>(`/api/conversations/${id}/accept`, {});
  }

  mine(role: 'coach' | 'student'): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`/api/conversations/mine`, { params: { role } });
  }

  history(conversationId: number): Observable<ConversationMessage[]> {
    return this.http.get<ConversationMessage[]>(`/api/conversations/${conversationId}/messages`);
  }

  markRead(conversationId: number, role: 'coach'|'student') {
    return this.http.post(`/api/conversations/${conversationId}/read`, null, { params: { role } });
  }
}


