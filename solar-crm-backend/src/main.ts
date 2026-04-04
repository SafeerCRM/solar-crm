import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ADD THIS
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  await app.listen(3001, '0.0.0.0');
}
bootstrap();