import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-egitmenlerimiz',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './egitmenlerimiz.component.html',
  styleUrl: './egitmenlerimiz.component.scss'
})
export class EgitmenlerimizComponent {
  constructor(private route: ActivatedRoute) {}
}


