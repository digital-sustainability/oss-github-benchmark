import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { UserQueryConfig } from './interfaces';

@Injectable()
export class UserQueryPipe implements PipeTransform {
  transform(queryParams: any, metadata: ArgumentMetadata) {
    const config: UserQueryConfig = {
      search: queryParams.search ? queryParams.search : '',
      sort: queryParams.sort ? queryParams.sort : 'followers',
      direction: queryParams.direction ? queryParams.direction : 'DESC',
      page: queryParams.page ? parseInt(queryParams.page) : 0,
      count: queryParams.count ? parseInt(queryParams.count) : 30,
    };
    return config;
  }
}
