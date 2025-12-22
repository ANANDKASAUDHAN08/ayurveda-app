import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyCallHistoryComponent } from './emergency-call-history.component';

describe('EmergencyCallHistoryComponent', () => {
  let component: EmergencyCallHistoryComponent;
  let fixture: ComponentFixture<EmergencyCallHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyCallHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmergencyCallHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
