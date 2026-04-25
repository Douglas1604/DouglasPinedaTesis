import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  totalSorteos = 0; totalTesis = 0; totalPrivados = 0;
  ultimosSorteos: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargarDatos(); }

  cargarDatos() {
    this.http.get<any[]>('http://localhost:3000/api/asignaciones').subscribe({
      next: (data) => {
        this.totalSorteos = data.length;
        this.totalTesis = data.filter(d => d.modalidad === 'Tesis').length;
        this.totalPrivados = data.filter(d => d.modalidad !== 'Tesis').length;
        this.ultimosSorteos = data; 
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error", err)
    });
  }

  eliminarSorteo(carnet: string, fecha: string) {
    Swal.fire({ title: '¿Eliminar sorteo?', text: "Se borrará la asignación de este alumno.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#CC0000', confirmButtonText: 'Sí, borrar' }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:3000/api/asignaciones/alumno/${carnet}/${encodeURIComponent(fecha)}`).subscribe(() => {
          this.cargarDatos(); Swal.fire('Eliminado', 'Sorteo borrado.', 'success');
        });
      }
    });
  }

  limpiarTodaLaBase() {
    Swal.fire({ title: '¿BORRAR TODO?', text: "Limpiará TODA la tabla.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#000', confirmButtonText: 'SÍ, BORRAR TODO' }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete('http://localhost:3000/api/asignaciones/limpiar-todo').subscribe(() => {
          this.cargarDatos(); Swal.fire('Base Limpia', 'Listo para probar.', 'success');
        });
      }
    });
  }
}