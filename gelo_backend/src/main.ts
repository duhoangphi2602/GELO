import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ─── CORS: Chỉ cho phép frontend dev ─────────────────────────────────────
  app.enableCors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  });

  // ─── Body size limit: 10MB thay vì 700MB ─────────────────────────────────
  const bodyLimit = process.env.MAX_BODY_SIZE || '10mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));

  // ServeStaticModule in AppModule handles /uploads/

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown fields
      forbidNonWhitelisted: false,
      transform: true,       // Auto-transform types (string → number)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
