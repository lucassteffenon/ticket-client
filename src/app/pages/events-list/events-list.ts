import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventsService, Event } from '../../services/events.service';
import { Router } from '@angular/router';

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

  constructor(private eventsService: EventsService, private router: Router) { }

  ngOnInit() {
  this.eventsService.getEvents().subscribe({
    next: (data) => {
      this.events = data;
      this.loading = false;
    },
    error: (err) => {
      console.error('Erro ao carregar eventos:', err);
      this.loading = false;
      // Redirecionar para login se não autorizado
      if (err.status === 401) {
      this.router.navigate(['/login']);
      }
    }
  });

  }
}
