import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    imageUrl: string;
    price: number;
}

export interface EnrollmentRequest {
    eventId: string;
    name: string;
    email: string;
}

@Injectable({
    providedIn: 'root',
})
export class EventsService {
    // Mock Data
    private events: Event[] = [
        {
            id: '1',
            title: 'Cúpula Global Angular',
            date: '2024-11-15T09:00:00',
            location: 'Online',
            description: 'Participe do maior evento da comunidade Angular do ano. Aprenda com especialistas e faça networking com desenvolvedores de todo o mundo.',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Angular_full_color_logo.svg',
            price: 0
        },
        {
            id: '2',
            title: 'Expo de Inovação Tecnológica',
            date: '2024-12-05T10:00:00',
            location: 'São Francisco, CA',
            description: 'Descubra as últimas tendências em IA, Blockchain e IoT. Experimente demonstrações práticas e palestras principais.',
            imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
            price: 150
        },
        {
            id: '3',
            title: 'Festival de Música 2025',
            date: '2025-01-20T14:00:00',
            location: 'Rio de Janeiro, Brasil',
            description: 'Três dias de música, comida e diversão ininterruptas. Apresentando os principais artistas internacionais.',
            imageUrl: 'https://images.unsplash.com/photo-1459749411177-2a2960954401?auto=format&fit=crop&w=1000&q=80',
            price: 300
        }
    ];

    constructor() { }

    getEvents(): Observable<Event[]> {
        return of(this.events).pipe(delay(500)); // Simulate network delay
    }

    getEvent(id: string): Observable<Event | undefined> {
        const event = this.events.find(e => e.id === id);
        return of(event).pipe(delay(500));
    }

    enroll(request: EnrollmentRequest): Observable<{ success: boolean; ticketCode: string }> {
        // Mock enrollment
        console.log('Enrolling user:', request);
        const ticketCode = `TICKET-${Math.floor(Math.random() * 10000)}`;
        return of({ success: true, ticketCode }).pipe(delay(1000));
    }
}
