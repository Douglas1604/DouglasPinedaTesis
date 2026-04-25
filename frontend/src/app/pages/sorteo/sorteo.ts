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
  tiposEvento: any[] = [];
  eventoSeleccionado: any = null;

  coloresRuleta: string[] = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
  nombreArchivoProfesores: string = ''; nombreArchivoAlumnos: string = '';

  // =========================================================
  // ISLA 1: PRIVADOS Y SEMINARIO (Maneja Modalidades 1 y 2)
  // =========================================================
  areaSeleccionada: string = '';
  areasDisponibles: string[] = ['Análisis, Diseño y Desarrollo', 'Administración de Sistemas', 'Ciencias de la Ingeniería'];
  contadoresAreas: { [key: string]: number } = {};

  profesoresBaseNormal: Profesor[] = []; 
  profesoresNormal: Profesor[] = []; 
  alumnosNormal: Alumno[] = [];
  
  cupoBaseNormal: number = 0; sobrantesNormal: number = 0;

  gradosRotacionNormalProfe: number = 0; girandoNormalProfe: boolean = false;
  catedraticoGanadorNormal: Profesor | null = null; 
  cupoActualNormal: number = 0; 
  alumnosAsignadosNormal: Alumno[] = [];   
  
  gradosRotacionNormalAlum: number = 0; girandoNormalAlum: boolean = false;
  alumnoGanadorTemporalNormal: Alumno | null = null; 

  // =========================================================
  // ISLA 2: TESIS (Maneja Modalidad 3 EXCLUSIVAMENTE)
  // =========================================================
  profesoresTesis: Profesor[] = []; 
  alumnosTesis: Alumno[] = []; 
  
  catedraticosTesisAsignados: Profesor[] = []; 
  alumnosTesisAsignados: Alumno[] = []; 
  
  cantidadTernasTesis: number = 0;
  cupoBaseTesis: number = 0; sobrantesTesis: number = 0;
  cupoActualTesis: number = 0;
  matematicaTesisCalculada: boolean = false; 

  gradosRotacionTesisProfe: number = 0; girandoTesisProfe: boolean = false;
  gradosRotacionTesisAlum: number = 0; girandoTesisAlum: boolean = false;


  constructor(private asignacionService: AsignacionService, private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/tipos-evento').subscribe({
      next: (data) => {
        this.tiposEvento = data;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar modalidades:", err)
    });
  }

  confirmarConfiguracion() {
    if (!this.eventoSeleccionado) { Swal.fire('Acción Requerida', 'Debes seleccionar la Modalidad.', 'warning'); return; }
    this.configuracionLista = true;
  }

