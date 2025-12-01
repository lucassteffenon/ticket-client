import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { AppConfig } from '../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = `${AppConfig.apiUrl}`;

  currentUser: { id: number, name: string, email: string, role: 'client' | 'attendant' } | null = null;

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  private loadSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  login(email: string, password: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/api/login`, {
      email,
      password
    });
  }

  register(userData: { name: string, cpf: string, email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/register`, userData);
  }

  isAttendant(): boolean {
    return this.currentUser?.role === 'attendant';
  }

  myData(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/api/users/me`, { headers: headers });
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
}
