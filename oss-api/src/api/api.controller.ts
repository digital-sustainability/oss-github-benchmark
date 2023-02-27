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
  InstitutionQueryConfig,
  RepositoryQueryConfig,
  UserQueryConfig,
  ApiInstitution,
  ApiRepository,
  GroupCount,
  ObjectCount,
  ApiUser,
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

  @Get('paginatedInstitutions')
  @UsePipes(new InstitutionQueryPipe(), new ValidationPipe({ transform: true }))
  async findInstitutions(@Query() queryDto: InstitutionQueryDto): Promise<
    | {
        institutions: ApiInstitution[];
        total: number;
        sectors: { [key: string]: number };
      }
    | ApiInstitution
  > {
    const queryConfig = queryDto;
    return await this.handleInstitutions(queryConfig);
  }
  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: ApiRepository[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig);
  }
  @Get('paginatedUsers')
  @UsePipes(new UserQueryPipe(), new ValidationPipe({ transform: true }))
  async findUsers(
    @Query() queryDto: UserQueryDto,
  ): Promise<{ users: ApiUser[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleUsers(queryConfig);
  }

  /***********************************Helper************************************************/
  /**
   * Handle the request and the institution data
   * @param queryConfig The queries of the request
   * @returns An institution array corresponding to the request
   */
  private async handleInstitutions(
    queryConfig: InstitutionQueryConfig,
  ): Promise<
    | {
        institutions: ApiInstitution[];
        total: number;
        sectors: { [key: string]: number };
      }
    | ApiInstitution
  > {
    let sectorList = this.sectors;
    if (queryConfig.findName.length > 0) {
      const institution =
        await this.mongoDbService.findInstitutionsWithSearchTerm(
          queryConfig.findName,
          queryConfig.sort,
          queryConfig.direction == 'ASC' ? 1 : -1,
          sectorList,
          queryConfig.count,
          queryConfig.page,
          true,
        );
      return institution[0];
    }
    if (queryConfig.sector.length > 0) {
      sectorList = this.sectors.filter((sector: string) => {
        return queryConfig.sector.includes(sector);
      });
    }
    let institutions: ApiInstitution[] = [];
    let foundSectors: GroupCount[] = [];
    if (queryConfig.search.length > 0) {
      institutions = await this.mongoDbService.findInstitutionsWithSearchTerm(
        queryConfig.search,
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        sectorList,
        queryConfig.count,
        queryConfig.page,
        false,
      );
      foundSectors =
        await this.mongoDbService.countAllInstitutionsWithSearchTerm(
          queryConfig.search,
          sectorList,
        );
    } else {
      institutions = await this.mongoDbService.findInstitutionsLimitedSorted(
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
  private async handleRepositories(
    queryConfig: RepositoryQueryConfig,
  ): Promise<{ repositories: ApiRepository[]; total: number }> {
    let repositories: ApiRepository[] = [];
    let countedRepos: ObjectCount[] = [];
    const includeForks = queryConfig.includeForks ? [false, true] : [false];
    if (queryConfig.search.length > 0) {
      repositories = await this.mongoDbService.findRepositoryWithSearchTerm(
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
      repositories = await this.mongoDbService.findAllRepositoriesLimitedSorted(
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
      total: countedRepos[0].total,
    };
  }

  /**
   * Handle the users paginate api calls
   * @param queryConfig The query parameters
   * @returns A Users array
   */
  private async handleUsers(
    queryConfig: UserQueryConfig,
  ): Promise<{ users: ApiUser[]; total: number }> {
    let users: ApiUser[] = [];
    let total: ObjectCount[] = [];
    if (queryConfig.search.length > 0) {
      users = await this.mongoDbService.findUsersWithSearchTerm(
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
      users = await this.mongoDbService.findAllUsersLimitedSorted(
        queryConfig.sort,
        queryConfig.direction == 'ASC' ? 1 : -1,
        queryConfig.count,
        queryConfig.page,
      );
      total = await this.mongoDbService.countAllUsers();
    }
    return {
      users: users,
      total: total[0].total,
    };
  }
}
