import { Request, Response } from "express";
import {
  addProjectMember,
  ensureProjectMemberManagementAccess,
  getProjectMemberCandidates,
  getProjectMembers,
  removeProjectMember,
} from "../services/member.service";

type AuthUser = {
  id: number;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const getMembers = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;

  if (!projectId) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  try {
    const members = await getProjectMembers(Number(projectId));
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAvailableUsers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const projectId = req.params.projectId;
  const user = req.user;

  if (!projectId) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await ensureProjectMemberManagementAccess(Number(projectId), user);
    const users = await getProjectMemberCandidates(Number(projectId));
    res.status(200).json(users);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Project not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (
        error.message === "You can only manage members of your own projects"
      ) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.params.projectId;
  const userId = req.body?.userId;
  const user = req.user;

  if (!projectId || !userId) {
    res.status(400).json({ error: "Invalid project ID or user ID" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await ensureProjectMemberManagementAccess(Number(projectId), user);
    const newMember = await addProjectMember(Number(projectId), Number(userId));
    res.status(201).json(newMember);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Project not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (
        error.message === "You can only manage members of your own projects"
      ) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message === "User is already a member of this project") {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const projectId = req.params.projectId;
  const userId = req.body?.id;
  const user = req.user;

  if (!projectId || !userId) {
    res.status(400).json({ error: "Invalid project ID or user ID" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await ensureProjectMemberManagementAccess(Number(projectId), user);
    const removedMember = await removeProjectMember(
      Number(projectId),
      Number(userId),
    );
    res.status(200).json(removedMember);
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      res.status(404).json({ error: error.message });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "You can only manage members of your own projects"
    ) {
      res.status(403).json({ error: error.message });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "User is not a member of this project"
    ) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
