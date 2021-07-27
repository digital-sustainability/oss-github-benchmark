import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoriesRankingComponent } from './repositories-ranking.component';

describe('RepositoriesRankingComponent', () => {
  let component: RepositoriesRankingComponent;
  let fixture: ComponentFixture<RepositoriesRankingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RepositoriesRankingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoriesRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
