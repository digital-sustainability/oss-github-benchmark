import { IsIn, IsString, Min, Max, IsInt, IsBoolean } from 'class-validator';
import { RepositoryQueryConfig } from 'src/interfaces';

export class RepositoryQueryDto implements RepositoryQueryConfig {
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
  @IsBoolean()
  includeForks: boolean;
}
