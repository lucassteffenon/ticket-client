import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsService, Event } from '../../services/events.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-detail.html'
})
export class EventDetailComponent implements OnInit {
  event: Event | undefined;
  loading = true;
  checkingEnrollment = true;
  isAlreadyEnrolled = false;
  existingTicketCode = '';

  enrollmentStatus: 'idle' | 'processing' | 'success' | 'error' = 'idle';
  ticketCode = '';
  hasPresence = false;
  eventEnded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    public auth: AuthService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.eventsService.getEvent(id).subscribe((event) => {
        this.event = event;
        this.loading = false;

        if (this.event && this.event.ends_at) {
          this.eventEnded = new Date(this.event.ends_at) < new Date();
        }

        // Se o usuário estiver logado, verificar se já está inscrito
        if (this.auth.currentUser) {
          this.checkEnrollment();
        } else {
          this.checkingEnrollment = false;
        }
      });
    }
  }

  checkEnrollment() {
    this.checkingEnrollment = true;

    this.eventsService.getMyEnrollments().subscribe({
      next: (enrollments) => {

        // Verifica se o usuário já está inscrito neste evento (excluindo cancelados)
        const enrollment = enrollments.find(
          (e: any) => e.event_id === parseInt(this.event?.id || '0') && e.status !== 'cancelled'
        );

        if (enrollment) {
          this.isAlreadyEnrolled = true;
          this.existingTicketCode = enrollment.id?.toString() || 'CONFIRMADO';
          this.enrollmentStatus = 'success';
          this.ticketCode = this.existingTicketCode;
          this.hasPresence = enrollment.status === 'present';
        } else {
          this.isAlreadyEnrolled = false;
        }

        this.checkingEnrollment = false;
      },
      error: (err) => {
        console.error('Erro ao verificar enrollments:', err);
        this.checkingEnrollment = false;
      }
    });
  }

  enroll() {
    if (!this.event) return;

    if (!this.auth.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Se já está inscrito, não fazer nada
    if (this.isAlreadyEnrolled) {
      return;
    }

    this.enrollmentStatus = 'processing';

    this.eventsService.enroll({
      user_id: this.auth.currentUser.id,
      event_id: parseInt(this.event.id),
      source: 'web'
    }).subscribe({
      next: (res) => {
        this.enrollmentStatus = 'success';
        this.isAlreadyEnrolled = true;
        this.ticketCode = res.ticketCode || res.enrollment?.id || 'CONFIRMADO';
      },
      error: (err) => {
        console.error('Erro ao fazer enrollment:', err);
        this.enrollmentStatus = 'error';
      }
    });
  }

  cancelEnrollment() {
    if (!this.event || !this.auth.currentUser) return;

    this.eventsService.cancelEnrollment(parseInt(this.event.id), this.auth.currentUser.id).subscribe({
      next: () => {
        this.isAlreadyEnrolled = false;
        this.ticketCode = '';
        this.enrollmentStatus = 'idle';
      },
      error: (err) => {
        console.error('Erro ao cancelar enrollment:', err);
      }
    });
  }

}
