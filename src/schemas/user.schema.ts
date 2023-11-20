import {z} from "zod";
import {errorResponse} from "./error.schema";

export const authorisationBody = z.object({
  login: z.string(),
  password: z.string(),
});

export const authorisationResponse = {
  200: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.number(),
      login: z.string(),
      role: z.object({
        id: z.number(),
        name: z.string(),
        functions: z.string().array(),
      }),
    }),
  }),

  ...errorResponse,
};

export const logoutResponse = {
  200: z.object({}),
  ...errorResponse,
};

export const refreshResponse = {
  200: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.number(),
      login: z.string(),
      role: z.object({
        id: z.number(),
        name: z.string(),
        functions: z.string().array(),
      }),
    }),
  }),

  ...errorResponse,
};
