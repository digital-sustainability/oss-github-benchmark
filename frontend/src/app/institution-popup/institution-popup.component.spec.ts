import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitutionPopupComponent } from './institution-popup.component';

describe('InstitutionPopupComponent', () => {
  let component: InstitutionPopupComponent;
  let fixture: ComponentFixture<InstitutionPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InstitutionPopupComponent]
    });
    fixture = TestBed.createComponent(InstitutionPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
