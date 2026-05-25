import { getUsers } from "../services/user.service";
import { Response } from "express";
import { AuthenticatedRequest } from "./auth.controller";

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const search = req.query.search as string;
    const users = await getUsers(search);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
