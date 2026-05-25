import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getAllUsers } from "../controllers/user.controller";


const router = express.Router({ mergeParams: true });

router.get("/", authenticate, getAllUsers);


export { router };