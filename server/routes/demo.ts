import { RequestHandler, Router } from "express";

const router = Router();

export const handleDemo: RequestHandler = (req, res) => {
  res.json({
    message: "Demo endpoint working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
};

// Route definitions
router.get("/", handleDemo);

export default router;
