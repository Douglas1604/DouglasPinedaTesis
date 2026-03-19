import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule, HttpClient } from '@angular/common/http'; 
import { AsignacionService } from '../../services/asignacion'; 
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export interface Profesor { id?: number; nombre_completo: string; }
export interface Alumno { id?: number; carnet: string; nombre_completo: string; }

@Component({
  selector: 'app-sorteo',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], 
  templateUrl: './sorteo.html',
  styleUrl: './sorteo.css'
})
export class SorteoComponent implements OnInit {
  configuracionLista: boolean = false;
  periodosActivos: any[] = [];
  tiposEvento: any[] = [];
  periodoSeleccionado: number | null = null;
  eventoSeleccionado: any = null;

  profesoresLista: Profesor[] = [];
  alumnosDisponibles: Alumno[] = [];
  totalProfesores: number = 0; totalAlumnos: number = 0;
  cupoBase: number = 0; sobrantes: number = 0;
  coloresRuleta: string[] = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
  
  // VARIABLES MODO NORMAL
  gradosRotacion: number = 0; girando: boolean = false;
  catedraticoGanador: Profesor | null = null; cupoActual: number = 0; 
  alumnosAsignados: Alumno[] = [];   
  gradosRotacionAlumnos: number = 0; girandoAlumnos: boolean = false;
  alumnoGanadorTemporal: Alumno | null = null; 

  // VARIABLES MODO TESIS (INVERTIDO)
  alumnoTesisGanador: Alumno | null = null;
  profesoresPoolTesis: Profesor[] = []; // Los catedráticos que están en la ruleta para este alumno
  catedraticosTesisAsignados: Profesor[] = []; // La Terna (máx 3)
  profesorTesisTemporal: Profesor | null = null;

  constructor(private asignacionService: AsignacionService, private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/periodos').subscribe(data => this.periodosActivos = data.filter(p => p.activo === 1));
    this.http.get<any[]>('http://localhost:3000/api/tipos-evento').subscribe(data => this.tiposEvento = data);
  }

  confirmarConfiguracion() {
    if (!this.periodoSeleccionado || !this.eventoSeleccionado) {
      Swal.fire('Acción Requerida', 'Debes seleccionar el Período y la Modalidad.', 'warning'); return;
    }
    this.configuracionLista = true;
  }

  leerExcel(evento: any, tipo: 'profesores' | 'alumnos') {
    const target: DataTransfer = <DataTransfer>(evento.target);
    if (target.files.length !== 1) return;
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const datosUtiles = datosExcel.filter((fila: any) => fila.length > 0).slice(1); 

      if (tipo === 'profesores') {
        this.profesoresLista = datosUtiles.map((fila: any, index: number) => ({ id: index + 1, nombre_completo: fila[0] }));
        Swal.fire('Éxito', `${this.profesoresLista.length} catedráticos cargados.`, 'success');
      } else if (tipo === 'alumnos') {
        this.alumnosDisponibles = datosUtiles.map((fila: any, index: number) => ({ id: index + 1, carnet: fila[0], nombre_completo: fila[1] }));
        Swal.fire('Éxito', `${this.alumnosDisponibles.length} alumnos cargados.`, 'success');
      }
      this.calcularMatematica();
    };
    reader.readAsBinaryString(target.files[0]);
  }

  calcularMatematica() {
    this.totalProfesores = this.profesoresLista.length; this.totalAlumnos = this.alumnosDisponibles.length;
    if (this.totalProfesores > 0 && this.totalAlumnos > 0) {
      this.cupoBase = Math.floor(this.totalAlumnos / this.totalProfesores);
      this.sobrantes = this.totalAlumnos % this.totalProfesores;
    }
    this.cdr.detectChanges(); 
  }

  obtenerTransformTexto(index: number, total: number): string {
    const angulo = 360 / total; const medio = (index * angulo) + (angulo / 2);
    return `translate(-50%, -50%) rotate(${medio}deg) translateY(-110px) rotate(90deg)`;
  }

