import { TestBed } from '@angular/core/testing';

import { DataExportService } from './data-export.service';

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
