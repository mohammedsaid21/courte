import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get<string>("FRONTEND_ORIGIN") ?? "http://localhost:3000";
  app.enableCors({
    origin: origin.split(",").map((item) => item.trim()),
    credentials: true,
  });
  app.setGlobalPrefix("api");
  const port = Number(config.get("PORT") ?? 3001);
  await app.listen(port);
}

void bootstrap();
