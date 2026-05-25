import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CommentInput {
  text: string;
  taskId: number;
  authorId: number;
}

export interface CommentOutput extends CommentInput {
  id: number;
  createdAt: Date;
}

const newComment = {
  id: true,
  text: true,
  taskId: true,
  authorId: true,
  createdAt: true,
} as const;

export const getCommentsByTask = async (
  taskId: number,
): Promise<CommentOutput[]> => {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    select: newComment,
  });

  return comments;
};

export const createComment = async (
  input: CommentInput,
): Promise<CommentOutput> => {
  const { text, taskId, authorId } = input;

  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        taskId,
        authorId,
      },
      select: newComment,
    });

    return comment;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new Error("Task or author not found");
      }
    }

    throw error;
  }
};

export const deleteComment = async (id: number, authorId: number) => {
  const comment = await prisma.comment.findUnique({
    where: {
      id,
    },
    select: { id: true, authorId: true },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.authorId !== authorId) {
    throw new Error("You can only delete your own comments");
  }
  try {
    await prisma.comment.delete({
      where: {
        id: Number(id),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("Comment not found");
      }
    }

    throw error;
  }
};
