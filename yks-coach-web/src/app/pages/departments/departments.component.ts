import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss'
})
export class DepartmentsComponent {
  displayedColumns = ['name','field','university'];
  field = signal<string | null>(null);
  q = signal('');
  data = computed(() => {
    const field = this.field();
    const q = this.q().toLowerCase();
    return this.catalog.departments().filter(d =>
      (!field || d.field === field) && (d.name.toLowerCase().includes(q))
    ).map(d => ({...d, universityName: this.catalog.universities().find(u => u.code===d.universityCode)?.name || d.universityCode }));
  });

  fields = [
    { value: 'sayisal', label: 'Sayısal' },
    { value: 'esitagirlik', label: 'Eşit Ağırlık' },
    { value: 'sozel', label: 'Sözel' },
    { value: 'dil', label: 'Dil' },
  ];

  constructor(private catalog: CatalogService) {}
}
