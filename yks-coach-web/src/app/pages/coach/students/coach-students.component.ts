import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from 'app/services/chat.service';
import { ConversationService, Conversation } from 'app/services/conversation.service';
import { MediaStreamModule } from 'app/directives/media-stream.module';
import { WebRtcService } from 'app/services/webrtc.service';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';
import { CoachAssignmentService, CoachAssignment } from 'app/services/coach-assignment.service';
import { PresenceClient } from 'app/services/profile.service';

@Component({
  selector: 'app-coach-students',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaStreamModule],
  templateUrl: './coach-students.component.html'
})
export class CoachStudentsComponent {
  @ViewChild('messagesBox') messagesBox?: ElementRef<HTMLDivElement>;
  
  students = signal<CoachAssignment[]>([]);
  studentToAssign = signal('');
  messages = signal<{ role: 'user'|'coach'; text: string; ts?: number }[]>([]);
  draft = signal('');
  activeConversationId: number | null = null;
  activeStudent = signal<string | null>(null);
  videoActive = signal(false);
  slots = signal<ScheduleSlot[]>([]);
  presenceMap = signal<Record<string, boolean>>({});
  constructor(private assignmentSrv: CoachAssignmentService, private chat: ChatService, private conv: ConversationService, public rtc: WebRtcService, private schedule: ScheduleService, private presence: PresenceClient) {
    this.assignmentSrv.myStudents().subscribe(list => { this.students.set(list); this.refreshPresence(); });
    this.chat.messages$.subscribe(ms => {
      this.messages.set(ms);
      // Yeni mesaj geldiğinde otomatik scroll
      this.safeScrollToBottom();
    });
    this.presence.start();
    // Periyodik presence yenilemesi
    setInterval(() => this.refreshPresence(), 30000);
  }
  private refreshPresence(): void {
    const users = this.students().map(s => s.studentUsername);
    if (!users.length) return;
    this.presence.batch(users).subscribe(map => this.presenceMap.set(map));
  }
  assign() {
    const username = this.studentToAssign().trim(); if (!username) return;
    this.assignmentSrv.assignStudent(username).subscribe(a => {
      this.studentToAssign.set('');
      this.students.set([a, ...this.students()]);
    });
  }
  openByStudent(studentUsername: string) {
    this.conv.mine('coach').subscribe(list => {
      const conv = list.find(c => c.studentUsername === studentUsername && c.status === 'ACCEPTED');
      if (!conv) return;
      this.openConversation(conv);
    });
  }
  private openConversation(c: Conversation) {
    this.chat.connect();
    this.activeConversationId = c.id;
    this.activeStudent.set(c.studentUsername);
    this.conv.history(c.id).subscribe(list => {
      const me = this.chat.getCurrentUsername();
      const mapped = list.map(m => ({ role: m.from === me ? 'user' : 'coach', text: m.text, ts: Date.parse(m.createdAt) }));
      this.chat.replaceMessages(mapped as any);
      this.chat.setActiveConversation(c.id);
      // Konuşma açıldığında scroll
      this.safeScrollToBottom();
    });
    this.schedule.list(c.id).subscribe(list => this.slots.set(list));
  }
  closeChat() { this.activeConversationId = null; this.activeStudent.set(null); this.videoActive.set(false); }
  toggleChat(studentUsername: string) {
    if (this.activeStudent() === studentUsername) { this.closeChat(); }
    else { this.openByStudent(studentUsername); }
  }
  send() { 
    const text = this.draft().trim(); 
    if (!text) return; 
    this.chat.send(text); 
    this.draft.set('');
    // Mesaj gönderildikten sonra scroll
    this.safeScrollToBottom();
  }
  localStream = () => this.rtc.localStream();
  remoteStream = () => this.rtc.remoteStream();
  toggleVideo() {
    if (!this.activeConversationId) return;
    if (!this.videoActive()) {
      this.videoActive.set(true);
      this.rtc.accept(this.activeConversationId);
    } else {
      this.videoActive.set(false);
      this.rtc.stop();
    }
  }
  isWithinActiveBookedWindow(): boolean {
    const now = Date.now();
    return this.slots().some(sl => sl.status === 'BOOKED' && now >= Date.parse(sl.start) && now <= Date.parse(sl.end));
  }
  isStudentActiveNow(studentUsername: string): boolean {
    return !!this.presenceMap()[studentUsername];
  }
  formatTs(ts?: number): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch { return ''; }
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



