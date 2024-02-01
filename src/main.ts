import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: '*',
  });

  // API PREFIX
  app.setGlobalPrefix('api/v1');

  // APP PORT
  await app.listen(8080);
}
bootstrap();
