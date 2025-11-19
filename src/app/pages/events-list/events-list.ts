import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-list.html',
  styleUrl: './events-list.css',
})
export class EventsListComponent {
  events = [
    { id: 1, name: 'Angular Conference', date: '2024-09-15' },
    { id: 2, name: 'JavaScript Summit', date: '2024-10-20' },
    { id: 3, name: 'Web Dev Meetup', date: '2024-11-05' },
  ];
}
