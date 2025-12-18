import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";

export const accessoGuard: CanActivateFn = (): any => {
    const router = inject(Router);
    const as: AuthService = inject(AuthService);

    if (as.isLoggedIn()) {
        return true;
    }

    router.navigate(['auth', 'login'], {
        queryParams: {
            returnUrl: window.location.pathname,
        }
    });
}