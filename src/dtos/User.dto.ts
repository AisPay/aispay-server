export default class UserDto {
  login: string;
  id: number;

  constructor(model: any) {
    this.login = model.login;
    this.id = model.id;
  }
}
