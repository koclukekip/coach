import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: 'video[appMediaStream]'
})
export class MediaStreamDirective implements OnChanges {
  @Input('appMediaStream') stream: MediaStream | null = null;
  constructor(private el: ElementRef<HTMLVideoElement>) {}
  ngOnChanges(_changes: SimpleChanges): void {
    const video = this.el.nativeElement;
    // Always prefer srcObject; modern browsers support it
    // @ts-ignore
    video.srcObject = this.stream || null;
    if (this.stream) {
      video.play().catch(() => {});
    }
  }
}


