import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private apiUrl = 'http://localhost:3000/api/asignaciones';

  constructor(private http: HttpClient) {}

  // Función Normal (Privados / Seminario)
  guardarTerna(profesor_nombre: string, alumnos: any[], tipo_evento_id: number, periodo_id: number): Observable<any> {
    return this.http.post(this.apiUrl, { 
      es_tesis: false, profesor_nombre, alumnos, tipo_evento_id, periodo_id 
    });
  }

  // Función Invertida para Tesis
  guardarTesis(alumno: any, profesores: any[], tipo_evento_id: number, periodo_id: number): Observable<any> {
    return this.http.post(this.apiUrl, {
      es_tesis: true, alumno, profesores, tipo_evento_id, periodo_id
    });
  }

  // <-- ESTA ES LA FUNCIÓN NUEVA PARA LOS REPORTES EXCEL
  obtenerAsignaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}