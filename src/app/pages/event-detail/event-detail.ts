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
  templateUrl: './event-detail.html',
  styleUrls: ['./event-detail.css'],
})
export class EventDetailComponent implements OnInit {
  event: Event | undefined;
  loading = true;

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
      });
    }
  }

  enroll() {
    if (!this.event) return;

    if (!this.auth.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.enrollmentStatus = 'processing';

    this.eventsService.enroll({
      eventId: this.event.id,
      name: this.auth.currentUser.name,
      email: this.auth.currentUser.email
    }).subscribe({
      next: (res) => {
        this.enrollmentStatus = 'success';
        this.ticketCode = res.ticketCode;
      },
      error: () => {
        this.enrollmentStatus = 'error';
      }
    });
  }
}
