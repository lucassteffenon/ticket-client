import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  login() {
    this.errorMessage = '';
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        // Se a API devolver token/JWT
        if (res?.token) {
          localStorage.setItem('token', res.token);
        }

        this.loading = false;

        // Redireciona para a lista de eventos
        this.router.navigate(['/events']);
      },

      error: (err) => {
        this.loading = false;

        this.errorMessage =
          err?.error?.message || 'Email ou senha inválidos';
      }
    });
  }
}
