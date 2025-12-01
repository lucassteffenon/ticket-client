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

        if (this.isOffline) {
            // Se estiver offline, carregar eventos salvos no IndexedDB
            this.loadOfflineEvents();
            return;
        }

        this.eventsService.getEvents().subscribe({
            next: (data) => {
                this.events = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erro ao carregar eventos:', err);
                // Se falhar, tentar carregar do offline
                this.loadOfflineEvents();
            }
        });
    }

    async loadOfflineEvents() {
        try {
            const offlineEvents = await this.offlineService.getAllOfflineEvents();
            this.events = offlineEvents.map(data => data.event);
            this.loading = false;
            
            if (this.events.length === 0) {
                alert('Nenhum evento disponível offline. Conecte-se à internet e baixe os dados primeiro.');
            }
        } catch (err) {
            console.error('Erro ao carregar eventos offline:', err);
            this.loading = false;
        }
    }

    async selectEvent(event: Event) {
        this.selectedEvent = event;
        await this.loadParticipants(event.id);
    }

    async loadParticipants(eventId: string) {
        this.loading = true;

        // Se estiver offline, carregar do IndexedDB
        if (this.isOffline) {
            try {
                const offlineData = await this.offlineService.getOfflineEvent(eventId);
                
                if (offlineData) {
                    this.participants = offlineData.participants;
                    this.filteredParticipants = offlineData.participants;
                    this.offlineDataLoaded = true;
                    this.loading = false;
                } else {
                    this.loading = false;
                    alert('Dados deste evento não estão disponíveis offline. Conecte-se à internet.');
                }
            } catch (err) {
                console.error('Erro ao carregar dados offline:', err);
                this.loading = false;
                alert('Erro ao carregar dados offline.');
            }
            return;
        }

        // Se estiver online, carregar da API
        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.get<any[]>(`${AppConfig.apiUrl}/api/enrollments/events/${eventId}`, { headers })
            .subscribe({
                next: (data) => {
                    // Mapear a estrutura da API para o formato esperado
                    this.participants = data.map(item => ({
                        id: item.user_id?.toString() || '',
                        name: item.user_name || '',
                        email: item.user_email || '',
                        ticket_code: item.status || '',
                        checked_in: item.checkin_time !== null,
                        checked_in_at: item.checkin_time || undefined
                    }));
                    this.filteredParticipants = this.participants;
                    this.loading = false;
                    
                    // Verificar se já tem dados offline para este evento
                    this.checkOfflineData(eventId);
                },
                error: async (err) => {
                    console.error('Erro ao carregar participantes:', err);
                    
                    // Se falhar, tentar carregar do offline
                    const offlineData = await this.offlineService.getOfflineEvent(eventId);
                    if (offlineData) {
                        this.participants = offlineData.participants;
                        this.filteredParticipants = offlineData.participants;
                        this.offlineDataLoaded = true;
                        alert('Carregando dados salvos offline (sem conexão com servidor).');
                    }
                    
                    this.loading = false;
                }
            });
    }

    async checkOfflineData(eventId: string) {
        const offlineData = await this.offlineService.getOfflineEvent(eventId);
        this.offlineDataLoaded = !!offlineData;
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
            `${AppConfig.apiUrl}/api/enrollments/events/${this.selectedEvent?.id}/users/${participant.id}/presence`,
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
            // Salvar dados no IndexedDB usando o OfflineService
            await this.offlineService.saveEventForOffline(
                this.selectedEvent.id,
                this.selectedEvent,
                this.participants
            );
            
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
