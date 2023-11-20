import {z} from "zod";

export const errorResponse = {
  400: z.object({
    statusCode: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
  500: z.object({
    statusCode: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
  403: z.object({
    statusCode: z.number(),
    code: z.string().optional(),
    message: z.string(),
  }),
};
