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
} from 'src/interfaces';
import { MongoDbService } from 'src/mongo-db/mongo-db.service';
import { InstitutionQueryDto } from './dto/institution-query.dto';

@Controller('api')
export class ApiController {
  constructor(private mongoDbService: MongoDbService) {}
  @Get('institutions')
  async findAllInstitutions(): Promise<Institution[]> {
    return this.mongoDbService.findAllInstitutions();
  }
  @Get('paginatedInstitutions')
  @UsePipes(new InstitutionQueryPipe(), new ValidationPipe({ transform: true }))
  async findInstitutions(
    @Query() queryDto: InstitutionQueryDto,
  ): Promise<Institution[]> {
    const queryConfig = queryDto;
    return this.mongoDbService.findInstitutions(queryConfig);
  }
  @Get('repositories')
  async findAllRepositories(): Promise<Repository[]> {
    return this.mongoDbService.findAllRepositories();
  }
  @Get('users')
  async findAllUsers(): Promise<User[]> {
    return this.mongoDbService.findAllUsers();
  }
  @Get('progress')
  async findStatus(): Promise<Status> {
    return this.mongoDbService.findStatus();
  }
}
