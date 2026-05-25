import { Priority, Status } from "@prisma/client";
import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" }),
  description: z
    .string()
    .trim()
    .min(5, { message: "Description must be at least 5 characters long" }),
  priority: z.nativeEnum(Priority, {
    message: "Priority must be one of: LOW, MEDIUM, HIGH",
  }),
  status: z
    .nativeEnum(Status, {
      message: "Status must be one of: TODO, IN_PROGRESS, DONE",
    })
    .optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
});

export const taskUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { message: "Title must be at least 3 characters long" })
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, { message: "Description must be at least 5 characters long" })
      .optional(),
    priority: z
      .nativeEnum(Priority, {
        message: "Priority must be one of: LOW, MEDIUM, HIGH",
      })
      .optional(),
    status: z
      .nativeEnum(Status, {
        message: "Status must be one of: TODO, IN_PROGRESS, DONE",
      })
      .optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.priority !== undefined ||
      value.status !== undefined ||
      value.assigneeId !== undefined,
    { message: "At least one field must be provided for update" },
  );

export const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const taskIdWithProjectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const taskIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
export type TaskIdParams = z.infer<typeof taskIdParamSchema>;
