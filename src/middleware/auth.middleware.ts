import {FastifyReply, FastifyRequest, HookHandlerDoneFunction} from "fastify";
import ApiError from "../utils/apiError";
import {WebSocket} from "ws";
import tokenService from "../services/token.service";
import {RoleModel} from "../models/role.model";

export async function authMiddlewareRequest(functions: Array<string>, req: FastifyRequest, _: FastifyReply, next: HookHandlerDoneFunction) {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) return next(ApiError.UnathorizedError());

  const accessToken = authorizationHeader.split(" ")[1];
  if (!accessToken) return next(ApiError.UnathorizedError());

  const userData = tokenService.validateAccessToken(accessToken);
  if (!userData) return next(ApiError.UnathorizedError());

  if (functions.length > 0) {
    let role = await RoleModel.findOne({id: userData.role.id});
    if (!role) return next(ApiError.UnathorizedError());
    let isCheck = true;
    for (let indexFunction = 0; indexFunction < functions.length; indexFunction++) {
      const functionName = functions[indexFunction];
      if (!role.functions.includes(functionName as any)) {
        isCheck = false;
        break;
      }
    }
    if (!isCheck) return next(ApiError.UnathorizedError());
  }

  next();
}
export async function authMiddlewareSocket(functions: Array<string>, socket: WebSocket, message: any) {
  const {accessToken} = message;
  if (!accessToken) throw ApiError.UnathorizedError();

  const userData = tokenService.validateAccessToken(accessToken);
  if (!userData) throw ApiError.UnathorizedError();

  if (functions.length > 0) {
    let role = await RoleModel.findOne({id: userData.role.id});
    if (!role) throw ApiError.UnathorizedError();
    let isCheck = true;
    for (let indexFunction = 0; indexFunction < functions.length; indexFunction++) {
      const functionName = functions[indexFunction];
      if (!role.functions.includes(functionName as any)) {
        isCheck = false;
        break;
      }
    }
    if (!isCheck) throw ApiError.UnathorizedError();
  }
}
