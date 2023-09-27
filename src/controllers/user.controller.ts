import {FastifyReply, FastifyRequest} from "fastify";
import userService from "../services/user.service";
import Validator from "../exceptions/validator.exception";

const authValidator = new Validator({
  login: {type: "string", required: true},
  password: {type: "string", required: true},
});

class UserController {
  async login(req: FastifyRequest, reply: FastifyReply) {
    const {login, password} = authValidator.valid(req.body);

    const userData = await userService.loginUser(login, password);
    reply.cookie("refreshToken", userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});

    return reply.send(JSON.stringify(userData));
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    let refreshToken = req.cookies.refreshToken;
    if (refreshToken) userService.logout(refreshToken);

    return reply.status(200).send();
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    let refreshToken = req.cookies.refreshToken;
    let data = await userService.refresh(refreshToken);

    return reply.status(200).send(data);
  }
}

export default new UserController();
