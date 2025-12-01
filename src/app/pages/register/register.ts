import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  name = '';
  cpf = '';
  email = '';
  password = '';
  confirmPassword = '';
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    // Validações básicas
    if (!this.name || !this.cpf || !this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'A senha deve ter no mínimo 8 caracteres.';
      return;
    }

    // Validação simples de CPF (apenas formato)
    const cpfClean = this.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      this.errorMessage = 'CPF inválido. Digite apenas os números.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    // Chamar o serviço de registro
    this.authService.register({
      name: this.name,
      cpf: cpfClean,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Cadastro realizado com sucesso! Redirecionando...';
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erro ao realizar cadastro. Tente novamente.';
      }
    });
  }

  // Formatar CPF enquanto digita
  formatCPF() {
    let cpf = this.cpf.replace(/\D/g, '');
    
    if (cpf.length <= 11) {
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
      cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      this.cpf = cpf;
    }
  }
}

