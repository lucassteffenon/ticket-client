import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventsService, Event } from '../../services/events.service';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events-list.html',
  styleUrls: [],
})
export class EventsListComponent implements OnInit {
  events: Event[] = [];
  loading = true;
  enrolledEventIds: Set<number> = new Set();

  constructor(
    private eventsService: EventsService, 
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.eventsService.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
        
        // Se o usuário estiver logado, buscar seus enrollments
        if (this.authService.currentUser) {
          this.loadUserEnrollments();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        this.loading = false;
      }
    });
  }

  loadUserEnrollments() {
    this.eventsService.getMyEnrollments().subscribe({
      next: (enrollments) => {
        // Criar um Set com os IDs dos eventos inscritos
        this.enrolledEventIds = new Set(
          enrollments.map((e: any) => e.event_id)
        );
      },
      error: (err) => {
        console.error('Erro ao carregar enrollments:', err);
      }
    });
  }

  isEnrolled(eventId: string): boolean {
    return this.enrolledEventIds.has(parseInt(eventId));
  }
}
