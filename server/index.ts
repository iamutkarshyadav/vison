import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth.js";
import imagesRoutes from "./routes/images.js";
import paymentsRoutes from "./routes/payments.js";
import communityRoutes from "./routes/community.js";
import followRoutes from "./routes/follow.js";
import demoRoutes from "./routes/demo.js";
import demoFallbackRoutes from "./routes/demo-fallback.js";

// Import database connection
import "./database/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for Vercel
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ([
            "https://your-app-name.vercel.app",
            "https://your-custom-domain.com",
            process.env.FRONTEND_URL,
          ].filter(Boolean) as string[])
        : [
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:3000",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://checkout.stripe.com",
        ],
      },
    },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/demo-fallback", demoFallbackRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Fix: resolve to ../spa instead of ../dist/spa
  const staticPath = path.join(__dirname, "../spa");
  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

export default app;
