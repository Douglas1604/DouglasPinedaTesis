import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  totalSorteos = 0;
  totalTesis = 0;
  totalPrivados = 0;
  ultimosSorteos: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef // <-- EL DESPERTADOR
  ) {}

  

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/asignaciones').subscribe({
      next: (data) => {
        this.totalSorteos = data.length;
        this.totalTesis = data.filter(d => d.modalidad === 'Tesis').length;
        this.totalPrivados = data.filter(d => d.modalidad !== 'Tesis').length;
        this.ultimosSorteos = data.slice(0, 5); 
        
        // MAGIA: Obligamos a Angular a repintar la pantalla en este milisegundo
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error cargando dashboard:", err)
    });
  }
}