import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// La estructura EXACTA de tu tabla en MariaDB
export interface Profesor {
  id?: number;
  usuario_id?: number | null;
  nombre_completo: string;
  especialidad: string;
  max_carga: number;
  activo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfesorService {
  private apiUrl = 'http://localhost:3000/api/profesores';

  constructor(private http: HttpClient) {}

  // Pedir lista al servidor
  getProfesores(): Observable<Profesor[]> {
    return this.http.get<Profesor[]>(this.apiUrl);
  }

  // Enviar uno nuevo al servidor
  agregarProfesor(profesor: Profesor): Observable<any> {
    return this.http.post(this.apiUrl, profesor);
  }

  // Eliminar por ID
  eliminarProfesor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}