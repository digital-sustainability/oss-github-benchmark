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
  @Get('institutions')
  async findAllInstitutions(): Promise<Institution[]> {
    return this.mongoDbService.findAllInstitutions();
  }
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
    const institutions = await this.handleInstitutions(queryConfig);
    const sectors = await this.getAllSectorsFromInstitutions(institutions);
    return {
      institutions: institutions.slice(
        queryConfig.page * queryConfig.count,
        (queryConfig.page + 1) * queryConfig.count,
      ),
      total: institutions.length,
      sectors: sectors,
    };
  }
  @Get('repositories')
  async findAllRepositories(): Promise<Repository[]> {
    return this.mongoDbService.findAllRepositories();
  }
  /***********************************Old************************************************/

  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: Repository[]; total: number }> {
    const queryConfig = queryDto;
    //this.mongoDbService.findRepositories(queryConfig);
    const repositories = await this.handleRepositories(queryConfig);
    return { repositories: repositories, total: repositories.length };
  }
  @Get('users')
  async findAllUsers(): Promise<User[]> {
    return this.mongoDbService.findAllUsers();
  }
  @Get('paginatedUsers')
  @UsePipes(new UserQueryPipe(), new ValidationPipe({ transform: true }))
  async findUsers(
    @Query() queryDto: UserQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    const queryConfig = queryDto;
    return this.mongoDbService.findUsers(queryConfig);
  }
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
  private async handleInstitutions(
    queryConfig: InstitutionQueryConfig,
  ): Promise<Institution[]> {
    let institutions: Institution[] = [];
    if (queryConfig.search.length > 0) {
      institutions = await this.mongoDbService.findInstitutions(
        queryConfig.search,
      );
    } else {
      institutions = await this.mongoDbService.findAllInstitutions();
    }
    if (queryConfig.sector.length > 0) {
      institutions = await this.filterInstitutionsBySector(
        queryConfig.sector,
        institutions,
      );
    }
    institutions = await this.sortInstutitons(institutions, queryConfig);
    return institutions;
  }

  /**
   * Handle the repositories and the queries
   * @param params The queries
   * @returns The filtered and sorted repository list
   */
  private async handleRepositories(
    params: RepositoryQueryConfig,
  ): Promise<Repository[]> {
    let repositories = await this.mongoDbService.findRepository(params.search);
    if (!params.includeForks) {
      repositories = repositories.filter((repository: Repository, index) => {
        return !repository.fork;
      });
    }
    repositories = await this.sortRepositories(repositories, params);
    return repositories;
  }

  /**
   * Filter the instiutions by sector
   * @param sectors The selected sectors
   * @param institutitons The institutions to be filtered
   * @returns The filtered Institutions
   */
  private async filterInstitutionsBySector(
    sectors: string[],
    institutitons,
  ): Promise<Institution[]> {
    return (institutitons = institutitons.filter((institution: Institution) => {
      return sectors.includes(institution.sector);
    }));
  }

  /**
   * Get all the sectors from the institutions
   * @param institutions The institutions
   * @returns An array with the sectors and the count
   */
  private async getAllSectorsFromInstitutions(institutions: Institution[]) {
    let sectors = {};
    institutions.forEach((institution) => {
      sectors[institution.sector] = (sectors[institution.sector] ?? 0) + 1;
    });
    return sectors;
  }

  /**
   * Sort the Institutions by the the given parameters
   * @param insts The insitutions
   * @param params The parameters
   * @returns The sorted institution list
   */
  private async sortInstutitons(
    insts: Institution[],
    params: InstitutionQueryConfig,
  ): Promise<Institution[]> {
    return [...insts].sort((a, b) => {
      if (typeof a[params.sort] == 'string') {
        return params.direction == 'ASC'
          ? b[params.sort]
              .toLowerCase()
              .localeCompare(a[params.sort].toLowerCase())
          : a[params.sort]
              .toLowerCase()
              .localeCompare(b[params.sort].toLowerCase());
      } else {
        return params.direction == 'ASC'
          ? a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos) -
              b[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos)
          : b[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos) -
              a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos);
      }
    });
  }

  /**
   * Sort the repositories corresponding with the params
   * @param repositories The repositories to be sorted
   * @param params The params to sort
   * @returns The sorted repositories array
   */
  private async sortRepositories(
    repositories: Repository[],
    params: RepositoryQueryConfig,
  ): Promise<Repository[]> {
    return [...repositories].sort((a, b) => {
      try {
        if (typeof a[params.sort] == 'string') {
          return params.direction == 'ASC'
            ? b[params.sort]
                .toLowerCase()
                .localeCompare(a[params.sort].toLowerCase())
            : a[params.sort]
                .toLowerCase()
                .localeCompare(b[params.sort].toLowerCase());
        } else {
          return params.direction == 'ASC'
            ? a[params.sort] - b[params.sort]
            : b[params.sort] - a[params.sort];
        }
      } catch {
        return !b[params.sort];
      }
    });
  }
}
