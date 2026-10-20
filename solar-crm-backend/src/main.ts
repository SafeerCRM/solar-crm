import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  rawBody: true,
});

    // Apply CORS before rate limiting so that even
  // rejected requests return the correct CORS headers.
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Preserve the existing global rate limit.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
    }),
  );

  app.use((req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.log(
        `🐢 SLOW API: ${req.method} ${req.originalUrl} - ${duration}ms`,
      );
    }
  });

  next();
});

  // Health check route (for Render)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ✅ ADD THIS BLOCK (REQUEST LOGGING)
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    });

    next();
  });

  // ✅ EXISTING CODE
  const PORT = process.env.PORT || 3001;

  await app.listen(PORT, '0.0.0.0');

  console.log(`🚀 Server running on port ${PORT}`);
}
bootstrap();