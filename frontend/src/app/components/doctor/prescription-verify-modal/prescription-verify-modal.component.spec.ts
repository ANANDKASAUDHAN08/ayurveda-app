import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionVerifyModalComponent } from './prescription-verify-modal.component';

describe('PrescriptionVerifyModalComponent', () => {
  let component: PrescriptionVerifyModalComponent;
  let fixture: ComponentFixture<PrescriptionVerifyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrescriptionVerifyModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrescriptionVerifyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
