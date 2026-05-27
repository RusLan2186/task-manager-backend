import { Prisma, Priority, Status } from "@prisma/client";
import prisma from "../lib/prisma";

export interface TaskInput {
  title: string;
  description: string;
  projectId: number;
  priority: Priority;
  assigneeId: number | null;
  status?: Status;
}

type TaskUpdateInput = Partial<TaskInput> & { id: number };

interface TaskOutput extends TaskInput {
  id: number;
  createdAt: Date;
}

interface TaskListOutput extends TaskOutput {
  canEdit: boolean;
}

const ensureProjectTaskAccess = async (projectId: number, userId: number) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ownerId: true,
      members: {
        where: {
          memberId: userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const isOwner = project.ownerId === userId;
  const isMember = project.members.length > 0;

  if (!isOwner && !isMember) {
    throw new Error(
      "You can only access tasks from projects where you are a member",
    );
  }

  return { isOwner };
};

const ensureAssigneeIsProjectMember = async (
  projectId: number,
  assigneeId: number,
) => {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_memberId: {
        projectId,
        memberId: assigneeId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new Error("Assignee must be a member of this project");
  }
};

const taskSelect = {
  id: true,
  title: true,
  description: true,
  projectId: true,
  priority: true,
  status: true,
  assigneeId: true,
  createdAt: true,
  assignee: {
    select: { name: true },
  },
} as const;

export const getTasksByProject = async (
  projectId: number,
  userId: number,
  priority?: Priority,
  assigneeId?: number,
  search?: string,
  sort?: "asc" | "desc",
): Promise<TaskListOutput[]> => {
  await ensureProjectTaskAccess(projectId, userId);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: sort ?? "desc" },
    select: {
      ...taskSelect,
      project: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  return tasks.map(({ project, ...task }) => ({
    ...task,
    canEdit: project.ownerId === userId,
  }));
};

export const createTask = async (
  input: TaskInput,
  userId: number,
): Promise<TaskOutput> => {
  const { description, projectId, priority, assigneeId } = input;
  const title = input.title.trim();

  if (!title) {
    throw new Error("Task title is required");
  }

  await ensureProjectTaskAccess(projectId, userId);

  if (assigneeId !== null) {
    await ensureAssigneeIsProjectMember(projectId, assigneeId);
  }

  const taskExists = await prisma.task.findFirst({
    where: {
      projectId,
      title: {
        equals: title,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (taskExists) {
    throw new Error("Task with this title already exists in this project");
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority,
        assigneeId,
      },
      select: taskSelect,
    });

    return task;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Task with this title already exists in this project");
      }

      if (error.code === "P2003") {
        throw new Error("Project or assignee not found");
      }
    }

    throw error;
  }
};

export const updateTask = async (
  input: TaskUpdateInput,
  userId: number,
): Promise<TaskOutput> => {
  const { id, title, description, priority, status, assigneeId } = input;

  const taskExists = await prisma.task.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      status: true,
      assigneeId: true,
      project: {
        select: {
          ownerId: true,
          id: true,
          members: {
            where: {
              memberId: userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!taskExists) {
    throw new Error("Task does not exist in this project");
  }

  const isOwner = taskExists.project.ownerId === userId;
  const isMember = taskExists.project.members.length > 0;

  if (!isOwner && !isMember) {
    throw new Error(
      "You can only access tasks from projects where you are a member",
    );
  }

  const changesRestrictedFields =
    (title !== undefined && title !== taskExists.title) ||
    (description !== undefined && description !== taskExists.description) ||
    (priority !== undefined && priority !== taskExists.priority);

  if (!isOwner && changesRestrictedFields) {
    throw new Error("You can only edit tasks from your own projects");
  }

  if (assigneeId !== undefined && assigneeId !== null) {
    await ensureAssigneeIsProjectMember(taskExists.project.id, assigneeId);
  }

  try {
    const newTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        priority,
        status,
        assigneeId,
      },

      select: taskSelect,
    });

    return newTask;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Task with this title already exists in this project");
      }

      if (error.code === "P2003") {
        throw new Error("Project or assignee not found");
      }
    }

    throw error;
  }
};

export const deleteTask = async (
  projectId: number,
  id: number,
  userId: number,
) => {
  await ensureProjectTaskAccess(projectId, userId);

  const taskExists = await prisma.task.findFirst({
    where: {
      id,
      projectId,
    },
    select: { project: true },
  });

  if (!taskExists) {
    throw new Error("Task does not exist in this project");
  }

  if (taskExists.project.ownerId !== userId) {
    throw new Error("You can only delete tasks from your own projects");
  }

  try {
    await prisma.$transaction([
      prisma.comment.deleteMany({
        where: {
          taskId: id,
        },
      }),
      prisma.task.delete({
        where: {
          id: Number(id),
        },
      }),
    ]);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("Task not found");
      }
    }

    throw error;
  }
};
