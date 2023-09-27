import config from "config";
import RedisSchema, {Constructor, SchemaConstructor} from "../packages/redis.package";

const dbName = config.get<string>("DB_NAME");

class TokenSchema<CurretlyConstructor extends Constructor> extends RedisSchema<CurretlyConstructor> {
  private static instance: TokenSchema<any>;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    super(schema);
    if (TokenSchema.instance) return TokenSchema.instance;
    TokenSchema.instance = this;
  }
}

export const TokenModel = new TokenSchema({
  key: `${dbName}:tokens`,
  fields: {
    userId: {type: "number", reqiured: true},
    refreshToken: {type: "string", reqiured: true},
  },
});
