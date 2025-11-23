import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';

@Component({
    selector: 'app-attendant-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendant-dashboard.html',
    styleUrls: ['./attendant-dashboard.css']
})
export class AttendantDashboardComponent {
    ticketCode: string = '';
    validationMessage: string = '';
    validationStatus: 'idle' | 'success' | 'error' = 'idle';
    isOffline: boolean = !navigator.onLine;

    constructor(
        private offlineService: OfflineService,
        public syncService: SyncService
    ) {
        window.addEventListener('online', () => this.isOffline = false);
        window.addEventListener('offline', () => this.isOffline = true);
    }

    async validateTicket() {
        if (!this.ticketCode) return;

        this.validationStatus = 'idle';
        this.validationMessage = 'Validating...';

        try {
            // 1. Check local DB first (offline-first approach)
            const ticket = await this.offlineService.getTicket(this.ticketCode);

            if (ticket) {
                if (ticket.status === 'valid') {
                    this.validationStatus = 'success';
                    this.validationMessage = `Valid Ticket! Holder: ${ticket.holderName || 'Unknown'}`;

                    // Mark as used locally
                    ticket.status = 'used';
                    await this.offlineService.saveTickets([ticket]);

                    // Add to pending validations for sync
                    await this.offlineService.addPendingValidation({
                        code: this.ticketCode,
                        timestamp: Date.now(),
                        status: 'valid'
                    });

                } else {
                    this.validationStatus = 'error';
                    this.validationMessage = `Ticket is ${ticket.status.toUpperCase()}`;
                }
            } else {
                // If not found locally and we are offline, we can't do much unless we assume full sync
                if (this.isOffline) {
                    this.validationStatus = 'error';
                    this.validationMessage = 'Ticket not found in local database.';
                } else {
                    // Fallback to online validation if needed, but for this task we focus on offline-first
                    this.validationStatus = 'error';
                    this.validationMessage = 'Ticket not found (Online fallback not implemented yet).';
                }
            }
        } catch (err) {
            console.error(err);
            this.validationStatus = 'error';
            this.validationMessage = 'Error validating ticket.';
        }
    }

    async forceSync() {
        await this.syncService.sync();
    }
}
