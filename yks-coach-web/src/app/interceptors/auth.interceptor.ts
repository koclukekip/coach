import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const isRelativeApi = req.url.startsWith('/api') || req.url.startsWith('/auth');
  const isBackendDirect = req.url.startsWith('http://localhost:8080');
  if (token && (isRelativeApi || isBackendDirect)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
}


