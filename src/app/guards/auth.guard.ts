import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        // Verifica se o usuário está logado
        if (!this.auth.currentUser) {
            return this.router.createUrlTree(['/login']);
        }

        // Se a rota é do atendente, verifica se é atendente
        if (route.routeConfig?.path?.startsWith('attendant')) {
            if (!this.auth.isAttendant()) {
                return this.router.createUrlTree(['/events']);
            }
        }

        return true;
    }
}
