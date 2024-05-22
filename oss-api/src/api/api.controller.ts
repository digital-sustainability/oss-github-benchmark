import {
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionQueryPipe } from 'src/institution-query.pipe';
import {
  InstitutionQueryConfig,
  RepositoryQueryConfig,
  UserQueryConfig,
  InstiutionApiResponse,
  SingleInstitutionResponse,
  RepositoryApiResponse,
  UserApiResponse,
  TodoInstitution,
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { UserQueryPipe } from 'src/user-query.pipe';
import {
  InstitutionQueryDto,
  SingleInstitutionQueryDTo,
} from './dto/institution-query.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RepositoryQueryDto } from './dto/repository-query.dto';
import { RepositoryQueryPipe } from 'src/repository-query.pipe';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api')
export class ApiController {
  constructor(
    private mongoDbService: MongoDbService,
    private authService: AuthService,
  ) {}
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
  async findSingleInstitution(
    @Query() queryDto: SingleInstitutionQueryDTo,
  ): Promise<SingleInstitutionResponse> {
    return (
      await this.mongoDbService.findInstitutionWithShortName(queryDto.name)
    )[0];
  }

  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<RepositoryApiResponse> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig, false);
  }

  @Get('paginatedUsers')
  @UsePipes(new UserQueryPipe(), new ValidationPipe({ transform: true }))
  async findUsers(@Query() queryDto: UserQueryDto): Promise<UserApiResponse> {
    const queryConfig = queryDto;
    return await this.handleUsers(queryConfig);
  }

  @Get('institutionRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositoriesDetailView(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<RepositoryApiResponse> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig, true);
  }

  @Get('latestUpdate')
  async findLatestUpdate() {
    return (await this.mongoDbService.latestUpdate())[0];
  }

  @UseGuards(AuthGuard)
  @Post('institution')
  async addInstitution(@Body('institution') institution: TodoInstitution) {
    return this.mongoDbService.createNewTodoInstitution(institution);
  }

  // @UseGuards(AuthGuard)
  @Get('institution')
  async findTodoInstitution() {
    return await this.mongoDbService.findAllTodoInstitutions();
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

  /**
   * Handle the repository query with the given conditions
   * @param queryConfig The query values
   * @returns A RepositoryApiResponse
   */
  private async handleRepositories(
    queryConfig: RepositoryQueryConfig,
    detailedView: boolean,
  ): Promise<RepositoryApiResponse> {
    const includeForks = queryConfig.includeForks ? [false, true] : [false];
    let condition: Object[] = [
      {
        fork: { $in: includeForks },
      },
    ];
    if (queryConfig.search.length > 0 && !detailedView) {
      condition.push({
        $text: { $search: queryConfig.search },
      });
    } else if (detailedView) {
      condition.push({
        institution: queryConfig.search,
      });
    }
    let repositories = await this.mongoDbService.findRepositoryWithConditions(
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      queryConfig.count,
      queryConfig.page,
      condition,
    );
    let countedRepos =
      await this.mongoDbService.countAllRepositoriesWithConditions(condition);
    return {
      repositories: repositories,
      total: countedRepos[0].total,
    };
  }

  /**
   * Handle the user query with the given conditions
   * @param queryConfig The query values
   * @returns A UserApiResponse
   */
  private async handleUsers(
    queryConfig: UserQueryConfig,
  ): Promise<UserApiResponse> {
    let condition: Object = {};
    if (queryConfig.search.length > 0) {
      condition = {
        $text: { $search: queryConfig.search },
      };
    }
    let users = await this.mongoDbService.findUsersWithConditions(
      queryConfig.sort,
      queryConfig.direction == 'ASC' ? 1 : -1,
      queryConfig.count,
      queryConfig.page,
      condition,
    );
    let total = await this.mongoDbService.countAllUsersWithConditions(
      condition,
    );
    return {
      users: users,
      total: total,
    };
  }
}
