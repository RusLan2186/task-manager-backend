import prisma from "../lib/prisma";
import { RegisterOutput } from "./auth.service";

export const getUsers = async (search: string): Promise<RegisterOutput[]> => {
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return users;
};
