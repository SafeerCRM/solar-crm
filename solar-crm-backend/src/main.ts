import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Health check route (for Render)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ✅ IMPORTANT FIX
  const PORT = process.env.PORT || 3001;

  await app.listen(PORT, '0.0.0.0');

  console.log(`🚀 Server running on port ${PORT}`);
}
bootstrap();