import { Component, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService, ScheduleSlot } from 'app/services/schedule.service';
import { CoachAssignmentService, CoachAssignment } from 'app/services/coach-assignment.service';

@Component({
  selector: 'app-coach-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-calendar.component.html'
})
export class CoachCalendarComponent implements AfterViewInit {
  @ViewChild('calCanvas') calCanvas?: ElementRef<HTMLCanvasElement>;
  weekStart = signal(startOfWeek(new Date()));
  slots = signal<ScheduleSlot[]>([]);
  students = signal<CoachAssignment[]>([]);
  showPopup = signal(false);
  title = signal('');
  selectedStudent = signal('');
  saving = signal(false);
  err = signal('');
  private pendingStart?: Date;
  private pendingEnd?: Date;

  constructor(private schedule: ScheduleService, private assignments: CoachAssignmentService) {}

  ngAfterViewInit(): void { this.setupCanvas(); this.render(); this.load(); window.addEventListener('resize', () => { this.setupCanvas(); this.render(); }); }

  private setupCanvas(): void {
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 960;
    const cssHeight = 600;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    const ctx = canvas.getContext('2d'); if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  load(): void {
    this.assignments.myStudents().subscribe(list => this.students.set(list));
    this.schedule.listForCoach().subscribe(list => { this.slots.set(list); this.render(); });
  }

  render(): void {
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    // background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    // draw columns for days (Mon-Sun) and rows for hours (08-22)
    const days = 7; const hours = 14; // 8..22 (exclusive of bottom border)
    const leftGutter = 60; const topGutter = 40;
    const areaH = H - topGutter - 1; // leave 1px bottom margin to avoid overflow
    const colW = (W - leftGutter) / days; const rowH = areaH / hours;
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px system-ui';
    // hour labels
    for (let i=0;i<=hours;i++) {
      const y = topGutter + i*rowH;
      const hour = 8 + i;
      const textY = i === hours ? y - 2 : y + 4; // keep last label inside canvas
      if (hour <= 22) ctx.fillText(`${hour}:00`, 10, textY);
      ctx.beginPath(); ctx.moveTo(leftGutter, y); ctx.lineTo(W-1, y); ctx.stroke();
    }
    // day columns and labels
    const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cts','Paz'];
    for (let d=0; d<days; d++) {
      const x = leftGutter + d*colW;
      ctx.beginPath(); ctx.moveTo(x, topGutter); ctx.lineTo(x, H); ctx.stroke();
      const label = dayNames[d];
      ctx.fillText(label, Math.floor(x + colW/2 - ctx.measureText(label).width/2), 20);
    }
    ctx.beginPath(); ctx.moveTo(W-1, topGutter); ctx.lineTo(W-1, H); ctx.stroke();
    // draw existing slots
    for (const sl of this.slots()) {
      const s = new Date(sl.start); const e = new Date(sl.end);
      const day = (s.getDay()+6)%7; const shour = s.getHours()+ s.getMinutes()/60; const ehour = e.getHours()+ e.getMinutes()/60;
      const sx = leftGutter + day*colW + 6;
      const sy = topGutter + (shour-8)*rowH + 6;
      const sh = Math.max(6, (ehour - shour)*rowH - 12);
      const maxBottom = H - 6;
      const adjH = Math.min(sh, maxBottom - sy);
      const sw = colW - 12;
      ctx.fillStyle = sl.status==='BOOKED' ? '#dcfce7' : '#e0f2fe';
      ctx.strokeStyle = sl.status==='BOOKED' ? '#16a34a' : '#0284c7';
      roundRect(ctx, sx, sy, sw, adjH, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillText(sl.title || '', sx+8, sy+16);
    }
  }

  onCanvasClick(ev: MouseEvent): void {
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr; // use CSS pixel space like render()
    const days = 7; const hours = 14; const leftGutter = 60; const topGutter = 40;
    const areaH = H - topGutter - 1; const colW = (W - leftGutter) / days; const rowH = areaH / hours;
    if (x < leftGutter || y < topGutter) return;
    const dayIdx = Math.floor((x - leftGutter) / colW);
    const hourFloat = (y - topGutter) / rowH + 8;
    const hour = Math.floor(hourFloat);
    const start = new Date(this.weekStart()); start.setDate(start.getDate() + dayIdx); start.setHours(hour, 0, 0, 0);
    const end = new Date(start); end.setHours(start.getHours() + 1);
    this.pendingStart = start; this.pendingEnd = end;
    this.title.set(''); this.selectedStudent.set(''); this.showPopup.set(true);
  }

  popupTimeInfo(): string {
    if (!this.pendingStart || !this.pendingEnd) return '';
    return `${this.pendingStart.toLocaleString('tr-TR')} - ${this.pendingEnd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  closePopup(): void { this.showPopup.set(false); }

  createSlot(): void {
    if (!this.pendingStart || !this.pendingEnd) return;
    const student = this.selectedStudent(); if (!student) return;
    const title = this.title().trim();
    this.saving.set(true);
    this.err.set('');
    this.schedule.createForCoach(student, this.pendingStart.toISOString(), this.pendingEnd.toISOString(), title).subscribe({
      next: slot => {
        this.slots.set([...this.slots(), slot]);
        this.saving.set(false);
        this.showPopup.set(false);
        this.render();
      },
      error: (e) => {
        this.saving.set(false);
        this.err.set('Oluşturma başarısız. Yetki/öğrenci eşleşmesini kontrol edin.');
      }
    });
  }
}

function startOfWeek(date: Date): Date {
  const d = new Date(date); const day = (d.getDay()+6)%7; // Monday=0
  d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}


