import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, tap, of } from 'rxjs';
import { LoginResponse } from '../models/login-response';
import { environment } from '../../environments/environment';
import { TfaLogin, TfaSetup } from '../models/tfa';
import { JwtDecoderService } from './jwt-decoder.service';

const TOKEN_KEY = 'token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private jwtDecoder: JwtDecoderService
  ) { }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.baseApiUrl}/auth/login`, {
        email: email,
        password: password,
      })
      .pipe(
        tap((lr) => {
          localStorage.setItem(TOKEN_KEY, JSON.stringify(lr));
        })
      );
  }

  loginTfa(body: TfaLogin){
    return this.http.post<LoginResponse>(`${environment.baseApiUrl}/auth/login-tfa`, body)
    .pipe(
      tap((lr) => {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(lr));
      })
    );;
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.baseApiUrl}/auth/logout`, {}).pipe(
      tap((lr) => {
        localStorage.removeItem(TOKEN_KEY);
      })
    );
  }

  passwordLost(email: string): Observable<any> {
    return this.http.post(
      `${environment.baseApiUrl}/auth/generate-reset-password-token`,
      { email }
    );
  }

  resetPassword(token: any, password: any): Observable<any> {
    return this.http
      .post(`${environment.baseApiUrl}/auth/reset-password`, {
        token: token,
        newPassword: password,
      })
      .pipe(
        tap((lr) => {
          localStorage.setItem(TOKEN_KEY, JSON.stringify(lr));
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.baseApiUrl}/auth/change-password`, {
      oldPassword: oldPassword,
      newPassword: newPassword,
    });
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(TOKEN_KEY) != null;
  }

  /**
   * Ottiene il token JWT dal localStorage
   */
  getToken(): string | null {
    const tokenData = localStorage.getItem(TOKEN_KEY);
    if (!tokenData) {
      return null;
    }
    try {
      const loginResponse = JSON.parse(tokenData) as LoginResponse;
      return loginResponse.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Ottiene il refresh token dal localStorage
   */
  getRefreshToken(): string | null {
    const tokenData = localStorage.getItem(TOKEN_KEY);
    if (!tokenData) {
      return null;
    }
    try {
      const loginResponse = JSON.parse(tokenData) as LoginResponse;
      return loginResponse.refreshToken || null;
    } catch {
      return null;
    }
  }

  /**
   * Rinnova il token JWT usando il refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of({} as LoginResponse);
    }

    return this.http
      .post<LoginResponse>(`${environment.baseApiUrl}/auth/refresh`, {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((lr) => {
          localStorage.setItem(TOKEN_KEY, JSON.stringify(lr));
        })
      );
  }

  /**
   * Verifica se il token JWT è scaduto o sta per scadere
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    return this.jwtDecoder.isTokenExpired(token);
  }

  /**
   * Verifica se l'utente ha una sessione valida (token e refresh token validi)
   * Restituisce un Observable che emette true se la sessione è valida, false altrimenti
   */
  checkSessionValidity(): Observable<boolean> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    // Se non c'è nessun token, la sessione non è valida
    if (!token && !refreshToken) {
      return of(false);
    }

    // Se il token è valido, la sessione è valida
    if (token && !this.isTokenExpired()) {
      return of(true);
    }

    // Se il token è scaduto ma c'è il refresh token, provo a rinnovare
    if (refreshToken) {
      return this.refreshToken().pipe(
        map((response: LoginResponse) => {
          return response?.isAuthSuccessful ?? false;
        }),
        catchError(() => {
          // Se il refresh fallisce, la sessione non è valida
          return of(false);
        })
      );
    }

    return of(false);
  }

  /**
   * Ottiene i ruoli dal token JWT locale
   */
  getRolesFromToken(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    return this.jwtDecoder.getRolesFromToken(token);
  }

  /**
   * Ottiene i permessi dal token JWT locale
   */
  getPermissionsFromToken(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    return this.jwtDecoder.getPermissionsFromToken(token);
  }

  /**
   * Verifica se l'utente ha un ruolo specifico
   */
  hasRole(role: string): boolean {
    const roles = this.getRolesFromToken();
    return roles.includes(role);
  }

  /**
   * Verifica se l'utente ha uno qualsiasi dei ruoli specificati
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRolesFromToken();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Verifica se l'utente ha tutti i ruoli specificati
   */
  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getRolesFromToken();
    return roles.every(role => userRoles.includes(role));
  }

  /**
   * Verifica se l'utente ha un permesso specifico
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getPermissionsFromToken();
    return permissions.includes(permission);
  }

  /**
   * Verifica se l'utente ha uno qualsiasi dei permessi specificati
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.getPermissionsFromToken();
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Verifica se l'utente ha tutti i permessi specificati
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.getPermissionsFromToken();
    return permissions.every(permission => userPermissions.includes(permission));
  }

  isUserAdmin(): boolean {
    return this.hasRole('Amministratore');
  }

  isUserBackoffice(): boolean {
    return this.hasRole('Backoffice');
  }

  isUserTecnico(): boolean {
    return this.hasRole('Tecnico');
  }

  getUser(): Observable<any> {
    return this.http.get(`${environment.baseApiUrl}/auth/get-user`);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${environment.baseApiUrl}/auth/get-roles`);
  }

  getTfaSetup(email: string){
    return this.http.get<TfaSetup>(`${environment.baseApiUrl}/auth/tfa-setup?email=${email}`);
  }

  postTfaSetup(body: TfaSetup) {
    return this.http.post<TfaSetup>(`${environment.baseApiUrl}/auth/tfa-setup`, body);
  }

  disableTfa(email: string) {
    return this.http.delete<TfaSetup>(`${environment.baseApiUrl}/auth/tfa-setup?email=${email}`);
  }



}
