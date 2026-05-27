import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createNewTask,
  getAllTasks,
  removeTask,
  taskUpdate,
} from "../controllers/task.controller";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, getAllTasks);
router.post("/", authenticate, createNewTask);
router.put("/:id", authenticate, taskUpdate);
router.delete("/:id", authenticate, removeTask);

export { router };
