import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppConfig } from '../config';

export interface Event {
    id: string;
    title: string;
    starts_at: string;
    location: string;
    description: string;
    imageUrl: string;
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

    private apiUrl = `${AppConfig.apiUrl}`;

    private events: Event[] = [
    ];

    constructor(private http: HttpClient) { 
        
    }

    getEvents(): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.apiUrl}/api/events`);
    }

    getEvent(id: string): Observable<Event | undefined> {

        return this.http.get<Event>(`${this.apiUrl}/api/events/${id}`);
    }

    enroll(request: EnrollmentRequest): Observable<{ success: boolean; ticketCode: string }> {
        // Mock enrollment
        console.log('Enrolling user:', request);
        const ticketCode = `TICKET-${Math.floor(Math.random() * 10000)}`;
        return of({ success: true, ticketCode });
    }
}
