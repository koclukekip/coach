import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from 'app/services/auth.service';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const auth = inject(AuthService);
  const token = auth.token;
  const isRelativeApi = req.url.startsWith('/api') || req.url.startsWith('/auth');
  const isBackendDirect = req.url.startsWith('http://localhost:8080');
  if (token && (isRelativeApi || isBackendDirect)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
}


