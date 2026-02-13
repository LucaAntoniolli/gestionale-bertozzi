import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class UtenteBaseGuard implements CanActivate {
    constructor(private as: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        if(this.as.hasRole('Utente Base')) {
            return true;
        } else {
            return this.router.createUrlTree(['auth', 'access']);
        }
    }
}   