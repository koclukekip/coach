import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { ChatService } from 'app/services/chat.service';
import { WebRtcService } from 'app/services/webrtc.service';
import { MediaStreamModule } from 'app/directives/media-stream.module';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';
 

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
  constructor(private conv: ConversationService, private chat: ChatService, public rtc: WebRtcService, private schedule: ScheduleService) {
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
    // Ensure subscription to this conversation happens before history load
    this.chat.setActiveConversation(c.id);
    this.conv.history(c.id).subscribe(list => {
      const me = this.chat.getCurrentUsername();
      const mapped = list.map(m => ({ role: m.from === me ? 'user' : 'coach', text: m.text, ts: Date.parse(m.createdAt) }));
      this.chat.replaceMessages(mapped as any);
      this.safeScrollToBottom();
    });
    this.loadSlots();
  }
  close(): void { this.activeId.set(null); this.videoActive.set(false); }
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

  // Derived helpers for UI rules
  hasAccepted(): boolean { return this.convs().some(c => c.status === 'ACCEPTED'); }
  visibleConversations(): Conversation[] { return this.hasAccepted() ? this.convs().filter(c => c.status === 'ACCEPTED') : this.convs(); }

  openIfClosed(c: Conversation, ev?: Event) {
    if (ev) ev.stopPropagation();
    if (this.activeId() === c.id) { this.close(); return; }
    if (c.status === 'ACCEPTED') this.open(c);
  }

  toggle(c: Conversation, ev?: Event) { this.openIfClosed(c, ev); }
  isCoachActiveNow(c: Conversation): boolean { return this.activeId()===c.id && this.isWithinActiveBookedWindow(); }

  // Scheduling state and helpers
  slots = signal<ScheduleSlot[]>([]);
  nextBooked = signal<ScheduleSlot | null>(null);

  private loadSlots(): void {
    const id = this.activeId();
    if (!id) return;
    this.schedule.list(id).subscribe(list => {
      this.slots.set(list);
      this.computeNextBooked();
    });
  }

  bookSlot(slotId: number): void {
    this.schedule.book(slotId).subscribe(updated => {
      this.slots.set(this.slots().map(s => s.id === updated.id ? updated : s));
      this.computeNextBooked();
    });
  }

  isWithinActiveBookedWindow(): boolean {
    const now = Date.now();
    return this.slots().some(sl => sl.status === 'BOOKED' && now >= Date.parse(sl.start) && now <= Date.parse(sl.end));
  }

  private computeNextBooked(): void {
    const now = Date.now();
    const upcoming = this.slots()
      .filter(sl => sl.status === 'BOOKED' && Date.parse(sl.end) > now)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    this.nextBooked.set(upcoming[0] || null);
  }

  formatRange(startIso: string, endIso: string): string {
    const s = new Date(startIso); const e = new Date(endIso);
    const sStr = s.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const eStr = e.toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `${sStr} - ${eStr}`;
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


