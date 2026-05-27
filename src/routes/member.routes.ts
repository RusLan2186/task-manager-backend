import express from "express";

import { authenticate } from "../middleware/auth.middleware";
import {
  addMember,
  getAvailableUsers,
  getMembers,
  removeMember,
} from "../controllers/member.controller";

const router = express.Router({ mergeParams: true });

router.get("/available-users", authenticate, getAvailableUsers);
router.get("/", authenticate, getMembers);
router.post("/", authenticate, addMember);
router.delete("/", authenticate, removeMember);

export { router };
