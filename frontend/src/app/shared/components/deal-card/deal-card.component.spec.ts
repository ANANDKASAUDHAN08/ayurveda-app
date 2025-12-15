import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealCardComponent } from './deal-card.component';

describe('DealCardComponent', () => {
  let component: DealCardComponent;
  let fixture: ComponentFixture<DealCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DealCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
