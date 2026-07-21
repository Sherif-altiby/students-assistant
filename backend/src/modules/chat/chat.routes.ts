import { Router } from "express";
import { chatController } from "./chat.controller";
import { authenticate } from "../../middlewares/authenticate"; // your existing auth middleware

const router = Router();

router.get("/messages", authenticate, chatController.getHistory);

export { router as chatRouter };