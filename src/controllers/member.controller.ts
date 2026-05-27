import { Request, Response } from "express";
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
} from "../services/member.service";

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

export const addMember = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const userId = req.body?.userId;

  if (!projectId || !userId) {
    res.status(400).json({ error: "Invalid project ID or user ID" });
    return;
  }

  try {
    const newMember = await addProjectMember(Number(projectId), Number(userId));
    res.status(201).json(newMember);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User is already a member of this project") {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const userId = req.body?.id;

  if (!projectId || !userId) {
    res.status(400).json({ error: "Invalid project ID or user ID" });
    return;
  }

  try {
    const removedMember = await removeProjectMember(
      Number(projectId),
      Number(userId),
    );
    res.status(200).json(removedMember);
  } catch (error) {
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
