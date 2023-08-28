import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitutionDetailViewComponent } from './institution-detail-view.component';

describe('InstitutionDetailViewComponent', () => {
  let component: InstitutionDetailViewComponent;
  let fixture: ComponentFixture<InstitutionDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstitutionDetailViewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstitutionDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
