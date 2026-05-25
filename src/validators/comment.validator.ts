import { z } from "zod";

export const commentCreateSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { message: "Comment text cannot be empty" })
    .max(500, { message: "Comment text must not exceed 500 characters" }),
});

export const taskIdParamSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const commentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CommentCreate = z.infer<typeof commentCreateSchema>;
export type TaskIdParams = z.infer<typeof taskIdParamSchema>;
export type CommentIdParams = z.infer<typeof commentIdParamSchema>;
