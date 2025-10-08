import { Component, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { ChatService } from 'app/services/chat.service';
import { WebRtcService } from 'app/services/webrtc.service';
import { MediaStreamModule } from 'app/directives/media-stream.module';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';
import { forkJoin } from 'rxjs';
import { PresenceClient } from 'app/services/profile.service';
 

@Component({
  selector: 'app-student-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaStreamModule],
  templateUrl: './student-conversations.component.html',
  styleUrl: './student-conversations.component.scss'
})
export class StudentConversationsComponent implements OnDestroy {
  @ViewChild('messagesBox') messagesBox?: ElementRef<HTMLDivElement>;
  convs = signal<Conversation[]>([]);
  coach = signal('');
  messages = signal<{ role: 'user'|'coach'; text: string; ts?: number }[]>([]);
  draft = signal('');
  activeId = signal<number | null>(null);
  presence = signal<Record<string, boolean>>({});
  constructor(private conv: ConversationService, private chat: ChatService, public rtc: WebRtcService, private schedule: ScheduleService, private presenceClient: PresenceClient) {
    this.refresh();
    this.chat.messages$.subscribe(ms => {
      this.messages.set(ms);
      this.safeScrollToBottom();
      // auto mark read when a new coach message arrives and a conversation is active
      const id = this.activeId();
      if (!id || ms.length === 0) return;
      const last = ms[ms.length - 1];
      if (last.role === 'coach') {
        this.conv.markRead(id, 'student').subscribe();
      }
    });
    this.presenceClient.start();
    // initialize current month bounds and default selected date
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    this.monthStart.set(toYmd(start));
    this.monthEnd.set(toYmd(end));
    this.selectedDate.set(toYmd(now));
  }
  ngOnDestroy(): void {
    try { this.presenceClient.stop(); } catch {}
    try { this.rtc.stop(); } catch {}
  }
  refresh() {
    this.conv.mine('student').subscribe(list => {
      this.convs.set(list);
      this.refreshPresence();
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
  private refreshPresence(): void {
    const coaches = Array.from(new Set(this.convs().map(c => c.coachUsername)));
    if (!coaches.length) return;
    this.presenceClient.batch(coaches).subscribe(map => this.presence.set(map));
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
      // mark read for student
      this.conv.markRead(c.id, 'student').subscribe();
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
  isCoachActiveNow(c: Conversation): boolean {
    return !!this.presence()[c.coachUsername];
  }

  // Scheduling state and helpers
  slots = signal<ScheduleSlot[]>([]);
  nextBooked = signal<ScheduleSlot | null>(null);
  selectedDate = signal<string>(''); // yyyy-MM-dd
  monthStart = signal<string>('');   // yyyy-MM-dd
  monthEnd = signal<string>('');     // yyyy-MM-dd

  private loadSlots(): void {
    const id = this.activeId();
    if (!id) return;
    const conv = this.convs().find(c => c.id === id);
    if (conv) {
      forkJoin({ own: this.schedule.list(id), open: this.schedule.listCoachOpen(conv.coachUsername) }).subscribe(({ own, open }) => {
        const byId = new Map<number, ScheduleSlot>();
        for (const s of own) byId.set(s.id, s);
        for (const s of open) if (!byId.has(s.id)) byId.set(s.id, s);
        const merged = Array.from(byId.values()).sort((a,b)=>a.start.localeCompare(b.start));
        this.slots.set(merged);
        this.computeNextBooked();
      });
    } else {
      this.schedule.list(id).subscribe(list => {
        this.slots.set(list);
        this.computeNextBooked();
      });
    }
  }

  bookSlot(slotId: number): void {
    this.schedule.book(slotId).subscribe(updated => {
      this.slots.set(this.slots().map(s => s.id === updated.id ? updated : s));
      this.computeNextBooked();
    });
  }

  // Student requests a new slot (await coach approval)
  requestSlot(startInput: string, endInput: string, title?: string): void {
    const id = this.activeId(); if (!id) return;
    // convert possible datetime-local values to ISO
    const startIso = new Date(startInput).toISOString();
    const endIso = new Date(endInput).toISOString();
    this.schedule.request(id, startIso, endIso, title).subscribe(sl => {
      this.slots.set([...this.slots(), sl]);
      this.computeNextBooked();
    });
  }

  // Build 30-min grid for selected day. States:
  // - 'open': overlaps coach OPEN slot
  // - 'blocked': overlaps BOOKED or REQUESTED
  // - 'requestable': no overlap; student may request
  dayGrid(): { start: string; end: string; label: string; state: 'open'|'blocked'|'requestable' }[] {
    const dateStr = this.selectedDate();
    if (!dateStr) return [];
    // Coach availability window: 08:00 through 22:30
    const businessStartHour = 8;
    const businessEndHour = 22; // we'll include 22:30 via minutes loop
    const day = new Date(dateStr + 'T00:00:00');
    const blocks: { start: string; end: string; label: string; state: 'open'|'blocked'|'requestable' }[] = [];
    for (let h = businessStartHour; h <= businessEndHour; h++) {
      const minutesArr = h === businessEndHour ? [0, 30] : [0, 30];
      for (const m of minutesArr) {
        if (h === businessEndHour && m > 30) continue; // cap at 22:30
        const s = new Date(day); s.setHours(h, m, 0, 0);
        const e = new Date(s); e.setMinutes(s.getMinutes() + 30);
        const startIso = s.toISOString();
        const endIso = e.toISOString();
        const label = `${s.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })} - ${e.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}`;
        // determine state by overlap with existing slots
        // default policy: everything is open unless blocked by BOOKED/REQUESTED
        let state: 'open'|'blocked'|'requestable' = 'open';
        const os = s.getTime(); const oe = e.getTime();
        for (const sl of this.slots()) {
          const ss = Date.parse(sl.start); const se = Date.parse(sl.end);
          const overlaps = os < se && oe > ss;
          if (!overlaps) continue;
          if (sl.status === 'BOOKED' || sl.status === 'REQUESTED') { state = 'blocked'; break; }
        }
        blocks.push({ start: startIso, end: endIso, label, state });
      }
    }
    return blocks;
  }

  requestHalfHour(startIso: string, endIso: string): void {
    const id = this.activeId(); if (!id) return;
    // prevent duplicate/overlapping request if already REQUESTED/BOOKED exists for interval
    const sMs = Date.parse(startIso), eMs = Date.parse(endIso);
    const overlapsExisting = this.slots().some(sl => {
      if (sl.status === 'BOOKED' || sl.status === 'REQUESTED') {
        const ss = Date.parse(sl.start), se = Date.parse(sl.end);
        return sMs < se && eMs > ss;
      }
      return false;
    });
    if (overlapsExisting) return;
    this.schedule.request(id, startIso, endIso, 'Randevu Talebi').subscribe(sl => {
      this.slots.set([...this.slots(), sl]);
      this.computeNextBooked();
    });
  }

  onDateChange(val: string): void {
    const start = this.monthStart(); const end = this.monthEnd();
    if (!val) { this.selectedDate.set(start); return; }
    const clamped = val < start ? start : (val > end ? end : val);
    this.selectedDate.set(clamped);
    // refresh slots to reflect latest coach availability
    this.loadSlots();
  }

  hasOpenBlocks(): boolean {
    return this.dayGrid().some(b => b.state === 'open');
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


