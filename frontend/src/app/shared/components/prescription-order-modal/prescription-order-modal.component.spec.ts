import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionOrderModalComponent } from './prescription-order-modal.component';

describe('PrescriptionOrderModalComponent', () => {
  let component: PrescriptionOrderModalComponent;
  let fixture: ComponentFixture<PrescriptionOrderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionOrderModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrescriptionOrderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
