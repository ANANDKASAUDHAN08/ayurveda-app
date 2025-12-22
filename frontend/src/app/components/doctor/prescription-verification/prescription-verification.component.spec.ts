import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionVerificationComponent } from './prescription-verification.component';

describe('PrescriptionVerificationComponent', () => {
  let component: PrescriptionVerificationComponent;
  let fixture: ComponentFixture<PrescriptionVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionVerificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrescriptionVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
