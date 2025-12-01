import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppConfig } from '../config';

export interface Event {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    location: string;
    description: string;
    imageUrl: string;
}

export interface EnrollmentRequest {
    user_id: number;
    event_id: number;
    source: 'web' | 'presential';
}

export interface EnrollmentResponse {
    success: boolean;
    ticketCode?: string;
    enrollment?: any;
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

    enroll(request: EnrollmentRequest): Observable<EnrollmentResponse> {
        return this.http.post<EnrollmentResponse>(`${this.apiUrl}/api/enrollments`, request);
    }

    getMyEnrollments(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/enrollments/me`);
    }
}
