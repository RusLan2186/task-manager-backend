import { z } from "zod";

export const projectCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" }),
  description: z
    .string()
    .trim()
    .min(5, { message: "Description must be at least 5 characters long" }),
});

export const projectUpdateSchema = z
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
  })
  .refine(
    (value) => value.title !== undefined || value.description !== undefined,
    { message: "At least one field must be provided for update" },
  );

export const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
