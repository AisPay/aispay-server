import RedisSchema, {Constructor, SchemaConstructor} from "../utils/redis";

class TokenSchema<CurretlyConstructor extends Constructor> extends RedisSchema<CurretlyConstructor> {
  private static instance: TokenSchema<any>;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    super(schema);
    if (TokenSchema.instance) return TokenSchema.instance;
    TokenSchema.instance = this;
  }
}

export const TokenModel = new TokenSchema({
  key: `tokens`,
  fields: {
    userId: {type: "number", required: true},
    accessToken: {type: "string", required: true},
    isActive: {type: "boolean", default: true},
    refreshToken: {type: "string", required: true},
    sockets: {type: "array", mono: "number", default: []},
  },
});
