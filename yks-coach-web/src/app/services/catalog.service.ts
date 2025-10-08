import { Injectable, signal } from '@angular/core';
import { DEPARTMENTS, HIGH_SCHOOLS, UNIVERSITIES, Department, HighSchool, University } from '../mock/catalog';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  universities = signal<University[]>(UNIVERSITIES);
  departments = signal<Department[]>(DEPARTMENTS);
  highSchools = signal<HighSchool[]>(HIGH_SCHOOLS);
}


