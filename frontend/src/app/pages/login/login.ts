/**
 * @fileoverview Controlador de la pantalla de Inicio de Sesión (Login).
 * Este archivo se encarga de recolectar las credenciales del usuario, 
 * validarlas de lado del cliente (incluyendo restricción de dominio institucional)
 * y enviarlas al servicio de autenticación para verificar su acceso.
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
   * Valida dominios de correo institucionales, empaqueta las credenciales 
   * y consume el endpoint de login del servidor.
   */
  onLogin() {
    // Validación básica de campos vacíos
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa correo y contraseña';
      return;
    }

    // =======================================================
    // REGLA DE NEGOCIO: SOLO CORREOS INSTITUCIONALES UMG
    // =======================================================
    const dominiosValidos = ['@miumg.edu.gt', '@umg.edu.gt'];
    
    // Convertimos a minúsculas por seguridad y verificamos si termina en algún dominio válido
    const esCorreoInstitucional = dominiosValidos.some(dominio => 
      this.email.toLowerCase().endsWith(dominio)
    );

    if (!esCorreoInstitucional) {
      this.errorMessage = 'Acceso denegado. Solo se permiten correos institucionales (@miumg.edu.gt o @umg.edu.gt).';
      return; // Detenemos la ejecución aquí, no hacemos petición al backend
    }

    // Estructuramos el objeto JSON tal como lo espera nuestra API
    const credentials = {
      email: this.email,
      password_hash: this.password
    };

    // Llamada asíncrona al servicio de autenticación
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Guardamos la información del usuario en la memoria del navegador
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirigimos al usuario directamente al panel de control (Dashboard)
        this.router.navigate(['/dashboard']);      
      },
      error: (error) => {
        console.error('Error de autenticación:', error);
        this.errorMessage = 'Correo o contraseña incorrectos';
      }
    });
  }
}