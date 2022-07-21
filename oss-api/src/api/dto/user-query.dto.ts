import { IsIn, IsString, Min, Max, IsInt } from 'class-validator';
import { UserQueryConfig } from 'src/interfaces';

export class UserQueryDto implements UserQueryConfig {
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
}
