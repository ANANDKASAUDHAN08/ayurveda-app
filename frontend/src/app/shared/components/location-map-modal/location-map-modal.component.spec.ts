import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationMapModalComponent } from './location-map-modal.component';

describe('LocationMapModalComponent', () => {
    let component: LocationMapModalComponent;
    let fixture: ComponentFixture<LocationMapModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LocationMapModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LocationMapModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
