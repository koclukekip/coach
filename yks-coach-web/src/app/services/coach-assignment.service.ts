import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CoachAssignment {
  id: number;
  studentUsername: string;
  coachUsername: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CoachAssignmentService {
  constructor(private http: HttpClient) {}

  myStudents(): Observable<CoachAssignment[]> {
    return this.http.get<CoachAssignment[]>(`/api/coach-assignments/my-students`);
  }

  assignStudent(studentUsername: string): Observable<CoachAssignment> {
    return this.http.post<CoachAssignment>(`/api/coach-assignments/assign`, { studentUsername });
  }
}


