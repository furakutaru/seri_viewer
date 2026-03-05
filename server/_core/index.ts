import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMockOAuthRoutes } from "./mockOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";

const app = express();

// Trust proxy for secure cookies on Vercel/Render
app.set("trust proxy", 1);

/**
 * Common middleware and route registration
 */
function configureApp(app: express.Express) {
  // Enable CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Cookie parser (Required for authentication to read cookies)
  app.use(cookieParser());

  console.log("[Server] Configuring routes...");

  // OAuth & Mock OAuth
  registerOAuthRoutes(app);
  registerMockOAuthRoutes(app);

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
}

// Configure immediately
configureApp(app);

export { app };
export default app;
