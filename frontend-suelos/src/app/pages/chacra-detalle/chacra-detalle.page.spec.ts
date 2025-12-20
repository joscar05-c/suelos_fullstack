import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChacraDetallePage } from './chacra-detalle.page';

describe('ChacraDetallePage', () => {
  let component: ChacraDetallePage;
  let fixture: ComponentFixture<ChacraDetallePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChacraDetallePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
