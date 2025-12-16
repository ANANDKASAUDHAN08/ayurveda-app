import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalDevicesComponent } from './medical-devices.component';

describe('MedicalDevicesComponent', () => {
  let component: MedicalDevicesComponent;
  let fixture: ComponentFixture<MedicalDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalDevicesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicalDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
