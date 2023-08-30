import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
const v8 = require('v8');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.flushLogs();
  //app.flushLogs();
  //BaseLogger.flush();
  //app.enableCors();

  /*process.on('SIGUSR2', () => {
    const fileName = v8.writeHeapSnapshot();
    console.log(`Created heapdump file: ${fileName}`);
  });*/

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
