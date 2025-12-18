import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtDecoderService {

  constructor() { }

  /**
   * Decodifica un token JWT e restituisce il payload
   */
  decodeToken(token: string): any {
    try {
      if (!token) {
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT non valido');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Errore nella decodifica del token JWT:', error);
      return null;
    }
  }

  /**
   * Estrae i ruoli dal token JWT
   * Supporta sia il claim standard "role" che "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
   */
  getRolesFromToken(token: string): string[] {
    const payload = this.decodeToken(token);
    if (!payload) {
      return [];
    }

    // Prova diversi formati di claim per i ruoli
    const rolesClaim = payload['role'] 
      || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || payload['roles'];

    if (!rolesClaim) {
      return [];
    }

    // Se il claim è un array, restituiscilo direttamente
    if (Array.isArray(rolesClaim)) {
      return rolesClaim;
    }

    // Se è una stringa singola, restituiscila come array
    return [rolesClaim];
  }

  /**
   * Estrae i permessi/claims dal token JWT
   * Cerca claims personalizzati per i permessi
   */
  getPermissionsFromToken(token: string): string[] {
    const payload = this.decodeToken(token);
    if (!payload) {
      return [];
    }

    // Prova diversi formati di claim per i permessi
    const permissionsClaim = payload['permissions']
      || payload['permission']
      || payload['claims']
      || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/permission'];

    if (!permissionsClaim) {
      return [];
    }

    // Se il claim è un array, restituiscilo direttamente
    if (Array.isArray(permissionsClaim)) {
      return permissionsClaim;
    }

    // Se è una stringa singola, restituiscila come array
    return [permissionsClaim];
  }

  /**
   * Estrae un claim specifico dal token
   */
  getClaimFromToken(token: string, claimName: string): any {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    return payload[claimName];
  }

  /**
   * Verifica se il token è scaduto
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  /**
   * Estrae l'email/username dal token
   */
  getUsernameFromToken(token: string): string | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    return payload['email'] 
      || payload['sub'] 
      || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      || payload['unique_name']
      || null;
  }
}
