import express from "express";
import {
  createNewProject,
  getAllProjects,
  getOneProject,
  removeProject,
} from "../controllers/project.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, getAllProjects);
router.get("/:projectId", authenticate, getOneProject);
router.post("/", authenticate, createNewProject);
router.delete("/:projectId", authenticate, removeProject);

export { router };
