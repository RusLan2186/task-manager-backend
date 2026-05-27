import { Request, Response } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
} from "../services/project.service";
import {
  projectCreateSchema,
  projectIdParamSchema,
} from "../validators/project.validator";

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const getAllProjects = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const search = req.query.search as string;
    const sort = req.query.sort as "asc" | "desc" | undefined;
    const projects = await getProjects(search, userId, sort);

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneProject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsedParams = projectIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  try {
    const project = await getProjectById(parsedParams.data.projectId, userId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createNewProject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsedBody = projectCreateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.flatten() });
    return;
  }

  try {
    const newProject = await createProject({
      ...parsedBody.data,
      ownerId: userId,
    });
    res.status(201).json(newProject);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Project with this title already exists"
    ) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeProject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsedParams = projectIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  try {
    await deleteProject(parsedParams.data.projectId, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Project not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === "You can only delete your own projects") {
        res.status(403).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
