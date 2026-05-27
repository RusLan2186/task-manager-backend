import { Request, Response } from "express";
import {
  createTask,
  deleteTask,
  getTasksByProject,
  updateTask,
} from "../services/task.service";
import {
  taskCreateSchema,
  taskUpdateSchema,
  projectIdParamSchema,
  taskIdWithProjectIdParamSchema,
} from "../validators/task.validator";
import { Priority } from "@prisma/client";

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const getAllTasks = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  const priorityQuery = req.query.priority;
  const priorityValue =
    typeof priorityQuery === "string" ? priorityQuery.toUpperCase() : undefined;
  const priority =
    priorityValue && priorityValue !== "ALL"
      ? (priorityValue as Priority)
      : undefined;
  const assigneeId = req.query.assigneeId
    ? Number(req.query.assigneeId)
    : undefined;
  const sort = req.query.sort as "asc" | "desc" | undefined;
  if (priorityValue && priorityValue !== "ALL") {
    const validPriorities = Object.values(Priority);
    if (!validPriorities.includes(priority as Priority)) {
      res.status(400).json({
        error: "Priority must be one of: LOW, MEDIUM, HIGH, all",
      });
      return;
    }
  }

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
    const search = req.query.search as string;
    const tasks = await getTasksByProject(
      parsedParams.data.projectId,
      userId,
      priority,
      assigneeId,
      search,
      sort,
    );
    res.status(200).json(tasks);
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      res.status(404).json({ error: error.message });
      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "You can only access tasks from projects where you are a member"
    ) {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal Server Error" });
    console.error(error);
  }
};

export const createNewTask = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

  const parsedBody = taskCreateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.flatten() });
    return;
  }

  try {
    const newTask = await createTask(
      {
        ...parsedBody.data,
        projectId: parsedParams.data.projectId,
        assigneeId: parsedBody.data.assigneeId ?? null,
      },
      userId,
    );
    res.status(201).json(newTask);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Project not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (
        error.message ===
        "You can only access tasks from projects where you are a member"
      ) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message === "Assignee must be a member of this project") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (
        error.message === "Task with this title already exists in this project"
      ) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === "Task title is required") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "Project or assignee not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const taskUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const parsedParams = taskIdWithProjectIdParamSchema.safeParse(req.params);

  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  const parsedBody = taskUpdateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.flatten() });
    return;
  }

  try {
    const updatedTask = await updateTask(
      {
        id: parsedParams.data.id,
        ...parsedBody.data,
      },
      userId,
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Task with this title already exists in this project"
      ) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === "Task does not exist in this project") {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      if (error.message === "Task title is required") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "Project or assignee not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === "Assignee must be a member of this project") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (
        error.message ===
        "You can only access tasks from projects where you are a member"
      ) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message === "You can only edit tasks from your own projects") {
        res.status(403).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeTask = async (req: AuthenticatedRequest, res: Response) => {
  const parsedParams = taskIdWithProjectIdParamSchema.safeParse(req.params);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  try {
    await deleteTask(parsedParams.data.projectId, parsedParams.data.id, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task does not exist in this project") {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      if (
        error.message === "You can only delete tasks from your own projects"
      ) {
        res.status(403).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
