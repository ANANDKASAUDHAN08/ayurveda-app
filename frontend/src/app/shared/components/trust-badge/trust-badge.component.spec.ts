import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrustBadgeComponent } from './trust-badge.component';

describe('TrustBadgeComponent', () => {
  let component: TrustBadgeComponent;
  let fixture: ComponentFixture<TrustBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustBadgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrustBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
