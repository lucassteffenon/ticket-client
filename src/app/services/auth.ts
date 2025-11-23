import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { AppConfig } from '../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = `${AppConfig.apiUrl}/auth`;

  currentUser: { name: string, email: string, role: 'client' | 'attendant' } | null = null;

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
    // Mock login for demonstration
    if (email === 'attendant@test.com') {
      const user = { name: 'Attendant User', email, role: 'attendant' as const };
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return of({ token: 'mock-token', role: 'attendant' });
    }

    // Mock client login
    const user = { name: 'Client User', email, role: 'client' as const };
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return of({ token: 'mock-token', role: 'client' });
    return this.http.post(`${this.apiUrl}/login`, {
      email,
      password
    });
  }

  isAttendant(): boolean {
    return this.currentUser?.role === 'attendant';
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
}
