import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { getAllUsers } from "../controllers/user.controller";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, authorize("ADMIN"), getAllUsers);

export { router };
