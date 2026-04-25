import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private apiUrl = 'http://localhost:3000/api/asignaciones';

  constructor(private http: HttpClient) {}

  guardarTerna(profesor_nombre: string, alumnos: any[], tipo_evento_id: number): Observable<any> {
    return this.http.post(this.apiUrl, { es_tesis: false, profesor_nombre, alumnos, tipo_evento_id });
  }

  guardarTesis(alumno: any, profesores: any[], tipo_evento_id: number): Observable<any> {
    return this.http.post(this.apiUrl, { es_tesis: true, alumno, profesores, tipo_evento_id });
  }

  obtenerAsignaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}