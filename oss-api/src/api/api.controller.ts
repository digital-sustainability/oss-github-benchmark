import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionQueryPipe } from 'src/institution-query.pipe';
import {
  Institution,
  Repository,
  User,
  Status,
  InstitutionQueryConfig,
  RepositoryQueryConfig,
  UserQueryConfig,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { UserQueryPipe } from 'src/user-query.pipe';
import { InstitutionQueryDto } from './dto/institution-query.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RepositoryQueryDto } from './dto/repository-query.dto';
import { RepositoryQueryPipe } from 'src/repository-query.pipe';

@Controller('api')
export class ApiController {
  constructor(private mongoDbService: MongoDbService) {}
  private sectors = [
    'IT',
    'Communities',
    'Insurances',
    'Banking',
    'Media',
    'Others',
    'Gov_Companies',
    'Gov_Federal',
    'Gov_Cantons',
    'Gov_Cities',
    'ResearchAndEducation',
    'NGOs',
    'Pharma',
    'FoodBeverage',
  ];
  /*@Get('institutions')
  async findAllInstitutions(
    @Query() queryDto: InstitutionQueryDto,
  ): Promise<Institution[]> {
    const queryConfig = queryDto;
    return this.mongoDbService.findAllInstitutions(
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      this.sectors,
      200,
      0,
    );
  }*/
  @Get('paginatedInstitutions')
  @UsePipes(new InstitutionQueryPipe(), new ValidationPipe({ transform: true }))
  async findInstitutions(@Query() queryDto: InstitutionQueryDto): Promise<
    | {
        institutions: Institution[];
        total: number;
        sectors: { [key: string]: number };
      }
    | Institution
  > {
    const queryConfig = queryDto;
    return await this.handleInstitutions(queryConfig);
  }
  /*@Get('repositories')
  async findAllRepositories(): Promise<Repository[]> {
    let temp: Repository[] = [];
    return temp;
    //return this.mongoDbService.findAllRepositories();
  }*/
  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: Repository[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig);
  }
  /*@Get('users')
  async findAllUsers(): Promise<User[]> {
    return this.mongoDbService.findAllUsers();
  }*/
  @Get('paginatedUsers')
  @UsePipes(new UserQueryPipe(), new ValidationPipe({ transform: true }))
  async findUsers(
    @Query() queryDto: UserQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleUsers(queryConfig);
  }
  /***********************************Old************************************************/

  @Get('progress')
  async findStatus(): Promise<Status> {
    return this.mongoDbService.findStatus();
  }

  /***********************************Helper************************************************/
  /**
   * Handle the request and the institution data
   * @param queryConfig The queries of the request
   * @returns An institution array corresponding to the request
   */
  private async handleInstitutions(queryConfig: InstitutionQueryConfig) {
    let sectorList = this.sectors;
    if (queryConfig.findName.length > 0) {
      const institution = await this.mongoDbService.findInstitutions(
        queryConfig.findName,
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        sectorList,
        queryConfig.count,
        queryConfig.page,
      );
      return institution[0];
    }
    if (queryConfig.sector.length > 0) {
      sectorList = this.sectors.filter((sector: string) => {
        return queryConfig.sector.includes(sector);
      });
    }
    let institutions: Institution[] = [];
    let foundSectors = [];
    if (queryConfig.search.length > 0) {
      institutions = await this.mongoDbService.findInstitutions(
        queryConfig.search,
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        sectorList,
        queryConfig.count,
        queryConfig.page,
      );
      foundSectors = await this.mongoDbService.countAllInstitutions(sectorList);
      foundSectors =
        await this.mongoDbService.countAllInstitutionsWithSearchTerm(
          queryConfig.search,
          sectorList,
        );
    } else {
      institutions = await this.mongoDbService.findAllInstitutions(
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        sectorList,
        queryConfig.count,
        queryConfig.page,
      );
      foundSectors = await this.mongoDbService.countAllInstitutions(sectorList);
    }
    let total = 0;
    let sectorcount = {};
    foundSectors.forEach((foundSector) => {
      total += foundSector.total;
      sectorcount[foundSector._id] = foundSector.total;
    });
    return { institutions: institutions, total: total, sectors: sectorcount };
  }

  /**
   * Handle the repositories and the queries
   * @param queryConfig The queries
   * @returns The filtered and sorted repository list
   */
  private async handleRepositories(queryConfig: RepositoryQueryConfig) {
    let repositories: Repository[] = [];
    let countedRepos = {};
    const includeForks = queryConfig.includeForks ? [false, true] : [false];
    if (queryConfig.search.length > 0) {
      repositories = await this.mongoDbService.findRepository(
        queryConfig.search,
        includeForks,
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        queryConfig.count,
        queryConfig.page,
      );
      countedRepos =
        await this.mongoDbService.countAllRepositoriesWithSearchTerm(
          queryConfig.search,
          includeForks,
        );
    } else {
      repositories = await this.mongoDbService.findAllRepositories(
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        queryConfig.count,
        queryConfig.page,
        includeForks,
      );
      countedRepos = await this.mongoDbService.countAllRepositories(
        includeForks,
      );
    }
    return {
      repositories: repositories,
      total: countedRepos[0]['total'],
    };
  }

  /**
   * Handle the users paginate api calls
   * @param params The query parameters
   * @returns A Users array
   */
  private async handleUsers(queryConfig: UserQueryConfig) {
    let users: User[] = [];
    let total = {};
    if (queryConfig.search.length > 0) {
      users = await this.mongoDbService.findPeople(
        queryConfig.search,
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        queryConfig.count,
        queryConfig.page,
      );
      total = await this.mongoDbService.countAllUsersWithSearchTerm(
        queryConfig.search,
      );
    } else {
      users = await this.mongoDbService.findAllUsers(
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        queryConfig.count,
        queryConfig.page,
      );
      total = await this.mongoDbService.countAllUsers();
    }
    console.log(total);

    return {
      users: users,
      total: total[0]['total'],
    };
  }
}
