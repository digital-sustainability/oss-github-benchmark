import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InstitutionQueryConfig } from './interfaces';

@Injectable()
export class InstitutionQueryPipe implements PipeTransform {
  transform(queryParams: any, metadata: ArgumentMetadata) {
    const config: InstitutionQueryConfig = {
      sector: queryParams.sector ? queryParams.sector : [],
      search: queryParams.search ? queryParams.search : '',
      sort: queryParams.sort ? queryParams.sort : 'num_repos',
      direction: queryParams.direction ? queryParams.direction : 'DESC',
      page: queryParams.page ? parseInt(queryParams.page) : 0,
      count: queryParams.count ? parseInt(queryParams.count) : 30,
      sendStats: queryParams.sendStats
        ? queryParams.sendStats === 'true'
        : false,
      includeForks: queryParams.includeForks
        ? queryParams.includeForks === 'true'
        : false,
    };
    return config;
  }
}
