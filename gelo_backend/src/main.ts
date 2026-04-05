import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so React on localhost:5173 can call APIs here
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
