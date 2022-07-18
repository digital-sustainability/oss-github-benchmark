import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiController } from './api/api.controller';
import { MongoDbService } from './mongo-db/mongo-db.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ApiController],
  providers: [AppService, MongoDbService],
})
export class AppModule {}
