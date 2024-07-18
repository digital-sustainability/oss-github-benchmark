/**
 * Unit tests for the MongoDbService class.
 * Tests are currently not working due to the use of a mock MongoDB client.
 * if this constructor is added to the Mongo-db-service.ts file, the tests will pass:
 * 
 *   constructor(@Inject('MongoClient') client: MongoClient) {
    this.client = client;
  }
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MongoDbService } from './mongo-db.service';

// Mock the MongoDB client and collections
const mockToArray = jest
  .fn()
  .mockResolvedValue([{ name: 'Test User', email: 'test@example.com' }]);
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });
const mockDb = jest.fn().mockReturnValue({ collection: mockCollection });
const mockClient = { db: mockDb };

describe('MongoDbService', () => {
  let service: MongoDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDbService,
        { provide: 'MongoClient', useValue: mockClient },
        { provide: 'DatabaseName', useValue: 'test-database' },
      ],
    }).compile();

    service = module.get<MongoDbService>(MongoDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    /**
     * Test case for the getAllUsers method.
     * It should return an array of users.
     */
    it('should return an array of users', async () => {
      const users = await service.getAllUsers();
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
    });
  });

  describe('getAllRepositories', () => {
    /**
     * Test case for the getAllRepositories method.
     * It should return an array of repositories.
     */
    it('should return an array of repositories', async () => {
      const mockRepositories = [
        { name: 'repo1', url: 'http://repo1.com' },
        { name: 'repo2', url: 'http://repo2.com' },
      ];

      mockToArray.mockResolvedValueOnce(mockRepositories);

      const repositories = await service.getAllRepositories();
      expect(repositories).toBeInstanceOf(Array);
      expect(repositories.length).toBeGreaterThan(0);
      expect(repositories[0]).toHaveProperty('name');
      expect(repositories[0]).toHaveProperty('url');
    });
  });
});
