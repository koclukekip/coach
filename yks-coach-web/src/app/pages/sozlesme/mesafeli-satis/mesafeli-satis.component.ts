import { Component } from '@angular/core';
import { siteConfig } from '../../../site.config';

@Component({
  selector: 'app-mesafeli-satis',
  standalone: true,
  templateUrl: './mesafeli-satis.component.html',
  styleUrl: './mesafeli-satis.component.scss'
})
export class MesafeliSatisComponent {
  public effectiveDate: string = new Date().toLocaleDateString();
  email = siteConfig.email;
}


