import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { MongoDbService } from './mongo-db/mongo-db.service';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GithubService } from './github/github.service';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { TransformerService } from './transformer/transformer.service';
import { GithubCrawlerService } from './github-crawler/github-crawler.service';
import { DataService } from './data/data.service';
import { TelemetryService } from './telemetry/telemetry.service';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(),
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      exclude: ['api'],
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [ApiController],
  providers: [
    MongoDbService,
    GithubService,
    TransformerService,
    GithubCrawlerService,
    DataService,
    TelemetryService,
  ],
})
export class AppModule {}
