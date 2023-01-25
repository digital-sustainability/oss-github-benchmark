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
import { FileService } from './file/file.service';
import { createWriteStream } from 'fs';
import pino from 'pino';
const log = createWriteStream(
  /*process.env.ERROR_PATH +*/ '/Users/dsl/Documents/tmp/errors/test.json',
  {
    encoding: 'utf-8',
  },
);
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
            },
          },
        },
        log,
      ],
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
    FileService,
  ],
})
export class AppModule {}
