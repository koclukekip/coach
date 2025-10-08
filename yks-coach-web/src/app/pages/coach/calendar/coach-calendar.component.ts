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
  showDecision = signal(false);
  selectedSlot = signal<ScheduleSlot | null>(null);
  private hoverSlotId: number | null = null;
  private pendingStart?: Date;
  private pendingEnd?: Date;

  constructor(private schedule: ScheduleService, private assignments: CoachAssignmentService) {}

  ngAfterViewInit(): void { this.setupCanvas(); this.render(); this.load(); window.addEventListener('resize', () => { this.setupCanvas(); this.render(); }); }

  // Week navigation helpers
  prevWeek(): void { this.weekStart.set(shiftDays(this.weekStart(), -7)); this.render(); }
  nextWeek(): void { this.weekStart.set(shiftDays(this.weekStart(), +7)); this.render(); }
  thisWeek(): void { this.weekStart.set(startOfWeek(new Date())); this.render(); }
  onDatePicked(value: string): void {
    if (!value) return;
    const d = new Date(value);
    if (isNaN(d.getTime())) return;
    this.weekStart.set(startOfWeek(d));
    this.render();
  }
  // creation window: today .. today+30 days
  private creationStart(): Date { const d = new Date(); d.setHours(0,0,0,0); return d; }
  private creationEnd(): Date { const d = new Date(); d.setDate(d.getDate()+31); d.setHours(23,59,59,999); return d; }
  private isCreatable(date: Date): boolean {
    const t = date.getTime();
    return t >= this.creationStart().getTime() && t <= this.creationEnd().getTime();
  }
  weekRangeLabel(): string {
    const start = new Date(this.weekStart());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    const year = start.getFullYear() === end.getFullYear() ? start.getFullYear().toString() : `${start.getFullYear()} / ${end.getFullYear()}`;
    return `${fmt(start)} - ${fmt(end)} ${year}`;
  }

  private setupCanvas(): void {
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 960;
    const cssHeight = 800; // increase height to make time slots larger
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    const ctx = canvas.getContext('2d'); if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  load(): void {
    this.assignments.myStudents().subscribe(list => this.students.set(list));
    this.schedule.listForCoach().subscribe(list => {
      // hide REJECTED items from calendar data
      this.slots.set(list.filter(sl => sl.status !== 'REJECTED'));
      this.render();
    });
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
    const leftGutter = 60; const topGutter = 64; // taller header for weekday + date labels
    const areaH = H - topGutter - 1; // leave 1px bottom margin to avoid overflow
    const colW = (W - leftGutter) / days; const rowH = areaH / hours;
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px system-ui';
    ctx.textBaseline = 'top';
    // hour labels
    for (let i=0;i<=hours;i++) {
      const y = topGutter + i*rowH;
      const hour = 8 + i;
      const textY = i === hours ? y - 2 : y + 4; // keep last label inside canvas
      if (hour <= 22) ctx.fillText(`${hour}:00`, 10, textY);
      ctx.beginPath(); ctx.moveTo(leftGutter, y); ctx.lineTo(W-1, y); ctx.stroke();
    }
    // half-hour guides
    ctx.strokeStyle = '#e2e8f0';
    for (let i=0;i<hours;i++) {
      const y = topGutter + i*rowH + rowH/2;
      ctx.beginPath(); ctx.moveTo(leftGutter, y); ctx.lineTo(W-1, y); ctx.stroke();
    }
    // day columns and labels
    const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cts','Paz'];
    const start = new Date(this.weekStart());
    const today = new Date(); today.setHours(0,0,0,0);
    for (let d=0; d<days; d++) {
      const x = leftGutter + d*colW;
      ctx.beginPath(); ctx.moveTo(x, topGutter); ctx.lineTo(x, H); ctx.stroke();
      const cur = new Date(start); cur.setDate(start.getDate() + d);
      const isToday = cur.getTime() === today.getTime();
      const dayLabel = dayNames[d];
      const dateLabel = String(cur.getDate());
      // center text in header area
      const cx = x + colW/2;
      const creatable = this.isCreatable(cur);
      ctx.fillStyle = isToday ? '#0ea5e9' : (creatable ? '#0f172a' : '#94a3b8');
      ctx.fillText(dayLabel, Math.floor(cx - ctx.measureText(dayLabel).width/2), 14);
      ctx.fillStyle = isToday ? '#0369a1' : (creatable ? '#334155' : '#94a3b8');
      ctx.fillText(dateLabel, Math.floor(cx - ctx.measureText(dateLabel).width/2), 32);
    }
    ctx.beginPath(); ctx.moveTo(W-1, topGutter); ctx.lineTo(W-1, H); ctx.stroke();
    // draw existing slots for the current visible week only (fill full grid cell area)
    const weekStart = new Date(this.weekStart());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7); // exclusive
    for (const sl of this.slots()) {
      if (sl.status === 'REJECTED') continue; // do not render rejected
      const s = new Date(sl.start); const e = new Date(sl.end);
      if (!(s.getTime() >= weekStart.getTime() && s.getTime() < weekEnd.getTime())) continue;
      const day = (s.getDay()+6)%7; const shour = s.getHours()+ s.getMinutes()/60; const ehour = e.getHours()+ e.getMinutes()/60;
      const sx = leftGutter + day*colW;
      const sy = topGutter + (shour-8)*rowH;
      const adjH = Math.max(1, (ehour - shour)*rowH);
      const sw = colW;
      const isBooked = sl.status==='BOOKED';
      const isHover = this.hoverSlotId === sl.id && isBooked;
      ctx.fillStyle = isBooked ? (isHover ? '#b7f7c8' : '#dcfce7') : '#e0f2fe';
      ctx.strokeStyle = isBooked ? '#16a34a' : '#0284c7';
      const radius = 6; // soften corners
      ctx.beginPath();
      // rounded rect path
      ctx.moveTo(sx + radius, sy);
      ctx.lineTo(sx + sw - radius, sy);
      ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + radius);
      ctx.lineTo(sx + sw, sy + adjH - radius);
      ctx.quadraticCurveTo(sx + sw, sy + adjH, sx + sw - radius, sy + adjH);
      ctx.lineTo(sx + radius, sy + adjH);
      ctx.quadraticCurveTo(sx, sy + adjH, sx, sy + adjH - radius);
      ctx.lineTo(sx, sy + radius);
      ctx.quadraticCurveTo(sx, sy, sx + radius, sy);
      ctx.closePath();
      // slight scale up on hover
      if (isHover) {
        ctx.save();
        const cx = sx + sw/2, cy = sy + adjH/2;
        ctx.translate(cx, cy);
        ctx.scale(1.08, 1.08);
        ctx.translate(-cx, -cy);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      } else {
        ctx.fill(); ctx.stroke();
      }
      const student = (sl as any).studentUsername || '';
      const label = sl.status==='BOOKED' && student ? `${student}` : (sl.title || '');
      ctx.fillStyle = '#0f172a';
      // draw centered label within slot bounds with wrapping
      const lineH = 16; // px
      const maxLines = Math.max(1, Math.floor((adjH - 8) / lineH));
      drawWrappedCenteredText(ctx, label, sx, sy, sw, adjH, lineH, maxLines);
    }
  }

  onCanvasClick(ev: MouseEvent): void {
    if (this.showPopup() || this.showDecision()) return; // ignore when a modal is open
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr; // use CSS pixel space like render()
    const days = 7; const hours = 14; const leftGutter = 60; const topGutter = 64;
    const areaH = H - topGutter - 1; const colW = (W - leftGutter) / days; const rowH = areaH / hours;
    if (x < leftGutter || y < topGutter) return;
    const dayIdx = Math.floor((x - leftGutter) / colW);
    const hourFloat = (y - topGutter) / rowH + 8;
    const hour = Math.floor(hourFloat);
    const minute = (hourFloat - hour) >= 0.5 ? 30 : 0; // snap to 30 min

    // First, hit-test existing slots; if clicking a REQUESTED slot, open decision modal
    const clickTime = new Date(this.weekStart()); clickTime.setDate(clickTime.getDate() + dayIdx); clickTime.setHours(hour, minute, 0, 0);
    const ctMs = clickTime.getTime();
    const weekStart = new Date(this.weekStart());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    const requested = this.slots().find(sl => {
      const s = new Date(sl.start); const e = new Date(sl.end);
      const slotDay = (s.getDay()+6)%7;
      return s.getTime() >= weekStart.getTime() && s.getTime() < weekEnd.getTime() && slotDay === dayIdx && ctMs >= s.getTime() && ctMs < e.getTime() && sl.status === 'REQUESTED';
    });
    if (requested) { this.openDecision(requested); return; }
    const booked = this.slots().find(sl => {
      const s = new Date(sl.start); const e = new Date(sl.end);
      const slotDay = (s.getDay()+6)%7;
      return s.getTime() >= weekStart.getTime() && s.getTime() < weekEnd.getTime() && slotDay === dayIdx && ctMs >= s.getTime() && ctMs < e.getTime() && sl.status === 'BOOKED';
    });
    if (booked) { this.openDecision(booked); return; }

    // Otherwise, open new meeting popup if within creatable window
    const start = new Date(this.weekStart()); start.setDate(start.getDate() + dayIdx); start.setHours(hour, minute, 0, 0);
    const end = new Date(start); end.setMinutes(start.getMinutes() + 30);
    if (!this.isCreatable(start)) return; // block creating outside window
    this.pendingStart = start; this.pendingEnd = end;
    this.title.set(''); this.selectedStudent.set(''); this.showPopup.set(true);
  }

  onCanvasMove(ev: MouseEvent): void {
    const canvas = this.calCanvas?.nativeElement; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    const days = 7; const hours = 14; const leftGutter = 60; const topGutter = 64;
    const areaH = H - topGutter - 1; const colW = (W - leftGutter) / days; const rowH = areaH / hours;
    if (x < leftGutter || y < topGutter) { this.hoverSlotId = null; this.render(); return; }
    const dayIdx = Math.floor((x - leftGutter) / colW);
    const hourFloat = (y - topGutter) / rowH + 8;
    const hour = Math.floor(hourFloat);
    const minute = (hourFloat - hour) >= 0.5 ? 30 : 0;
    const t = new Date(this.weekStart()); t.setDate(t.getDate() + dayIdx); t.setHours(hour, minute, 0, 0);
    const tt = t.getTime();
    const weekStart = new Date(this.weekStart());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    let hovered: number | null = null;
    for (const sl of this.slots()) {
      if (sl.status !== 'BOOKED') continue;
      const ss = Date.parse(sl.start); const se = Date.parse(sl.end);
      const sDay = (new Date(sl.start).getDay()+6)%7;
      if (ss >= weekStart.getTime() && ss < weekEnd.getTime() && sDay === dayIdx && tt >= ss && tt < se) { hovered = sl.id; break; }
    }
    if (hovered !== this.hoverSlotId) {
      this.hoverSlotId = hovered;
      this.render();
    }
  }

  onCanvasLeave(): void { this.hoverSlotId = null; this.render(); }

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

  openDecision(sl: ScheduleSlot): void {
    this.selectedSlot.set(sl);
    this.showDecision.set(true);
  }
  closeDecision(): void {
    this.selectedSlot.set(null);
    this.showDecision.set(false);
  }
  approveSelected(): void {
    const sl = this.selectedSlot(); if (!sl) return;
    this.schedule.approve(sl.id).subscribe(updated => {
      const enriched = { ...updated, studentUsername: (sl as any).studentUsername } as any;
      this.slots.set(this.slots().map(s => s.id===updated.id? (enriched as any): s));
      this.closeDecision();
      this.render();
    });
  }
  rejectSelected(): void {
    const sl = this.selectedSlot(); if (!sl) return;
    this.schedule.reject(sl.id).subscribe(updated => {
      // remove rejected slot from view
      this.slots.set(this.slots().filter(s => s.id !== updated.id));
      this.closeDecision();
      this.render();
    });
  }
}

function startOfWeek(date: Date): Date {
  const d = new Date(date); const day = (d.getDay()+6)%7; // Monday=0
  d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d;
}

function shiftDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0,0,0,0);
  return startOfWeek(d);
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

function drawWrappedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  lineHeight: number,
  maxLines: number
) {
  if (!text) return;
  // build lines using wrap helper but without drawing yet
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let line = '';
  const maxWidth = sw - 12;
  for (let i=0;i<words.length;i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    const { width } = ctx.measureText(test);
    if (width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) {
        // last line with ellipsis
        let rest = line;
        while (ctx.measureText(rest + '…').width > maxWidth && rest.length) {
          rest = rest.slice(0, -1);
        }
        lines.push(rest + '…');
        break;
      }
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  const contentHeight = lines.length * lineHeight;
  const startY = sy + (sh - contentHeight) / 2;
  const centerX = sx + sw / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'center';
  for (let i=0;i<lines.length;i++) {
    ctx.fillText(lines[i], centerX, startY + i*lineHeight);
  }
  ctx.textAlign = prevAlign as CanvasTextAlign;
}


