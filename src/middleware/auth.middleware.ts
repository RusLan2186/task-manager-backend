import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);

    req.user = verified as AuthUser;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authorize = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
};
