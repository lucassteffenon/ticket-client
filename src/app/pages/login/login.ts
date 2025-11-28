import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})

export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  login() {
    this.errorMessage = '';
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res?.access_token) {
          localStorage.setItem('token', res.access_token);
          
          // Agora busca os dados do usuário COM o token
          this.auth.myData(res.access_token).subscribe({
            next: (userData) => {
              this.auth.currentUser = {
                name: userData.name,
                email: userData.email,
                role: userData.is_attendant ? 'attendant' : 'client'
              };
              localStorage.setItem('currentUser', JSON.stringify(this.auth.currentUser));
              
              this.loading = false;
              
              // Redireciona baseado no papel
              if (this.auth.isAttendant()) {
                this.router.navigate(['/attendant']);
              } else {
                this.router.navigate(['/events']);
              }
            },
            error: (err) => {
              this.loading = false;
              console.error('Erro ao obter dados do usuário:', err);
              this.errorMessage = 'Erro ao carregar dados do usuário';
            }
          });
        }
      },

      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Email ou senha inválidos';
      }
    });
  }
}
