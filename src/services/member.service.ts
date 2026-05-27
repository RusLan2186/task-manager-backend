import { User } from "@prisma/client";
import prisma from "../lib/prisma";

type AuthUser = {
  id: number;
  role: string;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const getProjectMembers = async (projectId: number) => {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
    },

    select: {
      id: true,
      memberId: true,
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return members;
};

export const getProjectMemberCandidates = async (projectId: number) => {
  const projectMembers = await prisma.projectMember.findMany({
    where: {
      projectId,
    },
    select: {
      memberId: true,
    },
  });

  const excludedMemberIds = projectMembers.map(({ memberId }) => memberId);

  return prisma.user.findMany({
    where: {
      id: {
        notIn: excludedMemberIds,
      },
    },
    select: userSelect,
  });
};

export const ensureProjectMemberManagementAccess = async (
  projectId: number,
  user: AuthUser,
) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ownerId: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerId !== user.id && user.role !== "ADMIN") {
    throw new Error("You can only manage members of your own projects");
  }

  return project;
};

export const addProjectMember = async (projectId: number, userId: number) => {
  const exists = await prisma.projectMember.findUnique({
    where: {
      projectId_memberId: { projectId, memberId: userId },
    },
  });

  if (exists) {
    throw new Error("User is already a member of this project");
  }
  const newMember = await prisma.projectMember.create({
    data: {
      projectId,
      memberId: userId,
    },
  });
  return newMember;
};

export const removeProjectMember = async (
  projectId: number,
  userId: number,
) => {
  const exists = await prisma.projectMember.findUnique({
    where: {
      projectId_memberId: { projectId, memberId: userId },
    },
  });

  if (!exists) {
    throw new Error("User is not a member of this project");
  }

  const removedMember = await prisma.projectMember.delete({
    where: {
      projectId_memberId: { projectId, memberId: userId },
    },
  });

  return removedMember;
};
