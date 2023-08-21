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
  ObjectCount,
  InstitutionSummary,
  UserSummary,
  RepositorySummary,
  InstiutionApiResponse,
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
  async findInstitutions(
    @Query() queryDto: InstitutionQueryDto,
  ): Promise<InstiutionApiResponse> {
    const queryConfig = queryDto;
    return await this.handleInstitutions(queryConfig);
  }

  @Get('singleInstitution')
  async findSingleInstitution(@Query() queryDto: string) {
    return (
      await this.mongoDbService.findInsitutionWithShortName(queryDto['name'])
    )[0];
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
   * Handle the instiution query with the given conditions
   * @param queryConfig The query values
   * @returns A InstituionApiResponse Object
   */
  private async handleInstitutions(
    queryConfig: InstitutionQueryConfig,
  ): Promise<InstiutionApiResponse> {
    let sectorList = this.sectors;
    if (queryConfig.sector.length > 0) {
      sectorList = this.sectors.filter((sector: string) => {
        return queryConfig.sector.includes(sector);
      });
    }
    let conditions: Object[] = [
      {
        sector: { $in: sectorList },
      },
    ];
    if (queryConfig.search.length > 0) {
      conditions.push({
        $text: { $search: queryConfig.search },
      });
    }
    let institutions = await this.mongoDbService.findInstitutionsWithConditions(
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      queryConfig.count,
      queryConfig.page,
      queryConfig.includeForks,
      conditions,
    );
    let foundSectors =
      await this.mongoDbService.countInstitutionsWithConditions(conditions);
    let total = 0;
    const sectorcount = {};
    foundSectors.forEach((foundSector) => {
      total += foundSector.total;
      sectorcount[foundSector._id] = foundSector.total;
    });
    return { institutions: institutions, total: total, sectors: sectorcount };
  }

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

  private async handleUsers(
    queryConfig: UserQueryConfig,
  ): Promise<{ users: UserSummary[]; total: number }> {
    let users: UserSummary[] = [];
    let total: number = 0;
    let cond: any = {};
    if (queryConfig.search.length > 0) {
      cond = {
        $text: { $search: queryConfig.search },
      };
    }
    users = await this.mongoDbService.findUsersWithSearchTerm(
      queryConfig.search,
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      queryConfig.count,
      queryConfig.page,
      cond,
    );
    total = await this.mongoDbService.countAllUsersWithSearchTerm(cond);
    return {
      users: users,
      total: total,
    };
  }
}
