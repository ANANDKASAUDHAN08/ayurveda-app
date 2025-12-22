import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyHubComponent } from './emergency-hub.component';

describe('EmergencyHubComponent', () => {
  let component: EmergencyHubComponent;
  let fixture: ComponentFixture<EmergencyHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyHubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmergencyHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
