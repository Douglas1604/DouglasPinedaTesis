/**
 * @fileoverview Archivo central de enrutamiento (Router) de la aplicación Angular.
 * Aquí definimos el mapa de navegación del sistema, asociando cada URL 
 * con su pantalla (componente) correspondiente para manejar el flujo del usuario.
 */

import { Routes } from '@angular/router';

// Importación de las pantallas principales del sistema
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { SorteoComponent } from './pages/sorteo/sorteo';
import { ReportesComponent } from './pages/reportes/reportes';

export const routes: Routes = [
  // Definición de las rutas válidas a las que el usuario puede acceder
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },     
  { path: 'sorteo', component: SorteoComponent },   
  { path: 'reportes', component: ReportesComponent },
  
  // Regla por defecto: Si el usuario entra a la raíz de la app (ej. localhost:4200/), 
  // lo redirigimos automáticamente a la pantalla de inicio de sesión.
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Regla de seguridad (Wildcard): Si alguien escribe una URL que no existe 
  // en el navegador (ej. localhost:4200/cualquiercosa), el sistema lo atrapa 
  // y lo devuelve al login para evitar errores de pantalla en blanco (404).
  { path: '**', redirectTo: 'login' }
];