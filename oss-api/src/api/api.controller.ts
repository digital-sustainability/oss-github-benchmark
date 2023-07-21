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
  ): Promise<{ repositories: ApiRepository[]; total: number }> {
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
      for (const institution of institutions) {
        const repos = await this.getInstitutionRepositories(
          institution['orgs'],
        );
        const orgas = await this.mongoDbService.getOrganisationsWithObjectIds(
          institution['orgs'],
        );
        const location = orgas
          .filter((orga) => orga.locations)
          .map(({ locations }) => locations)[0];
        let created_at = new Date(
          Math.min(
            ...orgas
              .filter((orga) => orga.created_at)
              .map(({ created_at }) => new Date(created_at).getTime()),
          ),
        ).toDateString();
        if (created_at == 'Invalid Date') created_at = '';
        institution.num_repos = repos.length;
        institution.num_members = await this.getInstituionMemberCount(repos);
        institution.total_num_forks_in_repos = repos.filter(
          (repo) => repo.fork == true,
        ).length;
        institution.avatar = institution.avatar ? institution.avatar[0] : '';
        institution.repo_names = repos.map(({ name }) => name);
        institution.location = location;
        institution.created_at = created_at;
      }
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
      for (const institution of institutions) {
        const repos = await this.getInstitutionRepositories(
          institution['orgs'],
        );
        const orgas = await this.mongoDbService.getOrganisationsWithObjectIds(
          institution['orgs'],
        );
        const location = orgas
          .filter((orga) => orga.locations)
          .map(({ locations }) => locations)[0];
        let created_at = new Date(
          Math.min(
            ...orgas
              .filter((orga) => orga.created_at)
              .map(({ created_at }) => new Date(created_at).getTime()),
          ),
        ).toDateString();
        if (created_at == 'Invalid Date') created_at = '';
        institution.num_repos = repos.length;
        institution.num_members = await this.getInstituionMemberCount(repos);
        institution.total_num_forks_in_repos = repos.filter(
          (repo) => repo.fork == true,
        ).length;
        institution.avatar = institution.avatar ? institution.avatar[0] : '';
        institution.repo_names = repos.map(({ name }) => name);
        institution.location = location;
        institution.created_at = created_at;
      }

      foundSectors = await this.mongoDbService.countAllInstitutions(sectorList);
    }
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

  private async getInstitutionRepositories(
    organisations: ObjectId[],
  ): Promise<RepositoryRevised[]> {
    const institutionOrganisations =
      await this.mongoDbService.getOrganisationRepositoriesObjectIds(
        organisations,
      );
    let repoIds = [];
    for (const institutionOrganisation of institutionOrganisations) {
      repoIds = repoIds.concat(institutionOrganisation['repos']);
    }
    return this.mongoDbService.getRepositoriesWithObjectIds(repoIds);
  }

  private async getInstituionMemberCount(
    repos: RepositoryRevised[],
  ): Promise<number> {
    let count = 0;
    for (const repo of repos) {
      /*count += (
        await this.mongoDbService.getContributorsWithId(repo.contributors)
      ).length;*/
      count += repo.contributors.length;
    }

    return count;
  }
}
