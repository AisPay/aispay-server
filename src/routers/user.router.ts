import {FastifyPluginCallback} from "fastify";
import authMiddleware from "../middlewares/auth.middleware";

const callback: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", {preHandler: authMiddleware}, async (request, reply) => {
    reply.status(200).send(["test1", "test2", "test3"]);
  });

  done();
};

export default callback;
