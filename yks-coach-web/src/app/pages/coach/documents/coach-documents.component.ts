import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, DocItem } from 'app/services/document.service';

@Component({
  selector: 'app-coach-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coach-documents.component.html'
})
export class CoachDocumentsComponent {
  docs = signal<DocItem[]>([]);
  err = signal('');
  constructor(public svc: DocumentService) { this.load(); }
  load() { this.svc.list().subscribe(list => this.docs.set(list)); }
  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    this.err.set('');
    this.svc.upload(file).subscribe({
      next: d => { this.docs.set([d, ...this.docs()]); input.value=''; },
      error: () => { this.err.set('Yükleme başarısız'); }
    });
  }
}


