import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createNewComment,
  getAllComments,
  removeComment,
} from "../controllers/comment.controller";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, getAllComments);
router.post("/", authenticate, createNewComment);
router.delete("/:id", authenticate, removeComment);

export { router };
