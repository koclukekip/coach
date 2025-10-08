import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { ChatService } from 'app/services/chat.service';
import { WebRtcService } from 'app/services/webrtc.service';
import { MediaStreamModule } from 'app/directives/media-stream.module';
 

@Component({
  selector: 'app-student-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaStreamModule],
  templateUrl: './student-conversations.component.html',
  styleUrl: './student-conversations.component.scss'
})
export class StudentConversationsComponent {
  @ViewChild('messagesBox') messagesBox?: ElementRef<HTMLDivElement>;
  convs = signal<Conversation[]>([]);
  coach = signal('');
  messages = signal<{ role: 'user'|'coach'; text: string; ts?: number }[]>([]);
  draft = signal('');
  activeId = signal<number | null>(null);
  constructor(private conv: ConversationService, private chat: ChatService, public rtc: WebRtcService) {
    this.refresh();
    this.chat.messages$.subscribe(ms => { this.messages.set(ms); this.safeScrollToBottom(); });
  }
  refresh() {
    this.conv.mine('student').subscribe(list => {
      this.convs.set(list);
      // Prefer last active conversation if stored and present
      if (!this.activeId()) {
        let lastId: number | null = null;
        try { const v = typeof localStorage !== 'undefined' ? localStorage.getItem('lastActiveConversationId') : null; lastId = v ? Number(v) : null; } catch {}
        const last = list.find(x => x.id === lastId && x.status === 'ACCEPTED');
        if (last) {
          this.open(last);
          return;
        }
        // Fallback: auto-open first accepted if none active
        const firstAccepted = list.find(x => x.status === 'ACCEPTED');
        if (firstAccepted) this.open(firstAccepted);
      }
    });
  }
  request() { this.conv.request(this.coach()).subscribe(() => { this.coach.set(''); this.refresh(); }); }
  open(c: Conversation) {
    this.chat.connect();
    this.activeId.set(c.id);
    this.conv.history(c.id).subscribe(list => {
      const me = this.chat.getCurrentUsername();
      const mapped = list.map(m => ({ role: m.from === me ? 'user' : 'coach', text: m.text, ts: Date.parse(m.createdAt) }));
      this.chat.replaceMessages(mapped as any);
      this.chat.setActiveConversation(c.id);
      this.safeScrollToBottom();
    });
  }
  send() { const text = this.draft().trim(); if (!text) return; this.chat.send(text); this.draft.set(''); }
  videoActive = signal(false);
  localStream = () => this.rtc.localStream();
  remoteStream = () => this.rtc.remoteStream();
  toggleVideo() {
    const id = this.activeId();
    if (!id) return;
    if (!this.videoActive()) {
      this.videoActive.set(true);
      this.rtc.start(id);
    } else {
      this.videoActive.set(false);
      this.rtc.stop();
    }
  }

  openIfClosed(c: Conversation, ev?: Event) {
    if (ev) ev.stopPropagation();
    if (this.activeId() === c.id) return;
    if (c.status === 'ACCEPTED') this.open(c);
  }

  formatTime(ts?: number) { if (!ts) return ''; const d = new Date(ts); return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
  formatDay(ts?: number) { if (!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  isNewDay(i: number) {
    if (i === 0) return true;
    const prev = this.messages()[i-1]?.ts; const cur = this.messages()[i]?.ts;
    if (!prev || !cur) return false;
    const dp = new Date(prev); const dc = new Date(cur);
    return dp.getFullYear()!==dc.getFullYear() || dp.getMonth()!==dc.getMonth() || dp.getDate()!==dc.getDate();
  }

  private safeScrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesBox?.nativeElement;
      if (!el) return;
      // run twice to ensure after ngFor renders
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }
}


