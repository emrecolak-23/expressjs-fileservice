import express, { Request, Response, NextFunction } from "express";

import cors from "cors";
import dotenv from "dotenv";
import "express-async-errors";
import * as prom from "prom-client";
import promBundle from "express-prom-bundle";

import path from "path";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
} else {
  dotenv.config();
}

// Import MiddlesWares
import { currentUser } from "./middlewares/current-user";
import { errorHandler } from "./middlewares/error-handler";
import { translations } from "./middlewares/translations";

// Import Types
import { CurrentUser } from "./types/current-user";

// Import Errors
import { NotFoundError } from "./errors/not-found-error";

// Import Routes
import { filesRoutes } from "./routes/files";
import { fileTypesRoutes } from "./routes/file-types";
import { briefcasesRoutes } from "./routes/briefcases";

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      language?: string;
      fileKey: string;
      token: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const collectDefaultMetrics = prom.collectDefaultMetrics();
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
});

app.use(metricsMiddleware);
app.get("/file-service/metrics", async (req: Request, res: Response) => {
  try {
    res.set("Content-Type", prom.register.contentType);
    const metrics = await prom.register.metrics();
    console.log(metrics, "metrics");
    res.send(metrics);
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get("/file-service/healthcheck", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});
app.use(translations);
app.use(currentUser);

app.use("/files", filesRoutes());
app.use("/file-types", fileTypesRoutes());
app.use("/briefcases", briefcasesRoutes());

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  console.log("Route not found");
  throw new NotFoundError("route_not_found");
});

app.use(errorHandler);

export { app };
