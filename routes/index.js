/*eslint-disable*/

import { Router } from "express";
import AppController from "../controllers/AppController";
import UsersController from "../controllers/UsersController";
import AuthController from "../controllers/AuthController";

// contains all the endpoints for our APIs

const router = Router();

router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStats);
router.post("/users", UsersController.postNew);
router.get("/connect", AuthController.getConnect);
router.get("/disconnect", AuthController.getDisconnect);
router.get("/users/me", UsersController.getMe);

module.exports = router;
