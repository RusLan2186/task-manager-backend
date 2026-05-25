import { Request, Response } from "express";
import { register, login, verifyEmail } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import type { Login, Register } from "../validators/auth.validator";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

type AuthUser = {
  id: number;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

type RegisterRequestBody = Partial<Register>;

type LoginRequestBody = Partial<Login>;

export const registerUser = async (
  req: Request<unknown, unknown, RegisterRequestBody>,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const parsedData = registerSchema.safeParse({ name, email, password });
    if (!parsedData.success) {
      res.status(400).json({ error: parsedData.error.flatten() });
      return;
    }

    const user = await register(parsedData.data);
    res.status(201).json(user);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "User with this email already exists"
    ) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  const INVALID_CREDENTIALS_ERROR = "Invalid credentials";
  const JWT_SECRET_NOT_SET_ERROR = "JWT_SECRET is not set";

  try {
    const parsedData = loginSchema.safeParse({ email, password });
    if (!parsedData.success) {
      res.status(400).json({ error: parsedData.error.flatten() });
      return;
    }
    const user = await login(parsedData.data);

    res.cookie("token", user.token, { httpOnly: true });
    res.status(200).json(user.user);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR) {
      res.status(401).json({ error: error.message });
      return;
    }

    if (error instanceof Error && error.message === JWT_SECRET_NOT_SET_ERROR) {
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    if (error instanceof Error && error.message === "Email not verified") {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json(user);
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export const oauthCallback = (req: Request, res: Response): void => {
  const user = req.user as AuthUser;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );

  res.cookie("token", token, { httpOnly: true });
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  try {
    await verifyEmail(email, code);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === "Invalid verification code") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "Verification code has expired") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
