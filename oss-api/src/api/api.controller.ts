import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionQueryPipe } from 'src/institution-query.pipe';
import { Institution, Repository, User, Status } from 'src/interfaces';
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
    let institutions: Institution[] = [];
    if (queryConfig.search.length > 0) {
      institutions = await this.mongoDbService.findInstitutions(
        queryConfig.search,
      );
    } else {
      institutions = await this.mongoDbService.findAllInstitutions();
    }
    if (queryConfig.sector.length > 0) {
      institutions = await this.sortbySector(queryConfig.sector, institutions);
    }
    let sectors = {};
    institutions.forEach((institution) => {
      sectors[institution.sector] = (sectors[institution.sector] ?? 0) + 1;
    });
    // TODO: Remove old Code
    //return this.mongoDbService.findInstitutionsOld(queryConfig);
    return {
      institutions: institutions,
      total: institutions.length,
      sectors: sectors,
    };
  }
  @Get('repositories')
  async findAllRepositories(): Promise<Repository[]> {
    return this.mongoDbService.findAllRepositories();
  }
  @Get('paginatedRepositories')
  @UsePipes(new RepositoryQueryPipe(), new ValidationPipe({ transform: true }))
  async findRepositories(
    @Query() queryDto: RepositoryQueryDto,
  ): Promise<{ repositories: Repository[]; total: number }> {
    const queryConfig = queryDto;
    return this.mongoDbService.findRepositories(queryConfig);
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
  private async sortbySector(
    sectors: string[],
    institutitons,
  ): Promise<Institution[]> {
    return (institutitons = institutitons.filter((institution: Institution) => {
      return sectors.includes(institution.sector);
    }));
  }
}
