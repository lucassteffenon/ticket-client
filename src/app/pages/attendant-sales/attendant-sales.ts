import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';

@Component({
    selector: 'app-attendant-sales',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendant-sales.html',
    styleUrls: ['./attendant-sales.css']
})
export class AttendantSalesComponent {
    name: string = '';
    email: string = '';
    eventId: string = '1'; // Default or selected from a list

    message: string = '';
    status: 'idle' | 'success' | 'error' = 'idle';
    isOffline: boolean = !navigator.onLine;

    constructor(
        private offlineService: OfflineService,
        public syncService: SyncService
    ) {
        window.addEventListener('online', () => this.isOffline = false);
        window.addEventListener('offline', () => this.isOffline = true);
    }

    async register() {
        if (!this.name || !this.email) {
            this.message = 'Please fill in all fields.';
            this.status = 'error';
            return;
        }

        this.status = 'idle';
        this.message = 'Processing...';

        try {
            const registration = {
                name: this.name,
                email: this.email,
                eventId: this.eventId,
                timestamp: Date.now()
            };

            // Always save to pending registrations first (Offline First approach)
            // In a real app, we might try to send directly if online, but queuing is safer.
            await this.offlineService.addPendingRegistration(registration);

            this.status = 'success';
            this.message = 'Registration saved! ' + (this.isOffline ? 'Will sync when online.' : 'Syncing now...');

            this.name = '';
            this.email = '';

            if (!this.isOffline) {
                this.syncService.sync();
            }

        } catch (err) {
            console.error(err);
            this.status = 'error';
            this.message = 'Error saving registration.';
        }
    }
}
