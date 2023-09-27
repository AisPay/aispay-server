import {FastifyPluginCallback} from "fastify";
import userController from "../controllers/user.controller";

const callback: FastifyPluginCallback = (fastify, options, done) => {
  fastify.post("/auth", userController.login);
  fastify.post("/logout", userController.logout);
  fastify.get("/refresh", userController.refresh);
  done();
};

export default callback;
