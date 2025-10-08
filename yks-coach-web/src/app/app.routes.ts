import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from 'app/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.requireAuth()) return true;
  return (location.href = '/account/login') as unknown as boolean;
};

export const routes: Routes = [
  { path: '', title: 'Ana Sayfa | Derece Kampüsü', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'students', loadComponent: () => import('./pages/students/students.component').then(m => m.StudentsComponent) },
  { path: 'sessions', loadComponent: () => import('./pages/sessions/sessions.component').then(m => m.SessionsComponent) },
  { path: 'universities', loadComponent: () => import('./pages/universities/universities.component').then(m => m.UniversitiesComponent) },
  { path: 'departments', loadComponent: () => import('./pages/departments/departments.component').then(m => m.DepartmentsComponent) },
  { path: 'high-schools', loadComponent: () => import('./pages/high-schools/high-schools.component').then(m => m.HighSchoolsComponent) },
  { path: 'hakkimizda', title: 'Biz Kimiz | Derece Kampüsü', loadComponent: () => import('./pages/hakkimizda/hakkimizda.component').then(m => m.HakkimizdaComponent) },
  { path: 'yks-kocluk-hizmeti', title: 'YKS Koçluk | Derece Kampüsü', loadComponent: () => import('./pages/yks/yks.component').then(m => m.YksComponent) },
  { path: 'lgs-kocluk-hizmeti', title: 'LGS Koçluk | Derece Kampüsü', loadComponent: () => import('./pages/lgs/lgs.component').then(m => m.LgsComponent) },
  { path: 'ucretsiz-danismanlik', title: 'Ücretsiz Danışmanlık | Derece Kampüsü', loadComponent: () => import('./pages/ucretsiz-danismanlik/ucretsiz-danismanlik.component').then(m => m.UcretsizDanismanlikComponent) },
  { path: 'bize-katilin', title: 'Bize Katıl | Derece Kampüsü', loadComponent: () => import('./pages/bize-katilin/bize-katilin.component').then(m => m.BizeKatilinComponent) },
  { path: 'paketlerimiz', title: 'Paketlerimiz | Derece Kampüsü', loadComponent: () => import('./pages/paketlerimiz/paketlerimiz.component').then(m => m.PaketlerimizComponent) },
  { path: 'sikca-sorulan-sorular', title: 'Sıkça Sorulan Sorular | Derece Kampüsü', loadComponent: () => import('./pages/sss/sss.component').then(m => m.SssComponent) },
  { path: 'iletisim', title: 'İletişim | Derece Kampüsü', loadComponent: () => import('./pages/iletisim/iletisim.component').then(m => m.IletisimComponent) },
  { path: 'egitmenlerimiz', title: 'Eğitmenlerimiz | Derece Kampüsü', loadComponent: () => import('./pages/egitmenlerimiz/egitmenlerimiz.component').then(m => m.EgitmenlerimizComponent) },
  { path: 'blog', title: 'Blog | Derece Kampüsü', loadComponent: () => import('./pages/sss/sss.component').then(m => m.SssComponent) },
  { path: 'account/login', title: 'Giriş Yap | Derece Kampüsü', loadComponent: () => import('./pages/account/login/login.component').then(m => m.LoginComponent) },
  { path: 'account/register', title: 'Kayıt Ol | Derece Kampüsü', loadComponent: () => import('./pages/account/register/register.component').then(m => m.RegisterComponent) },
  { path: 'account/profile', title: 'Profilim | Derece Kampüsü', loadComponent: () => import('./pages/account/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'coach/conversations', title: 'Koç Talepleri | Derece Kampüsü', canActivate: [authGuard], loadComponent: () => import('./pages/coach/coach-conversations.component').then(m => m.CoachConversationsComponent) },
  { path: 'student/conversations', title: 'Taleplerim | Derece Kampüsü', canActivate: [authGuard], loadComponent: () => import('./pages/student/student-conversations.component').then(m => m.StudentConversationsComponent) },
  { path: 'sozlesme/mesafeli-satis', title: 'Mesafeli Satış Sözleşmesi | Derece Kampüsü', loadComponent: () => import('./pages/sozlesme/mesafeli-satis/mesafeli-satis.component').then(m => m.MesafeliSatisComponent) },
  { path: 'sozlesme/odeme-teslimat', title: 'Ödeme ve Teslimat | Derece Kampüsü', loadComponent: () => import('./pages/sozlesme/odeme-teslimat/odeme-teslimat.component').then(m => m.OdemeTeslimatComponent) },
  { path: 'sozlesme/gizlilik', title: 'Gizlilik Sözleşmesi | Derece Kampüsü', loadComponent: () => import('./pages/sozlesme/gizlilik/gizlilik.component').then(m => m.GizlilikComponent) },
  { path: '**', redirectTo: '' }
];
