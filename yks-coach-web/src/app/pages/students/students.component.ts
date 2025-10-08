import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CatalogService } from '../../services/catalog.service';
import { Student, StudentService } from '../../services/student.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, ScrollingModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent {
  students: Student[] = [];
  newStudent: Student = { fullName: '', phone: '', school: '', targetScore: 0 };
  errorMsg = '';

  constructor(private studentService: StudentService, public catalog: CatalogService) {
    this.load();
  }

  load() {
    this.errorMsg = '';
    this.studentService.list().subscribe({
      next: data => this.students = data,
      error: err => this.errorMsg = 'Liste alınamadı: ' + (err?.message || '')
    });
  }

  add() {
    this.errorMsg = '';
    this.studentService.create(this.newStudent).subscribe({
      next: () => {
        this.newStudent = { fullName: '', phone: '', school: '', targetScore: 0 };
        this.load();
      },
      error: err => this.errorMsg = 'Kayıt eklenemedi: ' + (err?.message || '')
    });
  }

  trackById = (_: number, s: Student) => s.id ?? s.fullName + s.phone;
}
