import { IsIn, IsString, Min, Max, IsInt } from 'class-validator';
import {
  InstitutionQueryConfig,
  SingleInstitutionQueryConfig,
} from 'src/interfaces';

export class InstitutionQueryDto implements InstitutionQueryConfig {
  sector: string[];
  sort: string;
  @IsIn(['DESC', 'ASC'])
  direction: 'DESC' | 'ASC';
  @IsInt()
  @Min(1)
  @Max(1000)
  count: number;
  @IsInt()
  @Min(0)
  page: number;
  @IsString()
  search: string;
  sendStats: boolean;
  includeForks: boolean;
  findName: string;
}

export class SingleInstitutionQueryDTo implements SingleInstitutionQueryConfig {
  @IsString()
  name: string;
}
