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
}

const projectSelect = {
  id: true,
  title: true,
  description: true,
  ownerId: true,
  createdAt: true,
  owner: {
    select: { name: true },
  },
} as const;

export const getProjects = async (
  search: string,
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
    select: projectSelect,
  });

  return projects;
};

export const getProjectById = async (
  projectId: number,
): Promise<ProjectOutput | null> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: projectSelect,
  });

  return project;
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
        select: projectSelect,
      });

      await tx.projectMember.create({
        data: { projectId: newProject.id, memberId: ownerId },
      });

      return newProject;
    });

    return project;
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

    await tx.project.delete({ where: { id: projectId } });
  });
};
