import express from "express";

import { authenticate } from "../middleware/auth.middleware";
import {
  addMember,
  getMembers,
  removeMember,
} from "../controllers/member.controller";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, getMembers);
router.post("/", authenticate, addMember);
router.delete("/", authenticate, removeMember);

export { router };
