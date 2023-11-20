import {z} from "zod";

export const errorResponse = {
  400: z.object({
    status: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
  500: z.object({
    status: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
  403: z.object({
    status: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
};
