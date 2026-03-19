import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sorteo } from './sorteo';

describe('Sorteo', () => {
  let component: Sorteo;
  let fixture: ComponentFixture<Sorteo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sorteo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sorteo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
