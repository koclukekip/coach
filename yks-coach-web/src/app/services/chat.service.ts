import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as StompJs from '@stomp/stompjs';
// use dynamic import at runtime to avoid early evaluation
import { AuthService } from 'app/services/auth.service';

export interface ChatMessage {
  role: 'user' | 'coach';
  text: string;
  ts?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly _messages = new BehaviorSubject<ChatMessage[]>([]);
  readonly messages$ = this._messages.asObservable();
  private client: any;
  private connected = false;

  send(text: string): void {
    const now = Date.now();
    const current = this._messages.value;
    const next: ChatMessage[] = [...current, { role: 'user', text, ts: now }];
    this._messages.next(next as ChatMessage[]);
    this.persistActiveMessages();

    if (this.connected && this.client && this.activeConversationId != null) {
      const payload = { conversationId: this.activeConversationId, from: this.currentUsername || 'me', text } as any;
      this.client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
    }
  }

  private activeConversationId: number | null = null;
  private currentUsername: string | null = null;

  constructor(private auth: AuthService) {
    const token = this.auth.token;
    if (token) this.currentUsername = this.parseUsernameFromToken(token);
    // Attempt to restore last active conversation and its messages from storage
    try {
      const lastIdRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('lastActiveConversationId') : null;
      if (lastIdRaw) {
        const lastId = Number(lastIdRaw);
        if (!Number.isNaN(lastId)) {
          this.activeConversationId = lastId;
          const stored = this.loadMessagesFromStorage(lastId);
          if (stored && stored.length > 0) {
            this._messages.next(stored);
          }
        }
      }
    } catch {}
  }

  setActiveConversation(id: number): void {
    if (this.activeConversationId === id) {
      // already active; do not reset or resubscribe
      return;
    }
    this.activeConversationId = id;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('lastActiveConversationId', String(id)); } catch {}
    if (this.connected && this.client) {
      this.subscribeToActiveConversation();
    }
  }

  connect(token?: string): void {
    if (this.connected) return;
    // dynamic import so polyfills are already applied
    import('sockjs-client').then((mod) => {
      const SockJS = (mod as any).default || (mod as any);
      const socket = new SockJS('/ws');
      this.client = StompJs.Stomp.over(socket as any);
      const effectiveToken = token || this.auth.token || undefined;
      if (effectiveToken) this.currentUsername = this.parseUsernameFromToken(effectiveToken);
      const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {} as any;
      this.client.connect(headers, () => {
        this.connected = true;
        this.subscribeToActiveConversation();
      });
    });
  }

  private conversationSubscription: any;
  private subscribedConversationId: number | null = null;

  private subscribeToActiveConversation(): void {
    if (!this.client || this.activeConversationId == null) return;
    // If already subscribed to the same conversation, do nothing
    if (this.subscribedConversationId === this.activeConversationId && this.conversationSubscription) {
      return;
    }
    if (this.conversationSubscription) {
      try { this.conversationSubscription.unsubscribe?.(); } catch {}
      this.conversationSubscription = null;
    }
    this.conversationSubscription = this.client.subscribe(`/topic/conversations/${this.activeConversationId}`, (msg: any) => {
      try {
        const data = JSON.parse(msg.body) as { text: string; from: string };
        const role: 'user' | 'coach' = (this.currentUsername && data.from === this.currentUsername) ? 'user' : 'coach';
        if (role === 'coach') {
          const updated: ChatMessage[] = [...this._messages.value, { role, text: data.text, ts: Date.now() }];
          this._messages.next(updated);
          this.persistActiveMessages();
        }
      } catch {}
    });
    this.subscribedConversationId = this.activeConversationId;
  }

  private parseUsernameFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }

  getCurrentUsername(): string | null {
    return this.currentUsername;
  }

  replaceMessages(messages: ChatMessage[]): void {
    this._messages.next(messages);
    this.persistActiveMessages();
  }

  private storageKeyForConversation(id: number): string {
    return `conv_${id}_messages`;
  }

  private persistActiveMessages(): void {
    if (this.activeConversationId == null) return;
    try {
      if (typeof localStorage === 'undefined') return;
      const key = this.storageKeyForConversation(this.activeConversationId);
      localStorage.setItem(key, JSON.stringify(this._messages.value));
    } catch {}
  }

  private loadMessagesFromStorage(id: number): ChatMessage[] | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(this.storageKeyForConversation(id));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}



