import { Component } from '@angular/core';
import { siteConfig } from '../../../site.config';

@Component({
  selector: 'app-gizlilik',
  standalone: true,
  templateUrl: './gizlilik.component.html',
  styleUrl: './gizlilik.component.scss'
})
export class GizlilikComponent {
  public effectiveDate: string = new Date().toLocaleDateString();
  email = siteConfig.email;
}


