import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventsService, Event } from '../../services/events.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events-list.html',
  styleUrls: ['./events-list.css'],
})
export class EventsListComponent implements OnInit {
  events: Event[] = [];
  loading = true;

  constructor(private eventsService: EventsService) { }

  ngOnInit() {
    this.eventsService.getEvents().subscribe((data) => {
      this.events = data;
      this.loading = false;
    });
  }
}
