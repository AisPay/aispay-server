import {FastifyReply, FastifyRequest, HookHandlerDoneFunction} from "fastify";
import ApiError from "../utils/apiError";
import {WebSocket} from "ws";
import tokenService from "../services/token.service";
import {RoleModel} from "../models/role.model";
import {UserModel} from "../models/user.model";

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
  let socketId = (<any>socket)["id"] as number;
  let token = await tokenService.findTokens({socketId});

  let role: Awaited<ReturnType<typeof RoleModel.findOne>>;
  if (!token) {
    const {accessToken} = message;
    if (!accessToken) throw ApiError.UnathorizedError();

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) throw ApiError.UnathorizedError();
    role = await RoleModel.findOne({id: userData.role.id});
  } else {
    let user = await UserModel.findOne({id: token.userId});
    if (!user) throw ApiError.UnathorizedError();
    role = await RoleModel.findOne({id: user.roleId});
  }

  if (functions.length > 0) {
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
