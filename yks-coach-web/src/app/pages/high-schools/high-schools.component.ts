import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-high-schools',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './high-schools.component.html',
  styleUrl: './high-schools.component.scss'
})
export class HighSchoolsComponent {
  displayedColumns = ['name','city','kind'];
  city = signal<string>('');
  kind = signal<string>('');
  data = computed(() => {
    const c = this.city().toLowerCase();
    const k = this.kind();
    return this.catalog.highSchools().filter(h =>
      (c ? h.city.toLowerCase().includes(c) : true) && (k ? h.kind === k : true)
    );
  });

  kinds = ['Anadolu','Fen','Meslek','Anadolu Imam Hatip'];

  constructor(private catalog: CatalogService) {}
}
