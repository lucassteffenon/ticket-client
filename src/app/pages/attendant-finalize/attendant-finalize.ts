import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsService, Event } from '../../services/events.service';

interface EventWithStats extends Event {
  total_participants?: number;
  participants_with_checkin?: number;
  certificates_generated?: boolean;
}

@Component({
  selector: 'app-attendant-finalize',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendant-finalize.html',
})
export class AttendantFinalizeComponent implements OnInit {
  allEvents: EventWithStats[] = [];
  eventsWithCertificates: EventWithStats[] = [];
  eventsPending: EventWithStats[] = [];
  loading = true;

  constructor(
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;

    this.eventsService.getEvents().subscribe({
      next: (data) => {
        // Não filtrar por data - mostrar todos os eventos
        this.allEvents = data;

        // Carregar estatísticas de cada evento
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        this.loading = false;
      }
    });
  }

  loadEventStats() {
    const promises = this.allEvents.map(event => {
      return this.eventsService.getEventEnrollments(event.id).toPromise().then(enrollments => {
        if (enrollments && Array.isArray(enrollments)) {
          // Total de inscritos (excluindo cancelados)
          event.total_participants = enrollments.filter(e => e.status !== 'cancelled').length;
          
          // Participantes com presença (status 'present')
          event.participants_with_checkin = enrollments.filter(e => e.status === 'present').length;
          
          // Verifica se já foram gerados certificados usando o campo 'finished' do evento
          event.certificates_generated = event.finished || false;
        } else {
          event.total_participants = 0;
          event.participants_with_checkin = 0;
          event.certificates_generated = event.finished || false;
        }
      }).catch(err => {
        console.error(`Erro ao carregar stats do evento ${event.id}:`, err);
        event.total_participants = 0;
        event.participants_with_checkin = 0;
        event.certificates_generated = event.finished || false;
      });
    });

    Promise.all(promises).then(() => {
      // Separar eventos em duas categorias
      this.eventsWithCertificates = this.allEvents.filter(e => e.certificates_generated);
      this.eventsPending = this.allEvents.filter(e => !e.certificates_generated);
      
      this.loading = false;
    });
  }

  generateCertificates(event: EventWithStats) {
    if (event.certificates_generated) {
      alert('Os certificados já foram gerados para este evento!');
      return;
    }

    if (!confirm(`Confirma a geração de certificados para o evento "${event.title}"?\n\nSerão gerados certificados para ${event.participants_with_checkin} participantes que fizeram check-in.`)) {
      return;
    }

    this.eventsService.generateEventCertificates(event.id).subscribe({
      next: (response: any) => {
        alert(`Certificados gerados com sucesso!\n\nTotal: ${response.certificates_generated || event.participants_with_checkin}`);
        event.certificates_generated = true;
      },
      error: (err) => {
        console.error('Erro ao gerar certificados:', err);
        alert('Erro ao gerar certificados. Tente novamente.');
      }
    });
  }
}
