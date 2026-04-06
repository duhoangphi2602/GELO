import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so React on localhost:5173 can call APIs here
  app.enableCors();
  app.use(json({ limit: '700mb' }));
  app.use(urlencoded({ limit: '700mb', extended: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
