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
        
        // Verifica se o usuário já está inscrito neste evento
        const enrollment = enrollments.find(
          (e: any) => e.event_id === parseInt(this.event?.id || '0')
        );
        
        if (enrollment) {
          this.isAlreadyEnrolled = true;
          this.existingTicketCode = enrollment.id?.toString() || 'CONFIRMADO';
          this.enrollmentStatus = 'success';
          this.ticketCode = this.existingTicketCode;
        } else {
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
}
