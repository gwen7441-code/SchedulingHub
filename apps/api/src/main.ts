import "reflect-metadata";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { nanoid } from "nanoid";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(
    pinoHttp({
      genReqId: (req, res) => {
        const existing = req.headers["x-request-id"];
        const requestId = Array.isArray(existing) ? existing[0] : existing ?? nanoid();
        res.setHeader("x-request-id", requestId);
        return requestId;
      },
      redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"]
    })
  );
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
  app.enableCors({
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME ?? "First Aid Instructor Scheduler")
    .setDescription("Scheduling API for instructors and administrators")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
