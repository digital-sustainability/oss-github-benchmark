import { Test, TestingModule } from '@nestjs/testing';
import { DataGatheringService } from './data-gatherting.service';

describe('DataGatheringService', () => {
  let service: DataGatheringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataGatheringService],
    }).compile();

    service = module.get<DataGatheringService>(DataGatheringService);
  });

  it('should be defined '),
    () => {
      expect(service).toBeDefined();
    };
});
