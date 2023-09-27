export default class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, message: string, errors = [] as string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static UnathorizedError() {
    return new ApiError(401, "Пользователь не авторизован");
  }

  static BadRequest(message: string, errors = [] as string[]) {
    return new ApiError(400, message, errors);
  }
}
