import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoService, Periodo } from '../../services/periodo';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodos.html',
  styleUrl: './periodos.css'
})
export class PeriodosComponent implements OnInit {
  periodosLista: Periodo[] = [];
  mostrarModal: boolean = false;
  editandoId: number | null = null; 
  
  nuevoPeriodo: Periodo = { nombre: '', activo: 1 };

  constructor(private periodoService: PeriodoService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargarPeriodos(); }

  cargarPeriodos() {
    this.periodoService.getPeriodos().subscribe({
      next: (datos) => { this.periodosLista = datos; this.cdr.detectChanges(); },
      error: () => Swal.fire('Error', 'No se pudo cargar la lista', 'error')
    });
  }

  eliminarPeriodo(id: number | undefined) {
    if (!id) return;
    Swal.fire({
      title: '¿Desactivar Período?', 
      text: "El período ya no aparecerá en los nuevos sorteos, pero se conservará en el historial.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#CC0000', cancelButtonColor: '#555',
      confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.periodoService.eliminarPeriodo(id).subscribe({
          next: () => { this.cargarPeriodos(); Swal.fire('¡Desactivado!', 'El período ha sido ocultado.', 'success'); },
          error: () => Swal.fire('Error', 'Hubo un error al desactivar', 'error')
        });
      }
    });
  }

  abrirFormulario() {
    this.editandoId = null;
    this.nuevoPeriodo = { nombre: '', activo: 1 };
    this.mostrarModal = true;
  }

  editarPeriodo(periodo: Periodo) {
    this.editandoId = periodo.id!;
    this.nuevoPeriodo = { ...periodo };
    this.mostrarModal = true;
  }

  cerrarFormulario() {
    this.mostrarModal = false;
    this.editandoId = null;
    this.nuevoPeriodo = { nombre: '', activo: 1 };
  }

  guardarPeriodo() {
    if (!this.nuevoPeriodo.nombre) {
      Swal.fire('Atención', 'El nombre es obligatorio.', 'warning');
      return;
    }

    if (this.editandoId) {
      this.periodoService.actualizarPeriodo(this.editandoId, this.nuevoPeriodo).subscribe({
        next: () => { Swal.fire('¡Actualizado!', 'Datos guardados.', 'success'); this.cerrarFormulario(); this.cargarPeriodos(); },
        error: (err) => Swal.fire('Error', err.error?.error || 'Error al actualizar', 'error')
      });
    } else {
      this.periodoService.agregarPeriodo(this.nuevoPeriodo).subscribe({
        next: () => { Swal.fire('¡Éxito!', 'Período guardado', 'success'); this.cerrarFormulario(); this.cargarPeriodos(); },
        error: (err) => Swal.fire('Error', err.error?.error || 'Error de conexión', 'error')
      });
    }
  }
}