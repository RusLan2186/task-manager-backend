import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Passed email is not valid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export type Register = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Passed email is not valid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export type Login = z.infer<typeof loginSchema>;
