/**
 * @fileoverview Controlador de la pantalla de Inicio de Sesión (Login).
 * Este archivo se encarga de recolectar las credenciales del usuario, 
 * validarlas de lado del cliente y enviarlas al servicio de autenticación 
 * para verificar su acceso en la base de datos a través del backend.
 */

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
  // Variables vinculadas a los inputs del formulario en el HTML mediante ngModel
  email: string = '';
  password: string = '';
  
  // Variable para mostrar mensajes de advertencia si las credenciales fallan
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * @description Se ejecuta al hacer clic en el botón de "Ingresar".
   * Empaqueta las credenciales y consume el endpoint de login del servidor.
   * Si el acceso es correcto, crea la sesión local y redirige al panel principal.
   */
  onLogin() {
    // Validación básica en el frontend para no hacer peticiones innecesarias al servidor
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa correo y contraseña';
      return;
    }

    // Estructuramos el objeto JSON tal como lo espera nuestra API en Node.js
    const credentials = {
      email: this.email,
      password_hash: this.password
    };

    // Llamada asíncrona al servicio de autenticación
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Guardamos la información del usuario en la memoria del navegador (localStorage)
        // Esto nos sirve para mantener la sesión activa mientras usa el sistema
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirigimos al usuario directamente al panel de control (Dashboard)
        this.router.navigate(['/dashboard']);      
      },
      error: (error) => {
        // Atrapamos cualquier rechazo del servidor (por ejemplo, el error 401 No Autorizado)
        console.error('Error de autenticación:', error);
        this.errorMessage = 'Correo o contraseña incorrectos';
      }
    });
  }
}