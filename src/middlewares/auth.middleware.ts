import {FastifyReply, FastifyRequest, HookHandlerDoneFunction} from "fastify";
import ApiError from "../exceptions/apiError.exception";
import tokenService from "../services/token.service";

export default function (req: FastifyRequest, _: FastifyReply, next: HookHandlerDoneFunction) {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) return next(ApiError.UnathorizedError());

  const accessToken = authorizationHeader.split(" ")[1];
  if (!accessToken) return next(ApiError.UnathorizedError());

  const userData = tokenService.validateAccessToken(accessToken);
  if (!userData) return next(ApiError.UnathorizedError());
  (<any>req).user = userData;

  next();
}
