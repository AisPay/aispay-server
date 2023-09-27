import fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import config from "config";
import authRouter from "./routers/auth.router";
import userRouter from "./routers/user.router";
import errorMiddleware from "./middlewares/error.middleware";
import {timer} from "./packages/timer.package";
import tokenService from "./services/token.service";

const logger = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  },
};

const app = fastify({logger});

app.register(cors);
app.register(cookie);
app.register(authRouter, {prefix: "users"});
app.register(userRouter, {prefix: "users"});
app.setErrorHandler(errorMiddleware);

const PORT = config.get<number>("PORT");

const start = async () => {
  try {
    app.listen({port: PORT});
    timer(async () => {
      tokenService.clearRefreshTokenDbTime();
    }, 1 * 60 * 60 * 1000);
  } catch (error: any) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
