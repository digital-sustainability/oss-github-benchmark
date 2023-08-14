import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionQueryPipe } from 'src/institution-query.pipe';
import {
  InstitutionQueryConfig,
  RepositoryQueryConfig,
  UserQueryConfig,
  ApiInstitution,
  ApiRepository,
  GroupCount,
  ObjectCount,
  InstitutionSummary,
  RepositoryRevised,
  UserSummary,
  Repository,
  RepositorySummary,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { UserQueryPipe } from 'src/user-query.pipe';
import { InstitutionQueryDto } from './dto/institution-query.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RepositoryQueryDto } from './dto/repository-query.dto';
import { RepositoryQueryPipe } from 'src/repository-query.pipe';
import { ObjectId } from 'mongodb';

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
        institutions: InstitutionSummary[];
        total: number;
        sectors: { [key: string]: number };
      }
    | InstitutionSummary
  > {
    const queryConfig = queryDto;
    return await this.handleInstitutions(queryConfig);
  }

  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: RepositorySummary[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig);
  }

  @Get('paginatedUsers')
  @UsePipes(new UserQueryPipe(), new ValidationPipe({ transform: true }))
  async findUsers(
    @Query() queryDto: UserQueryDto,
  ): Promise<{ users: UserSummary[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleUsers(queryConfig);
  }

  @Get('latestUpdate')
  async findLatestUpdate() {
    return (await this.mongoDbService.latestUpdate())[0];
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
        institutions: InstitutionSummary[];
        total: number;
        sectors: { [key: string]: number };
      }
    | InstitutionSummary
  > {
    let sectorList = this.sectors;
    if (queryConfig.sector.length > 0) {
      sectorList = this.sectors.filter((sector: string) => {
        return queryConfig.sector.includes(sector);
      });
    }
    let institutions: InstitutionSummary[] = [];
    let foundSectors: GroupCount[] = [];
    let cond: any = [
      {
        sector: { $in: sectorList },
      },
    ];
    if (queryConfig.search.length > 0) {
      cond.push({
        $text: { $search: queryConfig.search },
      });
    }
    institutions = await this.mongoDbService.findInstitutionsWithSearchTerm(
      queryConfig.search,
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      sectorList,
      queryConfig.count,
      queryConfig.page,
      false,
      cond,
    );
    foundSectors = await this.mongoDbService.countAllInstitutionsWithSearchTerm(
      cond,
    );
    let total = 0;
    const sectorcount = {};
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
  ): Promise<{ repositories: RepositorySummary[]; total: number }> {
    let repositories: RepositorySummary[] = [];
    let countedRepos: ObjectCount[] = [];
    const includeForks = queryConfig.includeForks ? [false, true] : [false];
    let cond: any = [
      {
        fork: { $in: includeForks },
      },
    ];
    if (queryConfig.search.length > 0) {
      cond.push({
        $text: { $search: queryConfig.search },
      });
    }
    repositories = await this.mongoDbService.findRepositoryWithSearchTerm(
      queryConfig.search,
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      queryConfig.count,
      queryConfig.page,
      cond,
    );
    countedRepos = await this.mongoDbService.countAllRepositoriesWithSearchTerm(
      cond,
    );
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
  ): Promise<{ users: UserSummary[]; total: number }> {
    let users: UserSummary[] = [];
    let total: number;
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
      console.log(total);
    }
    return {
      users: users,
      total: total,
    };
  }
}
