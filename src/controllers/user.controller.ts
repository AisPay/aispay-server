import {FastifyReply, FastifyRequest} from "fastify";
import {z} from "zod";
import {authorisationBody} from "../schemas/user.schema";
import userService from "../services/user.service";
import {WebSocket} from "ws";
import ApiError from "../utils/apiError";
import {logger} from "../utils/logger";

class UserController {
  async authorisation(request: FastifyRequest, reply: FastifyReply) {
    const {login, password} = request.body as z.infer<typeof authorisationBody>;

    const {body} = await userService.authorisation(login, password);

    reply.cookie("refreshToken", body.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});

    return reply.status(200).send(body);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    let refreshToken = request.cookies["refreshToken"];
    if (!refreshToken) return reply.status(200).send();

    await userService.logout(refreshToken);
    reply.clearCookie("refreshToken");

    return reply.status(200).send({});
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const accessToken = request.headers["authorization"]?.split(" ")[1];
    const refreshToken = request.cookies["refreshToken"] as string | undefined;

    const {body} = await userService.refresh(accessToken, refreshToken);

    reply.cookie("refreshToken", body.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});

    reply.status(200).send(body);
  }

  async authorisationSocket(socket: WebSocket, message: {accessToken: string}) {
    let id = (<any>socket)["id"];
    let result = await userService.authorisationSocket(message.accessToken, id);
    if (!result) throw ApiError.UnathorizedError();
  }

  async logoutSocket(socket: WebSocket) {
    let id = (<any>socket)["id"];
    await userService.logoutSocket(id);
  }
}

export default new UserController();
