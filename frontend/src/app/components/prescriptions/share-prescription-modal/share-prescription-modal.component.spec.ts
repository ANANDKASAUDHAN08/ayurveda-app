import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharePrescriptionModalComponent } from './share-prescription-modal.component';

describe('SharePrescriptionModalComponent', () => {
  let component: SharePrescriptionModalComponent;
  let fixture: ComponentFixture<SharePrescriptionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharePrescriptionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharePrescriptionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
