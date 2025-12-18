import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginResponse } from '../models/login-response';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  let sessionInfo: LoginResponse;
  try {
    sessionInfo = JSON.parse(
      localStorage.getItem('token') ?? '{}'
    ) as LoginResponse;
  } catch {
    sessionInfo = {} as LoginResponse;
  }

  const bypassUrls = [
    '/auth/login',
    '/auth/login-tfa',
    '/auth/password-lost', 
    '/auth/generate-reset-password-token', 
    '/auth/reset-password',
    '/auth/refresh'
  ];

  // Se la richiesta è per un URL che bypassa l'autenticazione
  if (bypassUrls.some((bypassUrl) => req.url.includes(bypassUrl))) {
    return next(req);
  }

  // Se l'utente è autenticato, aggiungo il token
  if (sessionInfo?.isAuthSuccessful && sessionInfo?.token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${sessionInfo.token}` },
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se ricevo un 401 (Unauthorized), provo a rinnovare il token
        if (error.status === 401 && sessionInfo?.refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((newTokens: LoginResponse) => {
              // Se il refresh è riuscito, riprovo la richiesta originale con il nuovo token
              if (newTokens?.isAuthSuccessful && newTokens?.token) {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newTokens.token}` },
                });
                return next(retryReq);
              } else {
                // Se il refresh fallisce, reindirizzo al login
                router.navigateByUrl('/auth/login');
                return throwError(() => error);
              }
            }),
            catchError((refreshError) => {
              // Se il refresh genera un errore, reindirizzo al login
              router.navigateByUrl('/auth/login');
              return throwError(() => refreshError);
            })
          );
        }

        // Per altri errori o se non c'è refresh token, reindirizzo al login
        if (error.status === 401) {
          router.navigateByUrl('/auth/login');
        }
        return throwError(() => error);
      })
    );
  } else {
    // Se non è autenticato, reindirizzo al login
    router.navigateByUrl('/auth/login');
    return next(req);
  }
}
