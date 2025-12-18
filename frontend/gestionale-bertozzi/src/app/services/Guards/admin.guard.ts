import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    constructor(private as: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        if(this.as.hasRole('Amministratore')) {
            return true;
        } else {
            return this.router.createUrlTree(['auth', 'access']);
        }
    }
}   