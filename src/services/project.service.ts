import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

interface ProjectInput {
  title: string;
  description: string;
  ownerId: number;
}

interface ProjectOutput {
  id: number;
  title: string;
  description: string;
  ownerId: number;
  createdAt: Date;
  canAccessTasks: boolean;
}

const getProjectSelect = (userId?: number) => ({
  id: true,
  title: true,
  description: true,
  ownerId: true,
  createdAt: true,
  members: userId
    ? {
        where: {
          memberId: userId,
        },
        select: {
          id: true,
        },
      }
    : false,
  owner: {
    select: { name: true },
  },
});

export const getProjects = async (
  search: string,
  userId: number,
  sort?: "asc" | "desc",
): Promise<ProjectOutput[]> => {
  const projects = await prisma.project.findMany({
    where: search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: sort ?? "desc" },
    select: getProjectSelect(userId),
  });

  return projects.map(({ members, ...project }) => ({
    ...project,
    canAccessTasks: project.ownerId === userId || (members?.length ?? 0) > 0,
  }));
};

export const getProjectById = async (
  projectId: number,
  userId: number,
): Promise<ProjectOutput | null> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: getProjectSelect(userId),
  });

  if (!project) {
    return null;
  }

  const { members, ...projectData } = project;
  return {
    ...projectData,
    canAccessTasks:
      projectData.ownerId === userId || (members?.length ?? 0) > 0,
  };
};

export const createProject = async (
  input: ProjectInput,
): Promise<ProjectOutput> => {
  const { description, ownerId } = input;
  const title = input.title.trim();

  if (!title) {
    throw new Error("Project title is required");
  }

  const projectExists = await prisma.project.findFirst({
    where: {
      ownerId,
      title: {
        equals: title,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (projectExists) {
    throw new Error("Project with this title already exists");
  }

  try {
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: { title, description, ownerId },
        select: getProjectSelect(ownerId),
      });

      await tx.projectMember.create({
        data: { projectId: newProject.id, memberId: ownerId },
      });

      return newProject;
    });

    const { members, ...projectData } = project;
    return {
      ...projectData,
      canAccessTasks:
        projectData.ownerId === ownerId || (members?.length ?? 0) > 0,
    };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Project with this title already exists");
      }

      if (error.code === "P2003") {
        throw new Error("Project owner not found");
      }
    }

    throw error;
  }
};

export const deleteProject = async (projectId: number, ownerId: number) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerId !== ownerId) {
    throw new Error("You can only delete your own projects");
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({
      where: {
        task: {
          projectId,
        },
      },
    });

    await tx.task.deleteMany({
      where: { projectId },
    });

    await tx.projectMember.deleteMany({
      where: { projectId },
    });

    await tx.project.delete({ where: { id: projectId } });
  });
};
