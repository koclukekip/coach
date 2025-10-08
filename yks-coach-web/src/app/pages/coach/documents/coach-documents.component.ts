import { Component, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  query = signal('');
  uploading = signal(false);
  // preview state
  previewing = signal<DocItem | null>(null);
  previewUrl = signal<SafeResourceUrl | null>(null);
  previewErr = signal('');
  previewText = signal('');
  previewIsPdf = signal(false);
  constructor(public svc: DocumentService, private sanitizer: DomSanitizer) { this.load(); }
  load() { this.svc.list().subscribe(list => this.docs.set(list)); }
  private allowedTextExt = ['txt','csv','json','xml','md','log'];
  private allowedImageExt = ['png','jpg','jpeg','gif','webp','svg'];
  private allowedPdfExt = ['pdf'];
  private isAllowedForUpload(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return this.allowedTextExt.includes(ext) || this.allowedImageExt.includes(ext) || this.allowedPdfExt.includes(ext);
  }
  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files; if (!files || files.length === 0) return;
    this.err.set('');
    this.uploading.set(true);
    const list = Array.from(files).filter(f => this.isAllowedForUpload(f.name));
    if (list.length === 0) { this.uploading.set(false); this.err.set('Desteklenmeyen dosya türü'); return; }
    let remaining = list.length;
    for (const file of list) {
      this.svc.upload(file).subscribe({
        next: d => { this.docs.set([d, ...this.docs()]); },
        error: () => { this.err.set('Yükleme başarısız'); },
        complete: () => { remaining--; if (remaining === 0) { this.uploading.set(false); input.value=''; } }
      });
    }
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    const files = ev.dataTransfer?.files; if (!files || files.length === 0) return;
    this.err.set('');
    this.uploading.set(true);
    const list = Array.from(files).filter(f => this.isAllowedForUpload(f.name));
    if (list.length === 0) { this.uploading.set(false); this.err.set('Desteklenmeyen dosya türü'); return; }
    let remaining = list.length;
    for (const file of list) {
      this.svc.upload(file).subscribe({
        next: d => { this.docs.set([d, ...this.docs()]); },
        error: () => { this.err.set('Yükleme başarısız'); },
        complete: () => { remaining--; if (remaining === 0) { this.uploading.set(false); } }
      });
    }
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }
  filteredDocs(): DocItem[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.docs();
    return this.docs().filter(d => d.filename.toLowerCase().includes(q));
  }
  openPreview(id: number) { window.open(this.svc.downloadUrl(id), '_blank'); }
  copyLink(id: number) {
    const url = this.svc.downloadUrl(id);
    navigator.clipboard?.writeText(url);
  }
  private isImageName(name: string): boolean { const ext = name.split('.').pop()?.toLowerCase() || ''; return this.allowedImageExt.includes(ext); }
  private isTextName(name: string): boolean { const ext = name.split('.').pop()?.toLowerCase() || ''; return this.allowedTextExt.includes(ext); }
  private isPdfName(name: string): boolean { const ext = name.split('.').pop()?.toLowerCase() || ''; return this.allowedPdfExt.includes(ext); }
  private readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('read error'));
      reader.readAsText(blob);
    });
  }
  previewDoc(d: DocItem) {
    this.previewing.set(d);
    this.previewErr.set('');
    this.previewUrl.set(null);
    this.previewText.set('');
    this.previewIsPdf.set(false);
    this.svc.getBlob(d.id).subscribe({
      next: blob => {
        const name = d.filename || '';
        const mime = blob.type || '';
        if (this.isImageName(name) || mime.startsWith('image/')) {
          const url = URL.createObjectURL(blob);
          this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        } else if (this.isPdfName(name) || mime === 'application/pdf') {
          const pdfBlob = (mime === 'application/pdf') ? blob : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          this.previewIsPdf.set(true);
          this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        } else if (this.isTextName(name) || mime.startsWith('text/') || mime.includes('json') || mime.includes('xml') || mime.includes('csv')) {
          this.readBlobAsText(blob).then(txt => { this.previewText.set(txt); }).catch(() => {
            this.previewErr.set('Metin içerik okunamadı');
          });
        } else {
          this.previewErr.set('Bu dosya türü önizlenemiyor. Lütfen indirin.');
        }
      },
      error: () => { this.previewErr.set('Önizleme açılamadı. Dosyayı indirip görüntüleyin.'); }
    });
  }
  closePreview() {
    this.previewing.set(null);
    this.previewUrl.set(null);
    this.previewErr.set('');
    this.previewText.set('');
    this.previewIsPdf.set(false);
  }
  deleteDoc(d: DocItem) {
    const ok = confirm(`${d.filename} silinsin mi?`);
    if (!ok) return;
    this.svc.delete(d.id).subscribe({
      next: () => {
        this.docs.set(this.docs().filter(x => x.id !== d.id));
        if (this.previewing()?.id === d.id) this.closePreview();
      },
      error: () => { this.err.set('Silme başarısız'); }
    });
  }
}


