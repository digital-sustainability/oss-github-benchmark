import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { RepositoryQueryConfig } from './interfaces';

@Injectable()
export class RepositoryQueryPipe implements PipeTransform {
  transform(queryParams: any, metadata: ArgumentMetadata) {
    const config: RepositoryQueryConfig = {
      search: queryParams.search ? queryParams.search : '',
      sort: queryParams.sort ? queryParams.sort : 'followers',
      direction: queryParams.direction ? queryParams.direction : 'DESC',
      page: queryParams.page ? parseInt(queryParams.page) : 0,
      count: queryParams.count ? parseInt(queryParams.count) : 30,
      includeForks: queryParams.includeForks
        ? queryParams.includeForks === 'true'
        : false,
    };
    return config;
  }
}
