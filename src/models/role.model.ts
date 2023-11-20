import RedisSchema, {Constructor, SchemaConstructor} from "../utils/redis";

class RoleSchema<CurretlyConstructor extends Constructor> extends RedisSchema<CurretlyConstructor> {
  private static instance: RoleSchema<any>;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    super(schema);
    if (RoleSchema.instance) return RoleSchema.instance;
    RoleSchema.instance = this;
  }
}

export enum Functions {
  users,
  roles,
  transactions,
  deals,
  requisites,
  balance,
  main,
}

export const RoleModel = new RoleSchema({
  key: `roles`,
  fields: {
    name: {type: "string", required: true},
    description: {type: "string", required: false},
    functions: {type: "array", mono: "string", enum: Functions, default: []},
  },
});
