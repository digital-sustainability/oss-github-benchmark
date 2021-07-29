import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryDetailViewComponent } from './repository-detail-view.component';

describe('RepositoryDetailViewComponent', () => {
  let component: RepositoryDetailViewComponent;
  let fixture: ComponentFixture<RepositoryDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RepositoryDetailViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoryDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
