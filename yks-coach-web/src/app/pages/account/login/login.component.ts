import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['./login.component.scss'],
  template: `
  <section class="auth-page">
    <div class="auth-card">
      <h1>Giriş Yap</h1>
      <form (ngSubmit)="submit()" #f="ngForm" class="auth-form">
        <div class="form-field">
          <input class="input" name="username" [ngModel]="username()" (ngModelChange)="username.set($event)" placeholder="Kullanıcı adı" required />
        </div>
        <div class="form-field">
          <input class="input" type="password" name="password" [ngModel]="password()" (ngModelChange)="password.set($event)" placeholder="Şifre" required />
        </div>
        <button class="btn btn-primary auth-btn" type="submit">Giriş</button>
        <div *ngIf="error()" class="error-text">{{ error() }}</div>
      </form>
      <div class="auth-alt">Hesabın yok mu? <a routerLink="/account/register">Kayıt ol</a></div>
    </div>
  </section>
  `
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error.set('');
    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.router.navigateByUrl(this.auth.isCoach() ? '/coach/conversations' : '/student/conversations'),
      error: () => this.error.set('Geçersiz giriş bilgileri')
    });
  }
}


