import {Functions} from "../models/role.model";

export default class UserAuthDto {
  id: number;
  login: string;
  role: {
    id: number;
    name: string;
    functions: (keyof typeof Functions)[];
  };

  constructor(model: any) {
    this.id = model.id;
    this.login = model.login;
    this.role = {
      id: model.role.id,
      name: model.role.name,
      functions: model.role.functions,
    };
  }
}
