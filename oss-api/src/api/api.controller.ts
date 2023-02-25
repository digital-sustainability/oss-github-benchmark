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
  @Get('institutions')
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
  }
  @Get('paginatedInstitutions')
  @UsePipes(new InstitutionQueryPipe(), new ValidationPipe({ transform: true }))
  async findInstitutions(@Query() queryDto: InstitutionQueryDto): Promise<{
    institutions: Institution[];
    total: number;
    sectors: { [key: string]: number };
  }> {
    const queryConfig = queryDto;
    /*const institutions =*/ return await this.handleInstitutions(queryConfig);
    //const sectors = await this.getAllSectorsFromInstitutions(institutions);
    /*return {
      institutions: institutions.slice(
        queryConfig.page * queryConfig.count,
        (queryConfig.page + 1) * queryConfig.count,
      ),
      total: institutions.length,
      sectors: sectors,
    };*/
  }
  @Get('repositories')
  async findAllRepositories(): Promise<Repository[]> {
    let temp: Repository[] = [];
    return temp;
    //return this.mongoDbService.findAllRepositories();
  }
  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: Repository[]; total: number }> {
    const queryConfig = queryDto;
    return await this.handleRepositories(queryConfig);
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
    const users = await this.handleUsers(queryConfig);
    return {
      users: users.slice(
        queryConfig.page * queryConfig.count,
        (queryConfig.page + 1) * queryConfig.count,
      ),
      total: users.length,
    };
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
  private async handleUsers(params: UserQueryConfig): Promise<User[]> {
    let users: User[] = [];
    if (params.search.length > 0) {
      users = await this.mongoDbService.findPeople(params.search);
    } else {
      users = await this.mongoDbService.findAllUsers();
    }
    users = await this.sortUsers(params, users);
    return users;
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
    console.log(insts.map((entry) => entry.num_repos));

    let test = insts.sort((a, b) => {
      if (typeof a[params.sort] == 'string') {
        return params.direction == 'ASC'
          ? b[params.sort]
              .toLowerCase()
              .localeCompare(a[params.sort].toLowerCase())
          : a[params.sort]
              .toLowerCase()
              .localeCompare(b[params.sort].toLowerCase());
      } else {
        console.log(`${a[params.sort] - b[params.sort]}`);
        return params.direction == 'ASC'
          ? a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos) -
              b[params.sort] -
              (params.includeForksInSort ? 0 : b.total_num_forks_in_repos)
          : b[params.sort] -
              (params.includeForksInSort ? 0 : b.total_num_forks_in_repos) -
              a[params.sort] -
              (params.includeForksInSort ? 0 : a.total_num_forks_in_repos);
      }
    });
    console.log(test.map((entry) => entry.num_repos));

    return test;
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

  /**
   * Sort the users
   * @param params The query params
   * @param users The user array
   * @returns A sorted user array
   */
  private async sortUsers(
    params: UserQueryConfig,
    users: User[],
  ): Promise<User[]> {
    return [...users].sort((a, b) => {
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
