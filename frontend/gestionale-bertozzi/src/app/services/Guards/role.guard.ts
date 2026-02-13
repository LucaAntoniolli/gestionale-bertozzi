import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Guard funzionale che verifica se l'utente ha almeno uno dei ruoli specificati (OR logic)
 * @param roles Array di ruoli da verificare
 * @returns Guard function
 */
export function hasAnyRoleGuard(roles: string[]): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const hasRole = roles.some(role => authService.hasRole(role));
        
        if (hasRole) {
            return true;
        } else {
            return router.createUrlTree(['auth', 'access']);
        }
    };
}

/**
 * Guard funzionale che verifica se l'utente ha tutti i ruoli specificati (AND logic)
 * @param roles Array di ruoli da verificare
 * @returns Guard function
 */
export function hasAllRolesGuard(roles: string[]): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const hasAllRoles = roles.every(role => authService.hasRole(role));
        
        if (hasAllRoles) {
            return true;
        } else {
            return router.createUrlTree(['auth', 'access']);
        }
    };
}
