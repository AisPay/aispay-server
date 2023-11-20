import {FastifyInstance, FastifyPluginOptions} from "fastify";
import socket from "../../utils/socket";
import ApiError from "../../utils/apiError";
import {authMiddlewareSocket} from "../../middleware/auth.middleware";
import userController from "../../controllers/user.controller";

export default async function callback(fastify: FastifyInstance, opts: FastifyPluginOptions, next: (err?: Error | undefined) => void) {
  socket.onStart(async (socket) => {
    (<any>socket)["id"] = Date.now();
  });
  socket.onEnd(async (socket) => {
    userController.logoutSocket(socket);
  });

  fastify.get("/", {websocket: true}, async (connection, request) => {
    connection.setEncoding("utf8");
    await socket.initial(connection.socket);
    connection.socket.on("message", async (message) => {
      try {
        let data = JSON.parse(message.toString("utf8"));
        if (!data["path"]) throw ApiError.BadRequest("Нету ключа path");
        if (!data["nonce"]) throw ApiError.BadRequest("Нету ключа nonce");
        if (!data["type"]) throw ApiError.BadRequest("Нету ключа type");
        if (!data["accessToken"]) throw ApiError.BadRequest("Нету ключа accessToken");
        if (data["type"] === "auth") {
          await authMiddlewareSocket([], connection.socket, data);
          return userController.authorisationSocket(connection.socket, data);
        } else if (data["type"] === "logout") return userController.logoutSocket(connection.socket);

        await socket.message(data["path"], data["type"], data, connection.socket);
      } catch (error: any) {
        if (error instanceof ApiError) connection.socket.send(JSON.stringify({type: "error", status: error.statusCode, message: error.message}));
        else connection.socket.send(JSON.stringify({type: "error", status: 500, message: "Не удалось обработать сообщение"}));
      }
    });

    connection.socket.on("close", async () => {
      await socket.ends(connection.socket);
    });
  });
  next();
}

export const autoPrefix = "/socket";
