import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../lib/email";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterOutput {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export const register = async (
  input: RegisterInput,
): Promise<RegisterOutput> => {
  const { name, email, password } = input;

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new Error("User with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode, verificationCodeExpiry },
  });

  await sendVerificationEmail(email, verificationCode.toString());

  return user;
};

interface LoginInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS_ERROR = "Invalid credentials";

export const login = async (input: LoginInput) => {
  const { email, password } = input;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  if (!user.emailVerified) {
    throw new Error("Email not verified");
  }

  const { password: userPassword, ...userWithoutPassword } = user;

  if (!userPassword) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  const isPasswordValid = await bcrypt.compare(password, userPassword);

  if (!isPasswordValid) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: 60 * 60 },
  );

  return { user: userWithoutPassword, token };
};

export const verifyEmail = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.verificationCode !== code) {
    throw new Error("Invalid verification code");
  }

  if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
    throw new Error("Verification code has expired");
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    },
  });
};
