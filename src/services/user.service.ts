import {UserModel} from "../models/user.model";
// import config from "config";
import {compareSync} from "bcrypt";
import tokenService from "./token.service";
import UserDto from "../dtos/User.dto";
import {TokenModel} from "../models/token.model";
import ApiError from "../exceptions/apiError.exception";

class UserService {
  async loginUser(login: string, password: string) {
    const user = await UserModel.findOne({search: [{key: "login", value: login}]});
    if (!user) throw ApiError.BadRequest(`Неверный логин или пароль`);

    let isCheckHash = compareSync(password, user.passwordHash);
    if (!isCheckHash) throw ApiError.BadRequest(`Неверный логин или пароль`);

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);

    return {...tokens, user: userDto};
  }

  async logout(refreshToken: string) {
    const token = tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) throw ApiError.UnathorizedError();
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      await tokenService.removeToken(refreshToken);
      throw ApiError.UnathorizedError();
    }

    const user = await UserModel.findOne({id: userData.id});
    if (!user) throw ApiError.UnathorizedError();

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens(userDto);
    await tokenService.saveToken(user.id, tokens.refreshToken);
    await tokenService.removeToken(refreshToken);

    return {...tokens, user: userDto};
  }
}

export default new UserService();
