import { Test, TestingModule } from '@nestjs/testing';
import { GithubCrawlerService } from './github-crawler.service';

describe('GithubCrawlerService', () => {
  let service: GithubCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubCrawlerService],
    }).compile();

    service = module.get<GithubCrawlerService>(GithubCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
