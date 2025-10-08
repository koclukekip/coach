import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';

@Component({
  selector: 'app-coach-conversations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coach-conversations.component.html',
  styleUrl: './coach-conversations.component.scss'
})
export class CoachConversationsComponent {
  convs = signal<Conversation[]>([]);
  constructor(private conv: ConversationService, private schedule: ScheduleService) {
    this.refresh();
  }
  refresh() {
    this.conv.mine('coach').subscribe(list => {
      this.convs.set(list);
    });
  }
  accept(c: Conversation) {
    this.conv.accept(c.id).subscribe(() => {
      this.refresh();
      this.loadToday();
    });
  }

  // Scheduling state and helpers
  slots = signal<ScheduleSlot[]>([]);
  nextBooked = signal<ScheduleSlot | null>(null);

  private loadSlots(): void {
    // When chat is removed, we only compute nextBooked from coach-wide slots
    this.schedule.listForCoach().subscribe(list => {
      this.slots.set(list);
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

  // Today sessions
  todaySlots = signal<ScheduleSlot[]>([]);
  ngOnInit() { this.loadToday(); }
  private loadToday(): void {
    this.schedule.listForCoach().subscribe(list => {
      const now = new Date();
      const isToday = (iso: string) => new Date(iso).toDateString() === now.toDateString();
      const todays = list
        .filter(sl => sl.status === 'BOOKED' || sl.status === 'OPEN')
        .filter(sl => isToday(sl.start))
        .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      this.todaySlots.set(todays);
    });
  }

  // Derived for template (avoid complex expressions)
  pendingConversations(): Conversation[] { return this.convs().filter(c => c.status === 'PENDING'); }
}



