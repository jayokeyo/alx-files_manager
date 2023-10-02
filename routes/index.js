import { Router } from "express";
import AppController from "../controllers/AppController";

// contains all the endpoints for our APIs

const router = Router();

router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStats);

module.exports = router;
