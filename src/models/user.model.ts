import config from "config";
import RedisSchema, {Constructor, SchemaConstructor} from "../packages/redis.package";

const dbName = config.get<string>("DB_NAME");

class UserSchema<CurretlyConstructor extends Constructor> extends RedisSchema<CurretlyConstructor> {
  private static instance: UserSchema<any>;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    super(schema);
    if (UserSchema.instance) return UserSchema.instance;
    UserSchema.instance = this;
  }
}

export const UserModel = new UserSchema({
  key: `${dbName}:users`,
  fields: {
    passwordHash: {type: "string"},
    login: {type: "string", unique: true},
  },
});
