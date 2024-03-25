import { Test, TestingModule } from '@nestjs/testing';
import { GithubCrawlerService } from './github-crawler.service';
import { GithubService } from '../github/github.service';
import { MongoDbService } from '../mongo-db/mongo-db.service';
import { TelemetryService } from '../telemetry/telemetry.service';

describe('GithubCrawlerService', () => {
  let service: GithubCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubCrawlerService,
        GithubService,
        MongoDbService,
        TelemetryService,
      ],
    }).compile();

    service = module.get<GithubCrawlerService>(GithubCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('test sorting function', () => {
    const now = new Date();
    const input = [
      {
        ts: now,
      },
      {
        ts: new Date(now.getDate() - 1),
      },
      {
        ts: 'no date',
      },
      {
        x: 'no ts',
      },
    ];
    let res = service.sortAfterDate(input[0], input[1]);
    expect(res).toBeLessThan(0);
    res = service.sortAfterDate(input[1], input[2]);
    expect(res).toBe(0);
    res = service.sortAfterDate(input[1], input[3]);
    expect(res).toBe(1);
  });
});
