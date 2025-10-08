import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-universities',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatChipsModule],
  templateUrl: './universities.component.html',
  styleUrl: './universities.component.scss'
})
export class UniversitiesComponent {
  displayedColumns = ['name','city','type'];
  query = signal('');
  data = computed(() => {
    const q = this.query().toLowerCase();
    return this.catalog.universities().filter(u =>
      u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q) || u.type.toLowerCase().includes(q)
    );
  });

  constructor(private catalog: CatalogService) {}
}
