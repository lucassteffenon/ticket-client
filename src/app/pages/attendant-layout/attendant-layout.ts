import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-attendant-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './attendant-layout.html',
    styleUrls: [],
})
export class AttendantLayoutComponent {
    isOffline: boolean = !navigator.onLine;
    isSidebarOpen: boolean = true;

    constructor(
        public syncService: SyncService,
        private router: Router,
        private auth: AuthService
    ) {
        window.addEventListener('online', () => this.isOffline = false);
        window.addEventListener('offline', () => this.isOffline = true);
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    logout() {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
