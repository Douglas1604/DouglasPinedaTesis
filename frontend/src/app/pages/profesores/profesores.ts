import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Agregado ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfesorService, Profesor } from '../../services/profesor';
import Swal from 'sweetalert2'; // <-- 2. Importamos las alertas bonitas

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesores.html',
  styleUrl: './profesores.css'
})
export class ProfesoresComponent implements OnInit {
  profesoresLista: Profesor[] = [];
  mostrarModal: boolean = false;
  
  nuevoProfesor: Profesor = {
    nombre_completo: '',
    especialidad: '',
    max_carga: 10 
  };

  constructor(
    private profesorService: ProfesorService,
    private cdr: ChangeDetectorRef // <-- 3. Inyectamos el "despertador"
  ) {}

  ngOnInit() {
    this.cargarProfesores();
  }

  cargarProfesores() {
    this.profesorService.getProfesores().subscribe({
      next: (datos) => {
        this.profesoresLista = datos;
        this.cdr.detectChanges(); // <-- SOLUCIÓN: Angular repinta la tabla al instante
      },
      error: (err) => {
        console.error('Error al cargar la lista:', err);
        Swal.fire('Error', 'No se pudo cargar la lista de catedráticos', 'error');
      }
    });
  }

  eliminarProfesor(id: number | undefined) {
    if (!id) return;
    
    // Alerta de confirmación profesional
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#CC0000', // Rojo UMG
      cancelButtonColor: '#555',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.profesorService.eliminarProfesor(id).subscribe({
          next: () => {
            this.cargarProfesores();
            Swal.fire('¡Eliminado!', 'El catedrático ha sido borrado.', 'success');
          },
          error: (err) => Swal.fire('Error', 'Hubo un error al eliminar', 'error')
        });
      }
    });
  }

  abrirFormulario() {
    this.mostrarModal = true;
  }

  cerrarFormulario() {
    this.mostrarModal = false;
    this.nuevoProfesor = { nombre_completo: '', especialidad: '', max_carga: 10 };
  }

  guardarProfesor() {
    if (!this.nuevoProfesor.nombre_completo || !this.nuevoProfesor.especialidad) {
      Swal.fire('Atención', 'Por favor, llena los campos obligatorios.', 'warning');
      return;
    }

    this.profesorService.agregarProfesor(this.nuevoProfesor).subscribe({
      next: (respuesta) => {
        // Alerta de éxito profesional
        Swal.fire('¡Éxito!', 'Catedrático guardado exitosamente', 'success');
        this.cerrarFormulario();
        this.cargarProfesores();
      },
      error: (err) => {
        console.error(err);
        const mensajeError = err.error?.error || 'Error de conexión al guardar el catedrático';
        // Alerta de error profesional que lee lo que manda tu Node.js
        Swal.fire('Error', mensajeError, 'error');
      }
    });
  }
}