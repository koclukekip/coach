import { Component } from '@angular/core';
import { siteConfig } from '../../site.config';

@Component({
  selector: 'app-iletisim',
  standalone: true,
  templateUrl: './iletisim.component.html',
  styleUrl: './iletisim.component.scss'
})
export class IletisimComponent {
  phone = siteConfig.phone;
  phoneDisplay = siteConfig.phoneDisplay;
  email = siteConfig.email;

}


