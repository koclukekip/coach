import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaStreamDirective } from './media-stream.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [MediaStreamDirective],
  exports: [MediaStreamDirective]
})
export class MediaStreamModule {}


