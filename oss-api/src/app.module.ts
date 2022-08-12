import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { MongoDbService } from './mongo-db/mongo-db.service';
import { ConfigModule } from '@nestjs/config';
import { DataGathering } from './data-gathering/data-gathering';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
console.log(join(__dirname, '..', 'client'));
@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      exclude: ['api'],
    }),
  ],
  controllers: [, ApiController],
  providers: [MongoDbService, DataGathering],
})
export class AppModule {}
