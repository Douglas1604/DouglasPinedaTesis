/**
 * @fileoverview Servicio de conexión HTTP para el módulo de asignaciones.
 * Este archivo actúa como el puente de comunicación entre el frontend (Angular) 
 * y nuestra API en el backend (Node.js/Express). Centraliza todas las peticiones 
 * de red para mantener los componentes limpios y enfocados solo en la vista.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  // 'root' hace que este servicio esté disponible en toda la aplicación 
  // sin necesidad de declararlo en cada módulo individualmente.
  providedIn: 'root'
})
export class AsignacionService {
  // Ruta base de nuestro endpoint en el servidor local
  private apiUrl = 'http://localhost:3000/api/asignaciones';

  constructor(private http: HttpClient) {}

  /**
   * @description Envía al servidor los datos de una terna de Privado o Seminario.
   * La estructura es de 1 a N (Un catedrático y un grupo de alumnos).
   * @param profesor_nombre El nombre (y/o grupo) del catedrático seleccionado.
   * @param alumnos Arreglo con los alumnos que fueron sorteados para este catedrático.
   * @param tipo_evento_id El ID de la modalidad (1 = Privado, 2 = Seminario).
   */
  guardarTerna(profesor_nombre: string, alumnos: any[], tipo_evento_id: number): Observable<any> {
    // Mandamos la bandera 'es_tesis: false' para que el backend sepa cómo estructurar el INSERT en la base de datos
    return this.http.post(this.apiUrl, { es_tesis: false, profesor_nombre, alumnos, tipo_evento_id });
  }

  /**
   * @description Envía al servidor los datos de un jurado de Tesis.
   * La estructura es invertida: 3 a 1 (Tres catedráticos evaluando a un solo alumno).
   * @param alumno El estudiante que defenderá su tesis.
   * @param profesores Arreglo con los 3 catedráticos (Presidente, Vocal 1, Vocal 2).
   * @param tipo_evento_id El ID de la modalidad (3 = Tesis).
   */
  guardarTesis(alumno: any, profesores: any[], tipo_evento_id: number): Observable<any> {
    // Mandamos la bandera 'es_tesis: true' para que el backend active la lógica de roles (Presidente, Vocales)
    return this.http.post(this.apiUrl, { es_tesis: true, alumno, profesores, tipo_evento_id });
  }

  /**
   * @description Pide al servidor todo el historial de asignaciones guardadas.
   * Devuelve un Observable al que el componente de Reportes se va a suscribir 
   * para recibir la data asíncronamente y armar los Excel.
   */
  obtenerAsignaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}