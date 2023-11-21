import {FastifyInstance, FastifyPluginOptions} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";
import {authorisationBody, authorisationResponse, logoutResponse, refreshResponse} from "../../schemas/user.schema";
import userController from "../../controllers/user.controller";
import {authMiddlewareRequest} from "../../middleware/auth.middleware";

export default async function callback(fastify: FastifyInstance, opts: FastifyPluginOptions, next: (err?: Error | undefined) => void) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/auth", {schema: {body: authorisationBody, response: authorisationResponse}}, userController.authorisation);
  fastify.withTypeProvider<ZodTypeProvider>().get("/testAuth", {preHandler: authMiddlewareRequest.bind(null, [])}, (request, reply) => reply.status(200).send({}));
  fastify.withTypeProvider<ZodTypeProvider>().post("/refresh", {schema: {response: refreshResponse}}, userController.refresh);
  fastify.withTypeProvider<ZodTypeProvider>().post("/logout", {schema: {response: logoutResponse}}, userController.logout);
  next();
}

export const autoPrefix = "/users";
