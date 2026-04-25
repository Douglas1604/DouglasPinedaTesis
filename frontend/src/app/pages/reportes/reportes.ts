import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http'; 
import { AsignacionService } from '../../services/asignacion';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, HttpClientModule], 
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  sorteosAgrupados: any[] = []; 

  constructor(
    private asignacionService: AsignacionService, 
    private cdr: ChangeDetectorRef,
    private http: HttpClient // Inyectamos HttpClient para poder borrar
  ) {}
  
  ngOnInit() { this.cargarDatos(); }

  cargarDatos() {
    this.asignacionService.obtenerAsignaciones().subscribe({
      next: (data: any[]) => { 
        // 1. Agrupamos los datos y limpiamos los "undefined"
        const gruposMap = new Map();

        data.forEach(row => {
          // Filtro Anti-Undefined (Ignoramos la basura de la BD)
          if (row.alumno_info && row.alumno_info.includes('undefined')) return;
          if (row.profesor_nombre && row.profesor_nombre.includes('undefined')) return;

          const clave = `${row.modalidad}_${row.fecha}`;
          if (!gruposMap.has(clave)) {
            gruposMap.set(clave, {
              modalidad: row.modalidad,
              fecha_formateada: row.fecha,
              profesores: new Set(),
              alumnos: new Set()
            });
          }
          const g = gruposMap.get(clave);
          if (row.profesor_nombre) g.profesores.add(row.profesor_nombre);
          if (row.alumno_info) g.alumnos.add(row.alumno_info);
        });

        this.sorteosAgrupados = Array.from(gruposMap.values());
        this.cdr.detectChanges(); 
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los reportes.', 'error')
    });
  }

  exportarSorteoBatch(grupo: any) {
    // 2. Construimos el Excel en formato "Cascada"
    const profesArr = Array.from(grupo.profesores) as string[];
    const alumnosArr = Array.from(grupo.alumnos) as string[];
    const maxRows = Math.max(profesArr.length, alumnosArr.length);
    
    let datosExportar: any[] = [];

    for (let i = 0; i < maxRows; i++) {
      datosExportar.push({
        'Modalidad': i === 0 ? grupo.modalidad : '',
        'Catedrático': profesArr[i] || '',
        'Alumno': alumnosArr[i] || '',
        'Fecha Sorteo': i === 0 ? grupo.fecha_formateada : ''
      });
    }

    // Generamos el Excel
    const worksheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook = { Sheets: { 'Acta Oficial': worksheet }, SheetNames: ['Acta Oficial'] };
    
    const fechaLimpia = grupo.fecha_formateada.replace(/[\/\:\s]/g, '-');
    XLSX.writeFile(workbook, `Reporte_${grupo.modalidad}_${fechaLimpia}.xlsx`);
  }

  // 3. Función para el botón rojo de Eliminar
  eliminarSorteoBatch(grupo: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará permanentemente el lote de ${grupo.modalidad} del ${grupo.fecha_formateada}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamamos al servidor usando la fecha como identificador
        const url = `http://localhost:3000/api/asignaciones/lote?fecha=${encodeURIComponent(grupo.fecha_formateada)}`;
        
        this.http.delete(url).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El lote ha sido eliminado.', 'success');
            this.cargarDatos(); // Recargamos la tabla automáticamente
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo eliminar el lote.', 'error');
            console.error(err);
          }
        });
      }
    });
  }
}