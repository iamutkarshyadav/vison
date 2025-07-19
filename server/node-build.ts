import dotenv from "dotenv";
dotenv.config();

import app from "./index";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\x1b[32m✅ Server running at http://localhost:${PORT}\x1b[0m`);
  console.log(
    `\x1b[36m✅ Environment: ${process.env.NODE_ENV || "development"}\x1b[0m`,
  );
  // Colorful API endpoint logging
  console.log(
    "\x1b[35m================= API Endpoints =================\x1b[0m",
  );
  console.log("\x1b[33m[GET, POST]   /api/auth\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/images\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/payments\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/community\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/follow\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/demo\x1b[0m");
  console.log("\x1b[33m[GET, POST]   /api/demo-fallback\x1b[0m");
  console.log("\x1b[33m[GET]         /api/health\x1b[0m");
  console.log(
    "\x1b[35m================================================\x1b[0m",
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
