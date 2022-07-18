import { Test, TestingModule } from '@nestjs/testing';
import { MongoDbService } from './mongo-db.service';

describe('MongoDbService', () => {
  let service: MongoDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MongoDbService],
    }).compile();

    service = module.get<MongoDbService>(MongoDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
