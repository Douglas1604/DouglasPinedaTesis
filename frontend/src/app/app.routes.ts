import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { SorteoComponent } from './pages/sorteo/sorteo';
import { PeriodosComponent } from './pages/periodos/periodos';
import { ReportesComponent } from './pages/reportes/reportes'; // <-- ESTA LÍNEA FALTABA

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },     
  { path: 'sorteo', component: SorteoComponent },   
  { path: 'periodos', component: PeriodosComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];