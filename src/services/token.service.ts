import jwt from "jsonwebtoken";
import {env} from "../config/env";
import {TokenModel} from "../models/token.model";
import UserAuthDto from "../dtos/User.dto";

type ObtainValue<T> = {
  [Prop in keyof T]: T[Prop];
};

class TokenService {
  generateTokens(payload: string) {
    const accessToken = jwt.sign(JSON.parse(payload), env.ACCESS_SECRET_KEY, {expiresIn: 300000});
    const refreshToken = jwt.sign(JSON.parse(payload), env.REFRESH_SECRET_KEY, {expiresIn: 2592000000});

    return {accessToken, refreshToken};
  }

  validateAccessToken(token: any) {
    try {
      const userData = jwt.verify(token, env.ACCESS_SECRET_KEY) as Object;
      return userData as ObtainValue<UserAuthDto>;
    } catch (error: any) {
      return null;
    }
  }

  validateRefreshToken(token: any) {
    try {
      const userData = jwt.verify(token, env.REFRESH_SECRET_KEY) as Object;
      return userData as ObtainValue<UserAuthDto>;
    } catch (error: any) {
      return null;
    }
  }

  async saveToken(userId: number, tokens: {accessToken: string; refreshToken: string}, id?: number) {
    if (!id) return await TokenModel.add({userId, ...tokens});

    await TokenModel.update({userId, ...tokens}, id);

    return await TokenModel.findOne({id});
  }

  async removeToken(id: number) {
    let token = await TokenModel.findOne({id});
    if (!token) return null;

    await TokenModel.remove(id);

    return token;
  }

  async addSocketToken(socketId: number, id: number) {
    let token = await TokenModel.findOne({id});
    if (!token) return null;

    await TokenModel.update({sockets: [...token.sockets, socketId]}, id);

    return (await TokenModel.findOne({id})) ?? null;
  }

  async removeSocketToken(socketId: number, id: number) {
    let token = await TokenModel.findOne({id});
    if (!token) return null;

    await TokenModel.update({sockets: token.sockets.filter((elId) => elId !== socketId)}, id);

    return (await TokenModel.findOne({id})) ?? null;
  }

  async findTokens(search: {accessToken?: string; refreshToken?: string; socketId?: number}) {
    let searchLocal = [];
    if (search.accessToken) searchLocal.push({key: "accessToken", value: search.accessToken});
    if (search.refreshToken) searchLocal.push({key: "refreshToken", value: search.refreshToken});
    if (search.socketId) searchLocal.push({key: "sockets", value: [search.socketId], force: true});

    let token = await TokenModel.findOne({search: <any>searchLocal});
    if (!token) return null;

    return token;
  }
}

export default new TokenService();
