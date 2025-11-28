import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventsService, Event } from '../../services/events.service';
import { OfflineService } from '../../services/offline.service';
import { AppConfig } from '../../config';

interface Participant {
    id: string;
    name: string;
    email: string;
    ticket_code: string;
    checked_in: boolean;
    checked_in_at?: string;
}

@Component({
    selector: 'app-attendant-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendant-dashboard.html',
})
export class AttendantDashboardComponent implements OnInit {
    events: Event[] = [];
    selectedEvent: Event | null = null;
    participants: Participant[] = [];
    filteredParticipants: Participant[] = [];
    searchTerm: string = '';
    loading: boolean = false;
    isOffline: boolean = !navigator.onLine;
    offlineDataLoaded: boolean = false;

    constructor(
        private eventsService: EventsService,
        private offlineService: OfflineService,
        private http: HttpClient
    ) {
        window.addEventListener('online', () => this.isOffline = false);
        window.addEventListener('offline', () => this.isOffline = true);
    }

    ngOnInit() {
        this.loadEvents();
    }

    loadEvents() {
        this.loading = true;

        this.eventsService.getEvents().subscribe({
            next: (data) => {
                this.events = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar eventos:', err);
                this.loading = false;
            }
        });
    }

    selectEvent(event: Event) {
        this.selectedEvent = event;
        this.loadParticipants(event.id);
    }

    loadParticipants(eventId: string) {
        this.loading = true;
        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.get<Participant[]>(`${AppConfig.apiUrl}/api/events/${eventId}/participants`, { headers })
            .subscribe({
                next: (data) => {
                    this.participants = data;
                    this.filteredParticipants = data;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Erro ao carregar participantes:', err);
                    this.loading = false;
                }
            });
    }

    filterParticipants() {
        if (!this.searchTerm) {
            this.filteredParticipants = this.participants;
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.filteredParticipants = this.participants.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term) ||
            p.ticket_code.toLowerCase().includes(term)
        );
    }

    async checkIn(participant: Participant) {
        if (participant.checked_in) return;

        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.post(
            `${AppConfig.apiUrl}/api/events/${this.selectedEvent?.id}/checkin`,
            { ticket_code: participant.ticket_code },
            { headers }
        ).subscribe({
            next: () => {
                participant.checked_in = true;
                participant.checked_in_at = new Date().toISOString();
            },
            error: (err) => {
                console.error('Erro ao fazer check-in:', err);
                alert('Erro ao fazer check-in. Tente novamente.');
            }
        });
    }

    async downloadForOffline() {
        if (!this.selectedEvent) {
            alert('Selecione um evento primeiro!');
            return;
        }

        this.loading = true;

        try {
            // Salvar dados no IndexedDB para uso offline
            const offlineData = {
                event: this.selectedEvent,
                participants: this.participants,
                downloadedAt: new Date().toISOString()
            };

            localStorage.setItem(`offline_event_${this.selectedEvent.id}`, JSON.stringify(offlineData));
            this.offlineDataLoaded = true;
            this.loading = false;
            alert('Dados baixados com sucesso! Agora você pode trabalhar offline.');
        } catch (err) {
            console.error('Erro ao baixar dados:', err);
            this.loading = false;
            alert('Erro ao baixar dados para modo offline.');
        }
    }

    backToEvents() {
        this.selectedEvent = null;
        this.participants = [];
        this.filteredParticipants = [];
        this.searchTerm = '';
    }

    getCheckedInCount(): number {
        return this.participants.filter(p => p.checked_in).length;
    }

    getTotalCount(): number {
        return this.participants.length;
    }
}
