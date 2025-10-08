import { Component } from '@angular/core';
import { siteConfig } from '../../../site.config';

@Component({
  selector: 'app-odeme-teslimat',
  standalone: true,
  templateUrl: './odeme-teslimat.component.html',
  styleUrl: './odeme-teslimat.component.scss'
})

export class OdemeTeslimatComponent {
  email = siteConfig.email;
}


