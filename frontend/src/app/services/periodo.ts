import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Periodo {
  id?: number;
  nombre: string;
  activo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodoService {
  private apiUrl = 'http://localhost:3000/api/periodos';

  constructor(private http: HttpClient) {}

  getPeriodos(): Observable<Periodo[]> { return this.http.get<Periodo[]>(this.apiUrl); }
  agregarPeriodo(periodo: Periodo): Observable<any> { return this.http.post(this.apiUrl, periodo); }
  actualizarPeriodo(id: number, periodo: Periodo): Observable<any> { return this.http.put(`${this.apiUrl}/${id}`, periodo); }
  eliminarPeriodo(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/${id}`); }
}