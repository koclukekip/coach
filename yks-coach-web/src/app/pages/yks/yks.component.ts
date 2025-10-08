import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-yks',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './yks.component.html',
  styleUrl: './yks.component.scss'
})
export class YksComponent {
  days = this.generateDays(5);
  selectedSlot?: Date;

  selectSlot(day: Date, time: string): void {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    this.selectedSlot = d;
  }

  private generateDays(count: number): { date: Date; slots: string[] }[] {
    const out: { date: Date; slots: string[] }[] = [];
    const base = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push({ date: d, slots: ['10:00', '14:00', '17:30'] });
    }
    return out;
  }
}


