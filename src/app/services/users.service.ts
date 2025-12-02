import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config';

@Injectable({
    providedIn: 'root',
})
export class UsersService {
    private apiUrl = `${AppConfig.apiUrl}`;

    constructor(private http: HttpClient) { }

    getUser(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/api/users/${id}`);
    }
}
