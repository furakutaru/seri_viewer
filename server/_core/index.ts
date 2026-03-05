// Removed dotenv/config for Vercel compatibility
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMockOAuthRoutes } from "./mockOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

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

  // Static files (only for non-Vercel environments)
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "development") {
      // Dynamic import to avoid bundling Vite in production
      import("./vite").then(({ serveStatic }) => serveStatic(app)).catch(err => {
        console.error("[Server] Failed to load static file handler:", err);
      });
    }
  }
}

// Configure immediately
configureApp(app);

/**
 * Start the server (for local development and traditional VPS)
 */
async function startServer() {
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Run only if not on Vercel
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer().catch(console.error);
}

export { app };
export default app;