// --- LECTURA DE EXCEL ---
  leerExcel(evento: any, tipo: 'profesores' | 'alumnos') {
    const target: DataTransfer = <DataTransfer>(evento.target);
    if (target.files.length !== 1) return;
    const file = target.files[0]; const fileName = file.name;

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
        
        // --- FILTRO ANTI-UNDEFINED AGREGADO AQUÍ ---
        const profesMapeados = datosUtiles
          .filter(fila => fila[0] !== undefined && fila[0] !== null && String(fila[0]).trim() !== '')
          .map((fila, index) => ({ 
            id: index + 1, 
            nombre_completo: String(fila[0]).trim(), 
            area: '' // Ya no dependemos de que el Excel traiga un área
          }));
        
        if (this.eventoSeleccionado?.id === 3) {
          // ISLA TESIS
          this.matematicaTesisCalculada = false;
          this.profesoresTesis = [...profesMapeados];
          Swal.fire('Éxito', `${this.profesoresTesis.length} catedráticos cargados para Tesis.`, 'success');
          this.calcularMatematicaTesis();
        } else {
          // ISLA NORMAL (Privados y Seminario)
          this.contadoresAreas = {}; 
          this.profesoresBaseNormal = [...profesMapeados];
          
          if (this.eventoSeleccionado?.id === 1) {
            // Privados: Cargamos los profes a la ruleta para que aparezcan las áreas y el contador
            this.profesoresNormal = [...this.profesoresBaseNormal]; 
            this.areaSeleccionada = '';
            Swal.fire('Excel Cargado', `Detectados ${this.profesoresBaseNormal.length} catedráticos. Selecciona un Área.`, 'info');
          } else {
            // Seminario: Directo a la ruleta sin pedir área, asignando IDs revueltos
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
        
        // --- FILTRO ANTI-UNDEFINED AGREGADO AQUÍ ---
        const alumnosMapeados = datosUtiles
          .filter(fila => fila[0] !== undefined && fila[0] !== null && String(fila[0]).trim() !== '')
          .map((fila, index) => ({ 
            id: index + 1, 
            carnet: String(fila[0]).trim(), 
            nombre_completo: (fila[1] !== undefined && fila[1] !== null) ? String(fila[1]).trim() : 'Desconocido' 
          }));
        
        if (this.eventoSeleccionado?.id === 3) {
          // ISLA TESIS
          this.alumnosTesis = [...alumnosMapeados];
          Swal.fire('Éxito', `${this.alumnosTesis.length} alumnos cargados para Tesis.`, 'success');
          this.calcularMatematicaTesis();
        } else {
          // ISLA NORMAL
          this.alumnosNormal = [...alumnosMapeados];
          Swal.fire('Éxito', `${this.alumnosNormal.length} alumnos cargados.`, 'success');
          this.calcularMatematicaNormal();
        }
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  // --- FUNCIONES PURAS Y COMPARTIDAS (FORMATOS VISUALES) ---
  obtenerNombreCorto(nombre: string): string {
    if (!nombre) return '';
    return nombre.replace(/Ing\.|Lic\.|Arq\.|Dr\./g, '').trim().split(' ')[0];
  }
  obtenerNombreAlumnoCorto(alu: Alumno): string {
    if (!alu) return '';
    const primerNombre = alu.nombre_completo.trim().split(' ')[0] || '';
    const partesCarnet = alu.carnet.split('-');
    return `${primerNombre} - ${partesCarnet[partesCarnet.length - 1]?.trim() || ''}`;
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
  // LÓGICA EXCLUSIVA: Codigo (PRIVADOS Y SEMINARIO)
  // =========================================================
  seleccionarArea(area: string) {
    if (this.catedraticoGanadorNormal !== null) return; 
    if (!area) return;
    this.areaSeleccionada = area;
    
    // Todos los profesores restantes están disponibles (no se filtra por columna Excel)
    this.profesoresNormal = [...this.profesoresBaseNormal];

    // Revolvemos los IDs disponibles para darles un número de grupo al azar
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
    
    this.girandoNormalProfe = true; this.catedraticoGanadorNormal = null; this.alumnosAsignadosNormal = [];
    
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

        this.catedraticoGanadorNormal = null; this.alumnosAsignadosNormal = []; 
        if (this.eventoSeleccionado?.id === 1) { this.areaSeleccionada = ''; }
        
        this.calcularMatematicaNormal();
        if (this.profesoresNormal.length === 0 || this.alumnosNormal.length === 0) Swal.fire('¡Finalizado!', 'Proceso concluido.', 'success');
      }
    });
  }

  // =========================================================
  // LÓGICA EXCLUSIVA: ISLA TESIS (Modalidad 3)
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
    // 1. Verificamos si aún hay alumnos
    if (this.alumnosTesis.length === 0) { 
      Swal.fire('¡Sorteo Finalizado!', 'Ya no hay alumnos disponibles para conformar más jurados.', 'info'); 
      return; 
    }

    // 2. CREAMOS UN POOL TEMPORAL: Filtramos los profesores de la lista maestra
    // que NO estén en la terna que estamos armando actualmente.
    const poolDisponibleParaEstaTerna = this.profesoresTesis.filter(p => 
      !this.catedraticosTesisAsignados.some(asignado => asignado.nombre_completo === p.nombre_completo)
    );

    // 3. Validaciones
    if (this.girandoTesisProfe || this.catedraticosTesisAsignados.length >= 3 || poolDisponibleParaEstaTerna.length === 0) return;
    
    this.girandoTesisProfe = true;
    
    // 4. Sorteamos sobre el pool temporal
    const indice = Math.floor(Math.random() * poolDisponibleParaEstaTerna.length);
    this.gradosRotacionTesisProfe = this.calcularRotacionExacta(this.gradosRotacionTesisProfe, poolDisponibleParaEstaTerna.length, indice);

    setTimeout(() => {
      this.girandoTesisProfe = false;
      const ganador = poolDisponibleParaEstaTerna[indice];
      
      // Agregamos al jurado actual
      this.catedraticosTesisAsignados.push(ganador);
      
      // NO usamos splice sobre la lista maestra para que el profe pueda salir en la siguiente terna
      
      if (this.catedraticosTesisAsignados.length >= 3) { 
        this.cupoActualTesis = this.cupoBaseTesis + (this.sobrantesTesis > 0 ? 1 : 0);
        Swal.fire('¡Jurado Completo!', `Se han asignado los 3 catedráticos. Ahora sortea a los ${this.cupoActualTesis} alumnos uno por uno.`, 'info'); 
      }
      this.cdr.detectChanges();
    }, 4000);
  }
  iniciarSorteoTesisAlumnoIndividual() {
    if (this.catedraticosTesisAsignados.length < 3) { Swal.fire('Atención', 'Debes conformar el jurado de 3 catedráticos primero.', 'warning'); return; }
    if (this.girandoTesisAlum || this.alumnosTesisAsignados.length >= this.cupoActualTesis || this.alumnosTesis.length === 0) return;
    
    this.girandoTesisAlum = true;
    const indice = Math.floor(Math.random() * this.alumnosTesis.length);
    this.gradosRotacionTesisAlum = this.calcularRotacionExacta(this.gradosRotacionTesisAlum, this.alumnosTesis.length, indice);

    setTimeout(() => {
      this.girandoTesisAlum = false;
      const ganador = this.alumnosTesis[indice];
      this.alumnosTesisAsignados.push(ganador);
      this.alumnosTesis.splice(indice, 1);
      
      Swal.fire({ title: 'Alumno Asignado', text: `${ganador.nombre_completo} fue asignado a la terna.`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });

      if (this.alumnosTesisAsignados.length >= this.cupoActualTesis) {
         setTimeout(() => Swal.fire('¡Cupo Lleno!', `La terna de ${this.cupoActualTesis} alumnos está completa.`, 'info'), 600);
      }
      this.cdr.detectChanges();
    }, 4000); 
  }

  guardarTesisOficial() {
    if (this.alumnosTesisAsignados.length === 0 || this.catedraticosTesisAsignados.length < 3) return;
    
    let guardados = 0;
    const totalAGuardar = this.alumnosTesisAsignados.length;

    this.alumnosTesisAsignados.forEach(alu => {
      this.asignacionService.guardarTesis(alu, this.catedraticosTesisAsignados, this.eventoSeleccionado.id).subscribe({
        next: () => {
          guardados++;
          if (guardados === totalAGuardar) {
            Swal.fire('¡Guardado!', 'El jurado y su grupo de alumnos han sido registrados correctamente.', 'success');
            if (this.sobrantesTesis > 0) this.sobrantesTesis--;

            this.alumnosTesisAsignados = []; this.catedraticosTesisAsignados = []; 
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