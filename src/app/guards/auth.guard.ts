import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        if (this.auth.isAttendant()) {
            return true;
        }
        // Redirect to login if not authorized
        return this.router.createUrlTree(['/login']);
    }
}
