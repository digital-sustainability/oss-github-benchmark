import { IsIn, IsString, Min, Max, IsInt } from 'class-validator';
import { InstitutionQueryConfig } from 'src/interfaces';

export class InstitutionQueryDto implements InstitutionQueryConfig {
  sector: string[];
  sort: string;
  @IsIn(['DESC', 'ASC'])
  direction: 'DESC' | 'ASC';
  @IsInt()
  @Min(1)
  @Max(200)
  count: number;
  @IsInt()
  @Min(0)
  page: number;
  @IsString()
  search: string;
  sendStats: boolean;
  includeForksInSort: boolean;
  findName: string;
}
