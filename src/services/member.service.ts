import { Prisma, Priority, Status, User } from "@prisma/client";
import prisma from "../lib/prisma";

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


export const removeProjectMember = async (projectId: number, userId: number) => {
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