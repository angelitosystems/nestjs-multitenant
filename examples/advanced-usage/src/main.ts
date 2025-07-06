import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const appName = configService.get<string>('APP_NAME', 'NestJS Multitenant Advanced');
  const appVersion = configService.get<string>('APP_VERSION', '1.0.0');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
  }));

  // Compression middleware
  app.use(compression());

  // Rate limiting
  const rateLimitEnabled = configService.get<boolean>('RATE_LIMIT_ENABLED', true);
  if (rateLimitEnabled) {
    app.use(
      rateLimit({
        windowMs: configService.get<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
        max: configService.get<number>('RATE_LIMIT_MAX', 1000), // limit each IP to 1000 requests per windowMs
        message: configService.get<string>('RATE_LIMIT_MESSAGE', 'Too many requests from this IP'),
        standardHeaders: configService.get<boolean>('RATE_LIMIT_STANDARD_HEADERS', true),
        legacyHeaders: configService.get<boolean>('RATE_LIMIT_LEGACY_HEADERS', false),
      }),
    );
  }

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new TimeoutInterceptor(configService.get<number>('REQUEST_TIMEOUT', 30000)),
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Trust proxy (for load balancers)
  app.set('trust proxy', 1);

  // Swagger documentation
  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
  if (swaggerEnabled && nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', appName))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'Advanced NestJS Multitenant Application API with enterprise features',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', appVersion))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for authentication',
        },
        'API-Key',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management operations')
      .addTag('Tenants', 'Tenant management operations')
      .addTag('Dashboard', 'Dashboard and analytics')
      .addTag('Audit', 'Audit trail and logging')
      .addTag('Notifications', 'Notification management')
      .addTag('Health', 'Health checks and monitoring')
      .addServer(
        configService.get<string>('APP_URL', `http://localhost:${port}`),
        'Development server',
      )
      .setContact(
        configService.get<string>('SWAGGER_CONTACT_NAME', 'API Support'),
        configService.get<string>('APP_URL', `http://localhost:${port}`),
        configService.get<string>('SWAGGER_CONTACT_EMAIL', 'support@example.com'),
      )
      .setLicense(
        configService.get<string>('SWAGGER_LICENSE_NAME', 'MIT'),
        configService.get<string>(
          'SWAGGER_LICENSE_URL',
          'https://opensource.org/licenses/MIT',
        ),
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
    });

    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: `${appName} API Documentation`,
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3b82f6 }
      `,
    });

    console.log(`📚 Swagger documentation available at: http://localhost:${port}/${swaggerPath}`);
  }

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    app.close().then(() => {
      console.log('✅ Application closed successfully');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start the application
  await app.listen(port, '0.0.0.0');
  
  console.log('\n🚀 Application Information:');
  console.log(`   Name: ${appName}`);
  console.log(`   Version: ${appVersion}`);
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   Port: ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  
  if (swaggerEnabled && nodeEnv !== 'production') {
    console.log(`   API Docs: http://localhost:${port}/${configService.get<string>('SWAGGER_PATH', 'api')}`);
  }
  
  console.log(`   Health Check: http://localhost:${port}/health`);
  console.log(`   Metrics: http://localhost:${port}/metrics`);
  console.log('\n✅ Application is running successfully!\n');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});