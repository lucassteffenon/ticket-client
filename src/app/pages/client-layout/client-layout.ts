import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-client-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './client-layout.html'
})
export class ClientLayoutComponent {
    constructor(public auth: AuthService, private router: Router) { }

    logout() {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
