import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { MongoDbService } from './mongo-db/mongo-db.service';
import { ConfigModule } from '@nestjs/config';
import { DataGathering } from './data-gathering/data-gathering';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DataGatheringService } from './data-gathering/data-gatherting.service';
import { GithubService } from './github/github.service';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      exclude: ['api'],
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [ApiController],
  providers: [
    MongoDbService,
    DataGathering,
    DataGatheringService,
    GithubService,
  ],
})
export class AppModule {}
