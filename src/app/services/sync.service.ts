import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OfflineService } from './offline.service';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    private apiUrl = `${AppConfig.apiUrl}/api`;
    public syncing$ = new BehaviorSubject<boolean>(false);
    public lastSyncTime$ = new BehaviorSubject<Date | null>(null);

    constructor(private http: HttpClient, private offlineService: OfflineService) {}

    private formatDateTime(timestamp: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    async sync() {
        if (!navigator.onLine) {
            alert('Sem conexão com a internet!');
            return { success: false, message: 'Offline' };
        }

        this.syncing$.next(true);
        const results = {
            checkins: 0,
            registrations: 0,
            errors: [] as string[]
        };

        // Pegar token de autenticação
        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        try {
            // 1. Sincronizar CHECK-INS pendentes (usuários que já existem)
            const pendingCheckins = await this.offlineService.getPendingCheckins();
            if (pendingCheckins.length > 0) {
                console.log(`Sincronizando ${pendingCheckins.length} check-ins...`);
                
                for (const checkin of pendingCheckins) {
                    try {
                        await firstValueFrom(
                            this.http.post(
                                `${this.apiUrl}/enrollments/events/${checkin.event_id}/users/${checkin.user_id}/presence`,
                                { checkin_time: checkin.checkin_time },
                                { headers }
                            )
                        );
                        results.checkins++;
                    } catch (err: any) {
                        console.error('Erro ao sincronizar check-in:', err);
                        results.errors.push(`Check-in user ${checkin.user_id}: ${err.message}`);
                    }
                }
                
                await this.offlineService.clearPendingCheckins();
                console.log(`${results.checkins} check-ins sincronizados.`);
            }

            // 2. Sincronizar REGISTROS presenciais (vendas na hora)
            const pendingRegistrations = await this.offlineService.getPendingRegistrations();
            if (pendingRegistrations.length > 0) {
                console.log(`Sincronizando ${pendingRegistrations.length} registros presenciais...`);
                console.log('Registros pendentes:', pendingRegistrations);
                
                // Agrupar por evento
                const byEvent = pendingRegistrations.reduce((acc, reg) => {
                    if (!acc[reg.eventId]) acc[reg.eventId] = [];
                    acc[reg.eventId].push({
                        name: reg.name,
                        email: reg.email,
                        checkin_time: this.formatDateTime(reg.timestamp)
                    });
                    return acc;
                }, {} as Record<string, any[]>);

                console.log('Agrupado por evento:', byEvent);

                // Sincronizar por evento
                for (const [eventId, users] of Object.entries(byEvent)) {
                    const payload = { users };
                    console.log(`Enviando para evento ${eventId}:`, payload);
                    console.log('URL:', `${this.apiUrl}/enrollments/events/${eventId}/sync`);
                    
                    try {
                        const response = await firstValueFrom(
                            this.http.post(
                                `${this.apiUrl}/enrollments/events/${eventId}/sync`,
                                payload,
                                { headers }
                            )
                        );
                        console.log('Resposta do servidor:', response);
                        results.registrations += users.length;
                    } catch (err: any) {
                        console.error('Erro ao sincronizar registros do evento:', err);
                        console.error('Erro completo:', JSON.stringify(err, null, 2));
                        results.errors.push(`Evento ${eventId}: ${err.message}`);
                    }
                }
                
                await this.offlineService.clearPendingRegistrations();
                console.log(`${results.registrations} registros presenciais sincronizados.`);
            }

            this.lastSyncTime$.next(new Date());
            this.syncing$.next(false);

            return {
                success: true,
                message: `Sincronização concluída! ${results.checkins} check-ins, ${results.registrations} registros.`,
                ...results
            };

        } catch (error: any) {
            console.error('Sync failed', error);
            this.syncing$.next(false);
            return {
                success: false,
                message: 'Erro na sincronização: ' + error.message,
                ...results
            };
        }
    }

    getPendingCount(): Promise<number> {
        return Promise.all([
            this.offlineService.getPendingCheckins(),
            this.offlineService.getPendingRegistrations()
        ]).then(([checkins, regs]) => checkins.length + regs.length);
    }

    async downloadAllData() {
        if (!navigator.onLine) {
            alert('Sem conexão com a internet!');
            return { success: false, message: 'Offline' };
        }

        this.syncing$.next(true);
        const results = {
            events: 0,
            participants: 0,
            errors: [] as string[]
        };

        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        try {
            console.log('Iniciando download de todos os dados...');

            // 1. Buscar todos os eventos
            const events: any[] = await firstValueFrom(
                this.http.get<any[]>(`${this.apiUrl}/events`, { headers })
            );
            console.log(`${events.length} eventos encontrados`);

            // 2. Para cada evento, baixar participantes e salvar
            for (const event of events) {
                try {
                    console.log(`Baixando participantes do evento: ${event.title}`);
                    
                    const enrollments: any[] = await firstValueFrom(
                        this.http.get<any[]>(
                            `${this.apiUrl}/enrollments/events/${event.id}`,
                            { headers }
                        )
                    );

                    // Mapear para o formato esperado
                    const participants = enrollments.map(item => ({
                        id: item.user_id?.toString() || '',
                        name: item.user_name || '',
                        email: item.user_email || '',
                        ticket_code: item.status || '',
                        checked_in: item.checkin_time !== null,
                        checked_in_at: item.checkin_time || undefined
                    }));

                    // Salvar no IndexedDB
                    await this.offlineService.saveEventForOffline(
                        event.id,
                        event,
                        participants
                    );

                    results.events++;
                    results.participants += participants.length;
                    console.log(`✓ ${event.title}: ${participants.length} participantes salvos`);

                } catch (err: any) {
                    console.error(`Erro ao baixar dados do evento ${event.title}:`, err);
                    results.errors.push(`Evento ${event.title}: ${err.message}`);
                }
            }

            this.syncing$.next(false);
            console.log('Download completo!', results);

            return {
                success: true,
                message: `Download concluído! ${results.events} eventos, ${results.participants} participantes salvos.`,
                ...results
            };

        } catch (error: any) {
            console.error('Download failed:', error);
            this.syncing$.next(false);
            return {
                success: false,
                message: 'Erro no download: ' + error.message,
                ...results
            };
        }
    }
}
