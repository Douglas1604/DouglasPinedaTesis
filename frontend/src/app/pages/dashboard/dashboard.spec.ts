import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard'; // <--- Corregido: Importamos DashboardComponent

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent] // <--- Corregido
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent); // <--- Corregido
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});