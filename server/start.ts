import "dotenv/config";
import app from "./_core/index";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import express from "express";

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const server = net.createServer();
        server.listen(port, "0.0.0.0", () => {
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

async function startServer() {
    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);
    const server = createServer(app);

    if (process.env.NODE_ENV === "development") {
        // Dynamic import to only load vite in development
        const { setupVite } = await import("./_core/vite");
        await setupVite(app, server);
    } else {
        // Static file serving for Render/VPS
        const { serveStatic } = await import("./_core/vite");
        serveStatic(app);
    }

    if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${port}/`);
    });
}

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
    startServer().catch(console.error);
}
