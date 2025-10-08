import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-schedule.component.html',
  styleUrl: './student-schedule.component.scss'
})
export class StudentScheduleComponent {
  convs = signal<Conversation[]>([]);
  slots = signal<ScheduleSlot[]>([]);
  selectedDate = signal<string>(''); // yyyy-MM-dd
  monthStart = signal<string>('');   // yyyy-MM-dd
  monthEnd = signal<string>('');     // yyyy-MM-dd

  constructor(private conv: ConversationService, private schedule: ScheduleService) {
    this.refresh();
    // initialize current month bounds and default selected date
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    this.monthStart.set(toYmd(start));
    this.monthEnd.set(toYmd(end));
    this.selectedDate.set(toYmd(now));
  }

  refresh() {
    this.conv.mine('student').subscribe(list => {
      this.convs.set(list);
      // Load slots for accepted conversations
      const accepted = list.find(c => c.status === 'ACCEPTED');
      if (accepted) {
        this.loadSlots(accepted.id);
      }
    });
  }

  private loadSlots(conversationId: number): void {
    this.schedule.list(conversationId).subscribe(list => {
      this.slots.set(list);
    });
  }

  // Student requests a new slot (await coach approval)
  requestSlot(startInput: string, endInput: string, title?: string): void {
    const accepted = this.convs().find(c => c.status === 'ACCEPTED');
    if (!accepted) return;
    // convert possible datetime-local values to ISO
    const startIso = new Date(startInput).toISOString();
    const endIso = new Date(endInput).toISOString();
    this.schedule.request(accepted.id, startIso, endIso, title).subscribe(sl => {
      this.slots.set([...this.slots(), sl]);
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
    const accepted = this.convs().find(c => c.status === 'ACCEPTED');
    if (!accepted) return;
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
    this.schedule.request(accepted.id, startIso, endIso, 'Randevu Talebi').subscribe(sl => {
      this.slots.set([...this.slots(), sl]);
    });
  }

  onDateChange(val: string): void {
    const start = this.monthStart(); const end = this.monthEnd();
    if (!val) { this.selectedDate.set(start); return; }
    const clamped = val < start ? start : (val > end ? end : val);
    this.selectedDate.set(clamped);
    // refresh slots to reflect latest coach availability
    const accepted = this.convs().find(c => c.status === 'ACCEPTED');
    if (accepted) {
      this.loadSlots(accepted.id);
    }
  }

  hasOpenBlocks(): boolean {
    return this.dayGrid().some(b => b.state === 'open');
  }

  hasAccepted(): boolean { 
    return this.convs().some(c => c.status === 'ACCEPTED'); 
  }

  formatRange(startIso: string, endIso: string): string {
    const s = new Date(startIso); const e = new Date(endIso);
    const sStr = s.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const eStr = e.toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `${sStr} - ${eStr}`;
  }
}
