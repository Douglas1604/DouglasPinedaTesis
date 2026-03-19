import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; 
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
  asignaciones: any[] = [];

  constructor(
    private asignacionService: AsignacionService,
    private cdr: ChangeDetectorRef // <-- EL DESPERTADOR
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.asignacionService.obtenerAsignaciones().subscribe({
      next: (data) => {
        this.asignaciones = data;
        
        // MAGIA: Pintamos la tabla instantáneamente
        this.cdr.detectChanges(); 
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los reportes.', 'error')
    });
  }

  exportarAExcel() {
    if (this.asignaciones.length === 0) {
      Swal.fire('Vacío', 'No hay datos para exportar.', 'info');
      return;
    }

    const datosExportar = this.asignaciones.map(a => ({
      'Período Académico': a.periodo,
      'Modalidad': a.modalidad,
      'Catedrático / Jurado': a.profesor_nombre,
      'Carnet del Alumno': a.alumno_carnet,
      'Nombre del Alumno': a.alumno_nombre,
      'Fecha de Sorteo': a.fecha_formateada
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook: XLSX.WorkBook = { Sheets: { 'Ternas Oficiales': worksheet }, SheetNames: ['Ternas Oficiales'] };
    
    XLSX.writeFile(workbook, 'Reporte_Sorteos_UMG.xlsx');
  }
}