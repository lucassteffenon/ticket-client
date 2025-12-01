import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import { EventsService, Event } from '../../services/events.service';

@Component({
    selector: 'app-attendant-sales',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendant-sales.html',
    styleUrls: []
})
export class AttendantSalesComponent implements OnInit {
    name: string = '';
    email: string = '';
    selectedEventId: string = '';
    availableEvents: Event[] = [];

    message: string = '';
    status: 'idle' | 'success' | 'error' = 'idle';
    isOffline: boolean = !navigator.onLine;

    constructor(
        private offlineService: OfflineService,
        public syncService: SyncService,
        private eventsService: EventsService
    ) {
        window.addEventListener('online', () => this.isOffline = false);
        window.addEventListener('offline', () => this.isOffline = true);
    }

    ngOnInit() {
        this.loadAvailableEvents();
    }

    async loadAvailableEvents() {
        // Se estiver offline, carregar do IndexedDB
        if (this.isOffline) {
            await this.loadOfflineEvents();
            return;
        }

        // Se estiver online, carregar da API
        this.eventsService.getEvents().subscribe({
            next: (events) => {
                const now = new Date();
                
                // Filtrar eventos que ainda não terminaram
                this.availableEvents = events.filter(event => {
                    const endTime = new Date(event.ends_at);
                    return endTime > now;
                });

                // Ordenar por data de início
                this.availableEvents.sort((a, b) => 
                    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
                );
            },
            error: async (err) => {
                console.error('Erro ao carregar eventos:', err);
                // Se falhar, tentar carregar do offline
                await this.loadOfflineEvents();
            }
        });
    }

    async loadOfflineEvents() {
        try {
            const offlineEvents = await this.offlineService.getAllOfflineEvents();
            const now = new Date();
            
            // Filtrar eventos que ainda não terminaram e mapear para Event[]
            this.availableEvents = offlineEvents
                .map(data => data.event)
                .filter(event => {
                    const endTime = new Date(event.ends_at);
                    return endTime > now;
                })
                .sort((a, b) => 
                    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
                );

            if (this.availableEvents.length === 0) {
                this.status = 'error';
                this.message = 'Nenhum evento disponível offline. Conecte-se à internet e clique em "Baixar Dados" primeiro.';
            }
        } catch (err) {
            console.error('Erro ao carregar eventos offline:', err);
            this.status = 'error';
            this.message = 'Erro ao carregar eventos offline.';
        }
    }

    formatEventTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async register() {
        if (!this.name || !this.email || !this.selectedEventId) {
            this.message = 'Por favor, preencha todos os campos.';
            this.status = 'error';
            return;
        }

        this.status = 'idle';
        this.message = 'Processando...';

        try {
            const registration = {
                name: this.name,
                email: this.email,
                eventId: this.selectedEventId,
                timestamp: Date.now()
            };

            // Always save to pending registrations first (Offline First approach)
            await this.offlineService.addPendingRegistration(registration);

            this.status = 'success';
            this.message = 'Registro salvo! Clique em "Sincronizar" para enviar ao servidor.';

            this.name = '';
            this.email = '';
            this.selectedEventId = '';

        } catch (err) {
            console.error(err);
            this.status = 'error';
            this.message = 'Erro ao salvar registro.';
        }
    }

    async syncNow() {
        const result = await this.syncService.sync();
        
        if (result.success) {
            alert(result.message);
        } else {
            alert('Erro na sincronização: ' + result.message);
        }
    }
}
