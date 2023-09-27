import jwt from "jsonwebtoken";
import config from "config";
import {TokenModel} from "../models/token.model";

const accessSecretKey = config.get<string>("JWT_ACCESS_SECRET_KEY");
const refreshSecretKey = config.get<string>("JWT_REFRESH_SECRET_KEY");

class TokenService {
  generateTokens(payload: any) {
    const accessToken = jwt.sign(payload, accessSecretKey, {expiresIn: "5m"});
    const refreshToken = jwt.sign(payload, refreshSecretKey, {expiresIn: "30d"});
    return {accessToken, refreshToken};
  }
  async saveToken(userId: number, refreshToken: string) {
    const token = await TokenModel.add({userId, refreshToken});
    return token;
  }

  async removeToken(refreshToken: string) {
    const tokenData = await TokenModel.findOne({search: [{key: "refreshToken", value: refreshToken}]});
    if (tokenData) await TokenModel.remove(tokenData.id);
    return tokenData;
  }

  async findToken(refreshToken: string) {
    const tokenData = await TokenModel.findOne({search: [{key: "refreshToken", value: refreshToken}]});
    return tokenData;
  }

  validateAccessToken(token: any) {
    try {
      const userData = jwt.verify(token, accessSecretKey) as string;
      return JSON.parse(userData);
    } catch (error: any) {
      return null;
    }
  }

  validateRefreshToken(token: any) {
    try {
      const userData = jwt.verify(token, refreshSecretKey) as string;
      return JSON.parse(userData);
    } catch (error: any) {
      return null;
    }
  }

  async clearRefreshTokenDbTime() {
    let tokens = await TokenModel.finds();
    for (let indexToken = 0; indexToken < tokens.length; indexToken++) {
      const token = tokens[indexToken];
      if (this.validateRefreshToken(token.refreshToken) === null) await TokenModel.remove(token.id);
    }
  }
}

export default new TokenService();
