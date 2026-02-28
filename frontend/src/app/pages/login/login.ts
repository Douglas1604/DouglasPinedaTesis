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
  styleUrl: './login.css',
})
export class LoginComponent {
  // Variables para guardar lo que escribe el usuario
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa correo y contraseña';
      return;
    }

    const credentials = {
      email: this.email,
      password_hash: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Aquí guardaremos el usuario en el futuro
        localStorage.setItem('user', JSON.stringify(response.user));
        // Redirigir al Home o Dashboard (cuando lo creemos)
        this.router.navigate(['/dashboard']);      },
      error: (error) => {
        console.error('Error de login:', error);
        this.errorMessage = 'Correo o contraseña incorrectos';
      }
    });
  }
}