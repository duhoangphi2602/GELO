import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ─── CORS: Chỉ cho phép các origin được cấu hình ─────────────────────────────
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(','), // Hỗ trợ nhiều origin nếu cần
    credentials: true,
  });

  // ─── Body size limit: 15MB ─────────────────────────────────
  const bodyLimit = process.env.MAX_BODY_SIZE || '15mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));

  // ServeStaticModule in AppModule handles /uploads/

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      forbidNonWhitelisted: false,
      transform: true, // Auto-transform types (string → number)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── SWAGGER CONFIGURATION ───────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Gelo API')
    .setDescription(
      'The Gelo Healthcare AI Diagnostic System API Documentation',
    )
    .setVersion('1.0')
    .addTag('auth')
    .addTag('scans')
    .addTag('patients')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
