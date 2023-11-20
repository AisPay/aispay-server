import {FastifyInstance, FastifyPluginOptions} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";
import {authBearerHeader, authorisationBody, authorisationResponse, logoutResponse, refreshResponse} from "../../schemas/user.schema";
import userController from "../../controllers/user.controller";

export default async function callback(fastify: FastifyInstance, opts: FastifyPluginOptions, next: (err?: Error | undefined) => void) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/auth", {schema: {body: authorisationBody, response: authorisationResponse}}, userController.authorisation);
  fastify.withTypeProvider<ZodTypeProvider>().get("/refresh", {schema: {headers: authBearerHeader, response: refreshResponse}}, userController.refresh);
  fastify.withTypeProvider<ZodTypeProvider>().get("/logout", {schema: {headers: authBearerHeader, response: logoutResponse}}, userController.logout);
  next();
}

export const autoPrefix = "/users";
