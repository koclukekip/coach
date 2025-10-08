import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['./register.component.scss'],
  template: `
  <section class="auth-page">
    <div class="auth-card">
      <h1>Kayıt Ol</h1>
      <form (ngSubmit)="submit()" #f="ngForm" class="auth-form">
        <label class="inline-field">
          <span class="label">Rol</span>
          <select class="select" name="role" [ngModel]="role()" (ngModelChange)="role.set($event)">
            <option value="USER">Öğrenci</option>
            <option value="COACH">Koç</option>
          </select>
        </label>

        <input class="input" name="fullName" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" placeholder="Ad Soyad" required />
        <input class="input" type="email" name="email" [ngModel]="email()" (ngModelChange)="email.set($event)" placeholder="E-posta" required />
        <input class="input" name="phone" [ngModel]="phone()" (ngModelChange)="phone.set($event)" placeholder="Telefon" />
        <input class="input" name="username" [ngModel]="username()" (ngModelChange)="username.set($event)" placeholder="Kullanıcı adı" required />
        <input class="input" type="password" name="password" [ngModel]="password()" (ngModelChange)="password.set($event)" placeholder="Şifre" required />
        <button class="btn btn-primary auth-btn" type="submit">Kayıt Ol</button>
        <div *ngIf="error()" class="error-text">{{ error() }}</div>
      </form>
      <div class="auth-alt">Zaten hesabın var mı? <a routerLink="/account/login">Giriş yap</a></div>
    </div>
  </section>
  `
})
export class RegisterComponent {
  username = signal('');
  password = signal('');
  fullName = signal('');
  email = signal('');
  phone = signal('');
  role = signal<'USER' | 'COACH'>('USER');
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error.set('');
    this.auth.register(this.username(), this.password(), this.fullName(), this.email(), this.phone(), this.role()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => this.error.set(e.status === 409 ? 'Kullanıcı mevcut' : 'Kayıt başarısız')
    });
  }
}


