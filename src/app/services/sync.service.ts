import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OfflineService } from './offline.service';
import { firstValueFrom, fromEvent, merge } from 'rxjs';
import { AppConfig } from '../config';

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    private apiUrl = `${AppConfig.apiUrl}/sync`;

    constructor(private http: HttpClient, private offlineService: OfflineService) {
        this.initAutoSync();
    }

    private initAutoSync() {
        merge(
            fromEvent(window, 'online'),
            fromEvent(window, 'offline')
        ).subscribe(() => {
            if (navigator.onLine) {
                console.log('Online detected. Starting sync...');
                this.sync();
            }
        });
    }

    async sync() {
        if (!navigator.onLine) return;

        try {
            // 1. Push pending validations
            const pending = await this.offlineService.getPendingValidations();
            if (pending.length > 0) {
                await firstValueFrom(this.http.post(`${this.apiUrl}/validate-batch`, { validations: pending }));
                // Clear local pending validations after success
                await this.offlineService.clearPendingValidations(pending.map(p => p.code));
                console.log('Pending validations synced.');
            }

            // 1.5 Push pending registrations
            const registrations = await this.offlineService.getPendingRegistrations();
            if (registrations.length > 0) {
                await firstValueFrom(this.http.post(`${this.apiUrl}/enrollments-batch`, { enrollments: registrations }));
                await this.offlineService.clearPendingRegistrations();
                console.log('Pending registrations synced.');
            }

            // 2. Pull latest tickets
            const tickets: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tickets`));
            await this.offlineService.saveTickets(tickets);
            console.log('Tickets updated from server.');

        } catch (error) {
            console.error('Sync failed', error);
        }
    }
}
