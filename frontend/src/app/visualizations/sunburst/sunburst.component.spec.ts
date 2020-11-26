import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunburstComponent } from './sunburst.component';

describe('SunburstComponent', () => {
  let component: SunburstComponent;
  let fixture: ComponentFixture<SunburstComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SunburstComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SunburstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
