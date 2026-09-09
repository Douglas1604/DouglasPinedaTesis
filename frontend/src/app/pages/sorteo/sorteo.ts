/**
 * @fileoverview Lógica principal del motor de sorteos y asignaciones académicas.
 * Maneja la lectura de archivos Excel, el cálculo matemático para la distribución 
 * equitativa de alumnos y la animación visual de las ruletas.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule, HttpClient } from '@angular/common/http'; 
import { AsignacionService } from '../../services/asignacion'; 
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export interface Profesor { id?: number; nombre_completo: string; area?: string; }
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
  tiposEvento: any[] = [
    { id: 1, nombre: 'Examen Privado', descripcion: 'Evaluación por Áreas' },
    { id: 2, nombre: 'Seminario', descripcion: 'Asignación General' },
    { id: 3, nombre: 'Tesis', descripcion: 'Terna Evaluadora' }
  ];
  eventoSeleccionado: any = null;

  coloresRuleta: string[] = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
  nombreArchivoProfesores: string = ''; 
  nombreArchivoAlumnos: string = '';

  // =========================================================
  // Metodo 1: PRIVADOS Y SEMINARIO
  // =========================================================
  areaSeleccionada: string = '';
  areasDisponibles: string[] = ['Análisis, Diseño y Desarrollo', 'Administración de Sistemas', 'Ciencias de la Ingeniería'];
  contadoresAreas: { [key: string]: number } = {};

  profesoresBaseNormal: Profesor[] = []; 
  profesoresNormal: Profesor[] = []; 
  alumnosNormal: Alumno[] = [];
  
  cupoBaseNormal: number = 0; 
  sobrantesNormal: number = 0;

  gradosRotacionNormalProfe: number = 0; 
  girandoNormalProfe: boolean = false;
  catedraticoGanadorNormal: Profesor | null = null; 
  cupoActualNormal: number = 0; 
  alumnosAsignadosNormal: Alumno[] = [];   
  
  gradosRotacionNormalAlum: number = 0; 
  girandoNormalAlum: boolean = false;
  alumnoGanadorTemporalNormal: Alumno | null = null; 

  // =========================================================
  // Metodo 2: TESIS
  // =========================================================
  profesoresTesis: Profesor[] = []; 
  alumnosTesis: Alumno[] = []; 
  
  catedraticosTesisAsignados: Profesor[] = []; 
  alumnosTesisAsignados: Alumno[] = []; 
  
  cantidadTernasTesis: number = 0;
  cupoBaseTesis: number = 0; 
  sobrantesTesis: number = 0;
  cupoActualTesis: number = 0;
  matematicaTesisCalculada: boolean = false; 

  gradosRotacionTesisProfe: number = 0; 
  girandoTesisProfe: boolean = false;
  gradosRotacionTesisAlum: number = 0; 
  girandoTesisAlum: boolean = false;
  
  profesorGanadorTemporalTesis: Profesor | null = null;
  alumnoGanadorTemporalTesis: Alumno | null = null;

  constructor(private asignacionService: AsignacionService, private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/tipos-evento').subscribe({
      next: (data) => { 
        if (data && data.length > 0) {
          this.tiposEvento = data; 
        }
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.warn("No se pudo cargar desde la API, usando valores locales:", err);
        this.cdr.detectChanges();
      }
    });
  }

  confirmarConfiguracion() {
    if (!this.eventoSeleccionado) { 
      Swal.fire('Acción Requerida', 'Debes seleccionar la Modalidad.', 'warning'); 
      return; 
    }
    this.configuracionLista = true;
  }

  // =========================================================
  // GENERADOR DE PLANTILLAS EXCEL
  // =========================================================
  generarPlantilla(tipo: 'profesores' | 'alumnos') {
    let titulo = tipo === 'profesores' ? 'Plantilla de Catedráticos' : 'Plantilla de Alumnos';
    let instrucciones = tipo === 'profesores' 
      ? 'Escribe un nombre por línea (Ej: Ing ---\nIng ---\nIng ---)' 
      : 'Escribe Carnet y Nombre separados por una coma (Ej: xxx-xx-xxxx, A--- B---)';

    Swal.fire({
      title: titulo,
      input: 'textarea',
      inputLabel: instrucciones,
      inputPlaceholder: 'Ingresa los datos aquí...',
      inputAttributes: { 'aria-label': 'Ingresa los datos aquí' },
      showCancelButton: true,
      confirmButtonText: 'Generar Excel',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003366',
      width: '600px'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const lineas = result.value.split('\n').filter((l: string) => l.trim() !== '');
        let datosExportar: any[] = [];

        if (tipo === 'profesores') {
          datosExportar = lineas.map((nombre: string) => ({ 'Nombre Catedratico ': nombre.trim() }));
        } else {
          datosExportar = lineas.map((linea: string) => {
            const partes = linea.split(',');
            return {
              'Carnet': partes[0] ? partes[0].trim() : '',
              'Nombre Alumno': partes[1] ? partes[1].trim() : 'Desconocido'
            };
          });
        }

        const worksheet = XLSX.utils.json_to_sheet(datosExportar);
        const workbook = { Sheets: { 'Datos': worksheet }, SheetNames: ['Datos'] };
        XLSX.writeFile(workbook, `Plantilla_${tipo}.xlsx`);
        
        Swal.fire('¡Plantilla Generada!', `Sube el archivo Plantilla_${tipo}.xlsx en el botón de al lado.`, 'success');
      }
    });
  }

  leerExcel(evento: any, tipo: 'profesores' | 'alumnos') {
    const target: DataTransfer = <DataTransfer>(evento.target);
    if (target.files.length !== 1) return;
    const file = target.files[0]; 
    const fileName = file.name;

    if (tipo === 'profesores' && fileName === this.nombreArchivoAlumnos && fileName !== '') { Swal.fire('Error', 'Archivo duplicado.', 'error'); evento.target.value = ''; return; }
    if (tipo === 'alumnos' && fileName === this.nombreArchivoProfesores && fileName !== '') { Swal.fire('Error', 'Archivo duplicado.', 'error'); evento.target.value = ''; return; }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      const datosExcel = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      let datosUtiles = datosExcel.filter(fila => Array.isArray(fila) && fila.length > 0);
      
      if (datosUtiles.length > 0 && typeof datosUtiles[0][0] === 'string') {
        const posibleTitulo = String(datosUtiles[0][0]).toLowerCase();
        if (posibleTitulo.includes('nombre') || posibleTitulo.includes('carnet') || posibleTitulo.includes('catedratico') || posibleTitulo.includes('area') || posibleTitulo.includes('área')) {
          datosUtiles = datosUtiles.slice(1); 
        }
      }

      if (tipo === 'profesores') {
        this.nombreArchivoProfesores = fileName;
        const profesMapeados = datosUtiles
          .filter(fila => fila[0] !== undefined && fila[0] !== null && String(fila[0]).trim() !== '')
          .map((fila, index) => ({ id: index + 1, nombre_completo: String(fila[0]).trim(), area: '' }));
        
        if (this.eventoSeleccionado?.id === 3) {
          this.matematicaTesisCalculada = false;
          this.profesoresTesis = [...profesMapeados];
          Swal.fire('Éxito', `${this.profesoresTesis.length} catedráticos cargados para Tesis.`, 'success');
          this.calcularMatematicaTesis();
        } else {
          this.contadoresAreas = {}; 
          this.profesoresBaseNormal = [...profesMapeados];
          if (this.eventoSeleccionado?.id === 1) {
            this.profesoresNormal = [...this.profesoresBaseNormal]; 
            this.areaSeleccionada = '';
            Swal.fire('Excel Cargado', `Detectados ${this.profesoresBaseNormal.length} catedráticos. Selecciona un Área.`, 'info');
          } else {
            let numerosDisponibles = Array.from({length: this.profesoresBaseNormal.length}, (_, i) => i + 1);
            for (let i = numerosDisponibles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numerosDisponibles[i], numerosDisponibles[j]] = [numerosDisponibles[j], numerosDisponibles[i]];
            }
            this.profesoresNormal = this.profesoresBaseNormal.map((p, index) => ({ ...p, id: numerosDisponibles[index] }));
            this.areaSeleccionada = 'Seminario'; 
            Swal.fire('Éxito', `${this.profesoresNormal.length} catedráticos cargados para Seminario.`, 'success');
          }
          this.calcularMatematicaNormal();
        }

      } else if (tipo === 'alumnos') {
        this.nombreArchivoAlumnos = fileName;
        const alumnosMapeados = datosUtiles
          .filter(fila => fila[0] !== undefined && fila[0] !== null && String(fila[0]).trim() !== '')
          .map((fila, index) => ({ 
            id: index + 1, 
            carnet: String(fila[0]).trim(), 
            nombre_completo: (fila[1] !== undefined && fila[1] !== null) ? String(fila[1]).trim() : 'Desconocido' 
          }));
        
        if (this.eventoSeleccionado?.id === 3) {
          this.alumnosTesis = [...alumnosMapeados];
          Swal.fire('Éxito', `${this.alumnosTesis.length} alumnos cargados para Tesis.`, 'success');
          this.calcularMatematicaTesis();
        } else {
          this.alumnosNormal = [...alumnosMapeados];
          Swal.fire('Éxito', `${this.alumnosNormal.length} alumnos cargados.`, 'success');
          this.calcularMatematicaNormal();
        }
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  obtenerNombreCorto(nombre: string): string {
    if (!nombre) return '';
    return nombre.trim();
  }
  
  obtenerNombreAlumnoCorto(alu: Alumno): string {
    if (!alu) return '';
    const primerNombre = alu.nombre_completo.trim().split(' ')[0] || '';
    const partesCarnet = (alu.carnet || '').trim().split('-');
    const numeroFinal = partesCarnet.length > 1 ? partesCarnet[partesCarnet.length - 1].trim() : (alu.carnet || '').trim();
    return `${primerNombre} - ${numeroFinal}`;
  }
  
  obtenerNombreAlumnoLista(alu: Alumno): string {
    if (!alu) return '';
    const partes = alu.nombre_completo.trim().split(' ').filter(p => p.length > 0);
    const primerNombre = partes[0] || '';
    const primerApellido = partes.length > 2 ? partes[2] : (partes[1] || '');
    return `${primerNombre} ${primerApellido} - ${alu.carnet.trim()}`;
  }
  
  obtenerTransformTexto(index: number, total: number): string {
    const angulo = 360 / total; const medio = (index * angulo) + (angulo / 2);
    return `translate(-50%, -50%) rotate(${medio}deg) translateY(-110px) rotate(90deg)`;
  }
  
  obtenerFondoRuleta(lista: any[]): string {
    if(!lista || lista.length === 0) return '#e2e8f0';
    let gradiente = 'conic-gradient('; const angulo = 360 / lista.length;
    lista.forEach((_, i) => { gradiente += `${this.coloresRuleta[i % this.coloresRuleta.length]} ${angulo * i}deg ${angulo * (i + 1)}deg${i === lista.length - 1 ? '' : ', '}`; });
    return gradiente + ')';
  }

  calcularRotacionExacta(rotacionActual: number, totalElementos: number, indiceGanador: number): number {
    const angulo = 360 / totalElementos;
    const anguloCentroPorcion = (indiceGanador * angulo) + (angulo / 2);
    const modObjetivo = (360 - anguloCentroPorcion) % 360;
    const vueltasBase = (Math.floor(Math.random() * 4) + 5) * 360;
    let diferencia = modObjetivo - (rotacionActual % 360);
    if (diferencia < 0) diferencia += 360; 
    return rotacionActual + vueltasBase + diferencia;
  }

  // =========================================================
  // METODO NORMAL
  // =========================================================
  seleccionarArea(area: string) {
    if (this.catedraticoGanadorNormal !== null) return; 
    if (!area) return;
    this.areaSeleccionada = area;
    this.profesoresNormal = [...this.profesoresBaseNormal];
    let numerosDisponibles = Array.from({length: this.profesoresNormal.length}, (_, i) => i + 1);
    for (let i = numerosDisponibles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numerosDisponibles[i], numerosDisponibles[j]] = [numerosDisponibles[j], numerosDisponibles[i]];
    }
    this.profesoresNormal = this.profesoresNormal.map((p, index) => ({ ...p, id: numerosDisponibles[index] }));
    this.calcularMatematicaNormal();
  }

  calcularMatematicaNormal() {
    if (this.profesoresNormal.length > 0 && this.alumnosNormal.length > 0) {
      this.cupoBaseNormal = Math.floor(this.alumnosNormal.length / this.profesoresNormal.length);
      this.sobrantesNormal = this.alumnosNormal.length % this.profesoresNormal.length;
    } else {
      this.cupoBaseNormal = 0; this.sobrantesNormal = 0;
    }
    this.cdr.detectChanges(); 
  }

  iniciarSorteoCatedraticosNormal() {
    if (this.alumnosNormal.length === 0) { Swal.fire('¡Sorteo Finalizado!', 'Ya no hay alumnos disponibles.', 'info'); return; }
    if (this.eventoSeleccionado?.id === 1 && this.areaSeleccionada === '') { Swal.fire('Atención', 'Selecciona el área.', 'warning'); return; }
    if (this.catedraticoGanadorNormal) { Swal.fire('Atención', 'Ya seleccionado.', 'warning'); return; }
    if (this.girandoNormalProfe || this.profesoresNormal.length === 0) return;
    
    this.girandoNormalProfe = true; 
    this.catedraticoGanadorNormal = null; 
    this.alumnosAsignadosNormal = [];
    
    const indice = Math.floor(Math.random() * this.profesoresNormal.length);
    this.gradosRotacionNormalProfe = this.calcularRotacionExacta(this.gradosRotacionNormalProfe, this.profesoresNormal.length, indice);
    
    setTimeout(() => {
      this.girandoNormalProfe = false;
      const profeGanador = this.profesoresNormal[indice];
      const clave = this.areaSeleccionada || 'General';
      const numeroGrupoOrdenado = (this.contadoresAreas[clave] || 0) + 1;
      profeGanador.id = numeroGrupoOrdenado; 

      this.catedraticoGanadorNormal = profeGanador;
      this.cupoActualNormal = this.cupoBaseNormal + (this.sobrantesNormal > 0 ? 1 : 0);
      
      let mensaje = `Se le ha asignado la Terna #${numeroGrupoOrdenado} a ${this.catedraticoGanadorNormal.nombre_completo}.`;
      if (this.eventoSeleccionado?.id === 1 && this.areaSeleccionada !== '') {
        mensaje = `${this.catedraticoGanadorNormal.nombre_completo} se asignó al grupo ${numeroGrupoOrdenado} de ${this.areaSeleccionada}.`;
      }
      Swal.fire('¡Catedrático Seleccionado!', mensaje, 'success');
      this.cdr.detectChanges();
    }, 4000); 
  }

  iniciarSorteoAlumnosNormal() {
    if (this.alumnoGanadorTemporalNormal) {
      const idx = this.alumnosNormal.findIndex(a => a.id === this.alumnoGanadorTemporalNormal!.id);
      if (idx !== -1) this.alumnosNormal.splice(idx, 1);
      this.alumnoGanadorTemporalNormal = null;
    }
    
    if (this.girandoNormalAlum || this.alumnosNormal.length === 0 || this.alumnosAsignadosNormal.length >= this.cupoActualNormal) return;
    this.girandoNormalAlum = true;
    
    const indice = Math.floor(Math.random() * this.alumnosNormal.length);
    this.gradosRotacionNormalAlum = this.calcularRotacionExacta(this.gradosRotacionNormalAlum, this.alumnosNormal.length, indice);
    
    setTimeout(() => {
      this.girandoNormalAlum = false;
      const ganador = this.alumnosNormal[indice];
      this.alumnosAsignadosNormal.push(ganador);
      this.alumnoGanadorTemporalNormal = ganador;
      
      Swal.fire({ title: 'Alumno Asignado', text: `${ganador.nombre_completo} fue removido de la ruleta.`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

      if (this.alumnosAsignadosNormal.length >= this.cupoActualNormal) { 
        if (this.sobrantesNormal > 0) this.sobrantesNormal--; 
        setTimeout(() => Swal.fire('¡Cupo Lleno!', `La terna ha sido completada.`, 'info'), 600);
      }
      this.cdr.detectChanges();
    }, 4000); 
  }

  guardarTernaNormal() {
    if (!this.catedraticoGanadorNormal) return;
    
    if (this.alumnoGanadorTemporalNormal) {
      const idx = this.alumnosNormal.findIndex(a => a.id === this.alumnoGanadorTemporalNormal!.id);
      if (idx !== -1) this.alumnosNormal.splice(idx, 1);
      this.alumnoGanadorTemporalNormal = null;
    }

    let nombreFinal = this.catedraticoGanadorNormal.nombre_completo;
    if (this.eventoSeleccionado?.id === 1 && this.areaSeleccionada !== '') { 
      nombreFinal = `Grupo ${this.catedraticoGanadorNormal.id} de ${this.areaSeleccionada} - ${nombreFinal}`; 
    } else {
      nombreFinal = `Terna #${this.catedraticoGanadorNormal.id} - ${nombreFinal}`;
    }

    this.asignacionService.guardarTerna(nombreFinal, this.alumnosAsignadosNormal, this.eventoSeleccionado.id).subscribe({
      next: () => {
        Swal.fire('¡Guardado!', 'Asignación registrada correctamente.', 'success');
        const clave = this.areaSeleccionada || 'General';
        this.contadoresAreas[clave] = (this.contadoresAreas[clave] || 0) + 1;

        this.profesoresNormal = this.profesoresNormal.filter(p => p.nombre_completo !== this.catedraticoGanadorNormal?.nombre_completo);
        if (this.eventoSeleccionado?.id === 1) {
          this.profesoresBaseNormal = this.profesoresBaseNormal.filter(p => p.nombre_completo !== this.catedraticoGanadorNormal?.nombre_completo);
        }

        this.catedraticoGanadorNormal = null; 
        this.alumnosAsignadosNormal = []; 
        if (this.eventoSeleccionado?.id === 1) { this.areaSeleccionada = ''; }
        
        this.calcularMatematicaNormal();
        if (this.profesoresNormal.length === 0 || this.alumnosNormal.length === 0) Swal.fire('¡Finalizado!', 'Proceso concluido.', 'success');
      }
    });
  }

  // =========================================================
  // METODO TESIS
  // =========================================================
  calcularMatematicaTesis() {
    if (!this.matematicaTesisCalculada && this.profesoresTesis.length > 0 && this.alumnosTesis.length > 0) {
      this.cantidadTernasTesis = Math.ceil(this.profesoresTesis.length / 3);
      if (this.cantidadTernasTesis === 0) this.cantidadTernasTesis = 1;
      this.cupoBaseTesis = Math.floor(this.alumnosTesis.length / this.cantidadTernasTesis);
      this.sobrantesTesis = this.alumnosTesis.length % this.cantidadTernasTesis;
      this.matematicaTesisCalculada = true; 
    }
    this.cdr.detectChanges();
  }

  iniciarSorteoTesisCatedratico() {
    if (this.profesorGanadorTemporalTesis) {
      const idx = this.profesoresTesis.findIndex(p => p.id === this.profesorGanadorTemporalTesis!.id);
      if (idx !== -1) this.profesoresTesis.splice(idx, 1);
      this.profesorGanadorTemporalTesis = null;
    }

    if (this.alumnosTesis.length === 0) { 
      Swal.fire('¡Sorteo Finalizado!', 'Ya no hay alumnos disponibles para conformar más jurados.', 'info'); 
      return; 
    }
    
    if (this.girandoTesisProfe || this.catedraticosTesisAsignados.length >= 3 || this.profesoresTesis.length === 0) return;
    
    this.girandoTesisProfe = true;
    
    const indice = Math.floor(Math.random() * this.profesoresTesis.length);
    this.gradosRotacionTesisProfe = this.calcularRotacionExacta(this.gradosRotacionTesisProfe, this.profesoresTesis.length, indice);

    setTimeout(() => {
      this.girandoTesisProfe = false;
      const ganador = this.profesoresTesis[indice];
      this.catedraticosTesisAsignados.push(ganador);
      this.profesorGanadorTemporalTesis = ganador;
      
      const roles = ['Presidente', 'Vocal 1', 'Vocal 2'];
      const rolAsignado = roles[this.catedraticosTesisAsignados.length - 1];

      if (this.catedraticosTesisAsignados.length < 3) {
        Swal.fire({
          title: `¡${rolAsignado} Seleccionado!`,
          html: `<h2 style="color: #003366; margin: 15px 0;">${ganador.nombre_completo}</h2>
                 <p style="color: #555; font-size: 1.05rem;">Se ha integrado con éxito al jurado examinador (${this.catedraticosTesisAsignados.length}/3).</p>`,
          icon: 'success',
          confirmButtonColor: '#003366',
          confirmButtonText: 'Continuar Sorteo'
        });
      } else {
        this.cupoActualTesis = this.cupoBaseTesis + (this.sobrantesTesis > 0 ? 1 : 0);
        Swal.fire({
          title: `¡${rolAsignado} Seleccionado!`,
          html: `<h2 style="color: #003366; margin: 15px 0;">${ganador.nombre_completo}</h2>
                 <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
                 <h3 style="color: #10b981; margin-bottom: 8px;"><i class="fas fa-check-circle"></i> ¡Terna Completada!</h3>
                 <p style="color: #444; font-size: 1.05rem;">Se han asignado los 3 catedráticos requeridos.</p>
                 <p style="color: #666; margin-top: 5px;">Procede a sortear individualmente a los <strong>${this.cupoActualTesis}</strong> alumnos asignados a este jurado.</p>`,
          icon: 'success',
          confirmButtonColor: '#003366',
          confirmButtonText: 'Comenzar Asignación de Alumnos'
        });
      }
      this.cdr.detectChanges();
    }, 4000);
  }

  iniciarSorteoTesisAlumnoIndividual() {
    if (this.alumnoGanadorTemporalTesis) {
      const idx = this.alumnosTesis.findIndex(a => a.id === this.alumnoGanadorTemporalTesis!.id);
      if (idx !== -1) this.alumnosTesis.splice(idx, 1);
      this.alumnoGanadorTemporalTesis = null;
    }

    if (this.catedraticosTesisAsignados.length < 3) { Swal.fire('Atención', 'Debes conformar el jurado de 3 catedráticos primero.', 'warning'); return; }
    if (this.girandoTesisAlum || this.alumnosTesisAsignados.length >= this.cupoActualTesis || this.alumnosTesis.length === 0) return;
    
    this.girandoTesisAlum = true;
    const indice = Math.floor(Math.random() * this.alumnosTesis.length);
    this.gradosRotacionTesisAlum = this.calcularRotacionExacta(this.gradosRotacionTesisAlum, this.alumnosTesis.length, indice);

    setTimeout(() => {
      this.girandoTesisAlum = false;
      const ganador = this.alumnosTesis[indice];
      
      this.alumnosTesisAsignados.push(ganador);
      this.alumnoGanadorTemporalTesis = ganador;
      
      const totalAsignados = this.alumnosTesisAsignados.length;
      const esUltimo = totalAsignados >= this.cupoActualTesis;

      if (!esUltimo) {
        Swal.fire({
          title: '¡Alumno Seleccionado!',
          html: `<h2 style="color: #CC0000; margin: 12px 0;">${ganador.nombre_completo}</h2>
                 <p style="font-size: 1.15rem; color: #333; margin-bottom: 5px;">Carnet: <strong>${ganador.carnet}</strong></p>
                 <p style="font-size: 0.95rem; color: #666;">Alumno ${totalAsignados} de ${this.cupoActualTesis} asignados a esta terna.</p>`,
          icon: 'success',
          confirmButtonColor: '#CC0000',
          confirmButtonText: 'Continuar Sorteo'
        });
      } else {
        Swal.fire({
          title: '¡Alumno Seleccionado!',
          html: `<h2 style="color: #CC0000; margin: 12px 0;">${ganador.nombre_completo}</h2>
                 <p style="font-size: 1.15rem; color: #333; margin-bottom: 5px;">Carnet: <strong>${ganador.carnet}</strong></p>
                 <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
                 <h3 style="color: #003366; margin-bottom: 8px;"><i class="fas fa-users"></i> ¡Grupo Completo (${totalAsignados}/${this.cupoActualTesis})!</h3>
                 <p style="color: #555; font-size: 1rem;">Se ha completado el cupo de alumnos para esta terna. Ya puedes registrarla oficialmente.</p>`,
          icon: 'success',
          confirmButtonColor: '#003366',
          confirmButtonText: 'Listo para Guardar'
        });
      }
      this.cdr.detectChanges();
    }, 4000); 
  }

  guardarTesisOficial() {
    if (this.alumnosTesisAsignados.length === 0 || this.catedraticosTesisAsignados.length < 3) return;
    
    if (this.profesorGanadorTemporalTesis) {
      const idx = this.profesoresTesis.findIndex(p => p.id === this.profesorGanadorTemporalTesis!.id);
      if (idx !== -1) this.profesoresTesis.splice(idx, 1);
      this.profesorGanadorTemporalTesis = null;
    }

    if (this.alumnoGanadorTemporalTesis) {
      const idx = this.alumnosTesis.findIndex(a => a.id === this.alumnoGanadorTemporalTesis!.id);
      if (idx !== -1) this.alumnosTesis.splice(idx, 1);
      this.alumnoGanadorTemporalTesis = null;
    }

    let guardados = 0;
    const totalAGuardar = this.alumnosTesisAsignados.length;

    this.alumnosTesisAsignados.forEach(alu => {
      this.asignacionService.guardarTesis(alu, this.catedraticosTesisAsignados, this.eventoSeleccionado.id).subscribe({
        next: () => {
          guardados++;
          if (guardados === totalAGuardar) {
            Swal.fire('¡Guardado!', 'El jurado y su grupo de alumnos han sido registrados correctamente.', 'success');
            if (this.sobrantesTesis > 0) this.sobrantesTesis--;
            this.alumnosTesisAsignados = []; 
            this.catedraticosTesisAsignados = []; 
            this.calcularMatematicaTesis(); 
            if (this.alumnosTesis.length === 0) { Swal.fire('¡Finalizado!', 'Todos los tesistas han sido asignados.', 'success'); }
          }
        },
        error: () => {
          guardados++;
          if (guardados === totalAGuardar) { Swal.fire('¡Aviso!', 'Se completó el proceso, revisa el reporte.', 'info'); }
        }
      });
    });
  }
}