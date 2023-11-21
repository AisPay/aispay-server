import {compareSync} from "bcrypt";
import {UserModel} from "../models/user.model";
import ApiError from "../utils/apiError";
import {RoleModel} from "../models/role.model";
import UserAuthDto from "../dtos/User.dto";
import tokenService from "./token.service";

class UserService {
  async remove(id: number) {
    let user = await UserModel.findOne({id});
    if (!user) return null;

    await UserModel.remove(id);

    return user;
  }

  async authorisation(login: string, password: string) {
    const user = await UserModel.findOne({search: [{key: "login", value: login}]});
    if (!user) throw ApiError.BadRequest(`Неверный логин или пароль`);

    let isCheckHash = compareSync(password, user.passwordHash);
    if (!isCheckHash) throw ApiError.BadRequest(`Неверный логин или пароль`);

    const role = await RoleModel.findOne({id: user.roleId});
    if (!role) throw ApiError.BadRequest(`Неверный логин или пароль`);

    const userDto = new UserAuthDto({...user, role});

    const tokens = tokenService.generateTokens(JSON.stringify(userDto));
    let tokenDb = await tokenService.saveToken(user.id, tokens);
    if (!tokenDb) throw new ApiError(500, "Не удалось сохранить токен");

    return {body: {...tokens, user: userDto}, tokenDb};
  }

  async logout(refreshToken: string) {
    let token = await tokenService.findTokens({refreshToken});
    if (!token) return null;

    await tokenService.removeToken(token.id);

    return token;
  }

  async refresh(accessToken?: string, refreshToken?: string) {
    if (!refreshToken) throw ApiError.UnathorizedError();

    const userData = tokenService.validateAccessToken(accessToken) ?? tokenService.validateRefreshToken(refreshToken);
    if (!userData) throw ApiError.UnathorizedError();

    const user = await UserModel.findOne({id: userData.id});
    if (!user) throw ApiError.UnathorizedError();

    const role = await RoleModel.findOne({id: user.roleId});
    if (!role) throw ApiError.UnathorizedError();

    const tokens = await tokenService.findTokens({accessToken, refreshToken});
    if (!tokens) throw ApiError.UnathorizedError();

    const userDto = new UserAuthDto({...user, role});
    const tokensNew = tokenService.generateTokens(JSON.stringify(userDto));
    let tokenDb = await tokenService.saveToken(user.id, tokensNew, tokens.id);
    if (!tokenDb) throw new ApiError(500, "Не удалось сохранить токен");

    return {body: {...tokensNew, user: userDto}, tokenDb};
  }

  async authorisationSocket(accessToken: string, id?: number) {
    if (!id) return null;

    let token = await tokenService.findTokens({accessToken});
    if (!token) return null;

    return await tokenService.addSocketToken(id, token.id);
  }

  async logoutSocket(id?: number) {
    if (!id) return null;

    let token = await tokenService.findTokens({socketId: id});
    if (!token) return null;

    return await tokenService.removeSocketToken(id, token.id);
  }
}

export default new UserService();
