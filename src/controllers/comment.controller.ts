import { Request, Response } from "express";
import {
  CommentInput,
  createComment,
  deleteComment,
  getCommentsByTask,
} from "../services/comment.service";
import {
  commentCreateSchema,
  taskIdParamSchema,
  commentIdParamSchema,
} from "../validators/comment.validator";

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const getAllComments = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const parsedParams = taskIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  try {
    const comments = await getCommentsByTask(parsedParams.data.taskId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createNewComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const parsedParams = taskIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  const parsedBody = commentCreateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.flatten() });
    return;
  }

  const authorId = req.user?.id;
  if (!authorId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const newComment = await createComment({
      text: parsedBody.data.text,
      authorId,
      taskId: parsedParams.data.taskId,
    });
    res.status(201).json(newComment);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Task or author not found" ||
        error.message === "Task or user not found"
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeComment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const parsedParams = commentIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.flatten() });
    return;
  }

  const authorId = req.user?.id;
  if (!authorId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await deleteComment(parsedParams.data.id, authorId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Comment not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === "You can only delete your own comments") {
        res.status(403).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