// --- FUNCIÓN CORREGIDA PARA ACEPTAR EL PARÁMETRO DE LA LISTA ---
  obtenerFondoRuleta(lista: any[]): string {
    if(!lista || lista.length === 0) return '#e2e8f0';
    let gradiente = 'conic-gradient(';
    const angulo = 360 / lista.length;
    lista.forEach((_, i) => {
      const color = this.coloresRuleta[i % this.coloresRuleta.length];
      gradiente += `${color} ${angulo * i}deg ${angulo * (i + 1)}deg${i === lista.length - 1 ? '' : ', '}`;
    });
    return gradiente + ')';
  }

  // ==========================================
  // LÓGICA MODO NORMAL (PRIVADOS Y SEMINARIO)
  // ==========================================
  iniciarSorteoCatedraticos() {
    if (this.catedraticoGanador) { Swal.fire('Atención', 'Ya tienes un catedrático seleccionado.', 'warning'); return; }
    if (this.girando || this.totalProfesores === 0) return;
    this.girando = true; this.catedraticoGanador = null; this.alumnosAsignados = [];
    this.gradosRotacion += (Math.floor(Math.random() * 4) + 5) * 360 + Math.floor(Math.random() * 360);
    setTimeout(() => {
      this.girando = false;
      const indice = Math.floor(((360 - (this.gradosRotacion % 360)) % 360) / (360 / this.totalProfesores));
      this.catedraticoGanador = this.profesoresLista[indice];
      this.cupoActual = this.cupoBase + (this.sobrantes > 0 ? 1 : 0);
      Swal.fire('¡Catedrático Seleccionado!', `Número: #${this.catedraticoGanador.id}`, 'success');
      this.cdr.detectChanges();
    }, 4000); 
  }

  iniciarSorteoAlumnos() {
    if (this.alumnoGanadorTemporal) {
      const idx = this.alumnosDisponibles.findIndex(a => a.id === this.alumnoGanadorTemporal!.id);
      if (idx !== -1) this.alumnosDisponibles.splice(idx, 1);
      this.alumnoGanadorTemporal = null;
    }
    if (this.girandoAlumnos || this.alumnosDisponibles.length === 0 || this.alumnosAsignados.length >= this.cupoActual) return;
    this.girandoAlumnos = true;
    this.gradosRotacionAlumnos += (Math.floor(Math.random() * 4) + 5) * 360 + Math.floor(Math.random() * 360);
    setTimeout(() => {
      this.girandoAlumnos = false;
      const indice = Math.floor(((360 - (this.gradosRotacionAlumnos % 360)) % 360) / (360 / this.alumnosDisponibles.length));
      const ganador = this.alumnosDisponibles[indice];
      this.alumnosAsignados.push(ganador);
      this.alumnoGanadorTemporal = ganador;
      if (this.alumnosAsignados.length >= this.cupoActual) { if (this.sobrantes > 0) this.sobrantes--; Swal.fire('¡Cupo Lleno!', `Terna completada.`, 'info'); }
      this.cdr.detectChanges();
    }, 4000);
  }

  guardarTernaOficial() {
    if (!this.catedraticoGanador) return;
    if (this.alumnoGanadorTemporal) {
      const idx = this.alumnosDisponibles.findIndex(a => a.id === this.alumnoGanadorTemporal!.id);
      if (idx !== -1) this.alumnosDisponibles.splice(idx, 1);
      this.alumnoGanadorTemporal = null;
    }
    this.asignacionService.guardarTerna(this.catedraticoGanador.nombre_completo, this.alumnosAsignados, this.eventoSeleccionado.id, this.periodoSeleccionado!).subscribe({
      next: () => {
        Swal.fire('¡Guardado!', 'Asignación registrada.', 'success');
        this.profesoresLista = this.profesoresLista.filter(p => p.id !== this.catedraticoGanador?.id);
        this.catedraticoGanador = null; this.alumnosAsignados = []; this.calcularMatematica();
        if (this.profesoresLista.length === 0) Swal.fire('¡Finalizado!', 'Todos asignados.', 'success');
      }
    });
  }

  // ==========================================
  // LÓGICA MODO TESIS (1 ALUMNO -> 3 PROFESORES)
  // ==========================================
  iniciarSorteoTesisAlumno() {
    if (this.alumnoTesisGanador) { Swal.fire('Atención', 'Ya hay un alumno esperando su terna.', 'warning'); return; }
    if (this.girando || this.alumnosDisponibles.length === 0) return;
    this.girando = true; this.alumnoTesisGanador = null;
    this.gradosRotacion += (Math.floor(Math.random() * 4) + 5) * 360 + Math.floor(Math.random() * 360);
    setTimeout(() => {
      this.girando = false;
      const indice = Math.floor(((360 - (this.gradosRotacion % 360)) % 360) / (360 / this.alumnosDisponibles.length));
      this.alumnoTesisGanador = this.alumnosDisponibles[indice];
      
      // Lo sacamos de la lista para que no vuelva a salir otro día
      this.alumnosDisponibles.splice(indice, 1);
      
      // Llenamos el pool de profesores para girarlos (todos disponibles para él)
      this.profesoresPoolTesis = [...this.profesoresLista];
      this.catedraticosTesisAsignados = [];
      this.profesorTesisTemporal = null;

      Swal.fire('¡Tesista Seleccionado!', `${this.alumnoTesisGanador.nombre_completo}`, 'success');
      this.cdr.detectChanges();
    }, 4000); 
  }

  iniciarSorteoTesisCatedratico() {
    if (this.profesorTesisTemporal) {
      const idx = this.profesoresPoolTesis.findIndex(p => p.id === this.profesorTesisTemporal!.id);
      if (idx !== -1) this.profesoresPoolTesis.splice(idx, 1);
      this.profesorTesisTemporal = null;
    }
    if (this.girandoAlumnos || this.catedraticosTesisAsignados.length >= 3 || this.profesoresPoolTesis.length === 0) return;
    
    this.girandoAlumnos = true;
    this.gradosRotacionAlumnos += (Math.floor(Math.random() * 4) + 5) * 360 + Math.floor(Math.random() * 360);
    setTimeout(() => {
      this.girandoAlumnos = false;
      const indice = Math.floor(((360 - (this.gradosRotacionAlumnos % 360)) % 360) / (360 / this.profesoresPoolTesis.length));
      const ganador = this.profesoresPoolTesis[indice];
      this.catedraticosTesisAsignados.push(ganador);
      this.profesorTesisTemporal = ganador;
      
      if (this.catedraticosTesisAsignados.length >= 3) { Swal.fire('¡Terna Completa!', 'Se asignaron 3 catedráticos.', 'info'); }
      this.cdr.detectChanges();
    }, 4000);
  }

  guardarTesisOficial() {
    if (!this.alumnoTesisGanador || this.catedraticosTesisAsignados.length < 3) return;
    this.asignacionService.guardarTesis(this.alumnoTesisGanador, this.catedraticosTesisAsignados, this.eventoSeleccionado.id, this.periodoSeleccionado!).subscribe({
      next: () => {
        Swal.fire('¡Guardado!', 'Terna de Tesis registrada.', 'success');
        // Reseteamos todo. Los profesores VUELVEN a estar todos disponibles para el siguiente alumno!
        this.alumnoTesisGanador = null; this.catedraticosTesisAsignados = []; this.profesoresPoolTesis = [];
        this.calcularMatematica();
        if (this.alumnosDisponibles.length === 0) Swal.fire('¡Finalizado!', 'Todos los tesistas tienen terna.', 'success');
      }
    });
  }
}