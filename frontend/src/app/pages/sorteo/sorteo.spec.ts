import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Se corrigió la importación para buscar SorteoComponent
import { SorteoComponent } from './sorteo'; 

describe('SorteoComponent', () => {
  let component: SorteoComponent;
  let fixture: ComponentFixture<SorteoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Se agregó HttpClientTestingModule para que el test reconozca las peticiones al server
      imports: [SorteoComponent, HttpClientTestingModule] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(SorteoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});