import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profile, ProfileService } from 'app/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section class="container" style="max-width:640px;margin:24px auto">
    <h1>Profilim</h1>
    <form (ngSubmit)="save()" *ngIf="model() as m" style="display:flex;flex-direction:column;gap:10px">
      <input [ngModel]="m.fullName" (ngModelChange)="onChange('fullName',$event)" name="fullName" placeholder="Ad Soyad" />
      <input [ngModel]="m.email" (ngModelChange)="onChange('email',$event)" name="email" placeholder="E-posta" />
      <input [ngModel]="m.phone" (ngModelChange)="onChange('phone',$event)" name="phone" placeholder="Telefon" />
      <textarea [ngModel]="m.bio" (ngModelChange)="onChange('bio',$event)" name="bio" rows="4" placeholder="Hakkımda"></textarea>
      <button class="btn btn-primary" type="submit">Kaydet</button>
    </form>
  </section>
  `
})
export class ProfileComponent implements OnInit {
  model = signal<Profile | null>(null);
  constructor(private profiles: ProfileService) {}
  ngOnInit(): void { this.profiles.me().subscribe(p => this.model.set(p)); }
  onChange<K extends keyof Profile>(key: K, value: Profile[K]) {
    const m = this.model(); if (!m) return; this.model.set({ ...m, [key]: value } as Profile);
  }
  save(): void { const m = this.model(); if (!m) return; this.profiles.update(m).subscribe(p => this.model.set(p)); }
}


