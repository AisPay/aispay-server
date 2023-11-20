import RedisSchema, {Constructor, SchemaConstructor} from "../utils/redis";

class UserSchema<CurretlyConstructor extends Constructor> extends RedisSchema<CurretlyConstructor> {
  private static instance: UserSchema<any>;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    super(schema);
    if (UserSchema.instance) return UserSchema.instance;
    UserSchema.instance = this;
  }
}

export const UserModel = new UserSchema({
  key: `users`,
  fields: {
    passwordHash: {type: "string"},
    login: {type: "string", unique: true},
    roleId: {type: "number", required: true},
  },
});
