import {Constructor, FullSchema} from "../packages/redis.package";
import {ArrayNumberType, ArrayStringType, BooleanType, NumberType, StringType} from "../types/redis";
import ApiError from "./apiError.exception";

type MinMax = {
  min?: number;
  max?: number;
};

interface BodyValidator {
  [key: string]: Omit<StringType, "unique"> | (NumberType & MinMax) | BooleanType | ArrayStringType | ArrayNumberType;
}

export default class Validator<CurretlyBodyValidator extends BodyValidator> {
  validator: CurretlyBodyValidator;

  constructor(validator: CurretlyBodyValidator) {
    this.validator = validator;
  }

  valid(body: any) {
    if (typeof body !== "object") throw ApiError.BadRequest("Body не является object");
    let keysBody = Object.keys(body);
    for (let indexBody = 0; indexBody < keysBody.length; indexBody++) {
      const key = keysBody[indexBody];
      if (!this.validator[key]) throw ApiError.BadRequest(`Ключ ${key} не должен быть в body`);
    }
    let keysValidator = Object.keys(this.validator);
    for (let indexKey = 0; indexKey < keysValidator.length; indexKey++) {
      const key = keysValidator[indexKey];
      const validatorElement = this.validator[key];
      if (validatorElement.default && typeof body[key] === "undefined") body[key] = validatorElement.default;
      if (validatorElement.required && typeof body[key] === "undefined") throw ApiError.BadRequest(`Ключ ${key} обязателен в body`);
      if (validatorElement.type === "array" && !Array.isArray(body[key])) throw ApiError.BadRequest(`Ключе ${key} не совпадает типом ${validatorElement.type}`);
      if (validatorElement.type === "array" && Array.isArray(body[key])) {
        for (let indexElement = 0; indexElement < body[key].length; indexElement++) {
          const element = body[key][indexElement];
          if (typeof element !== validatorElement.mono) throw ApiError.BadRequest(`В ключе ${key} есть несовпадение типа ${validatorElement.mono}`);
        }
      } else if (typeof body[key] !== validatorElement.type) throw ApiError.BadRequest(`Ключ ${key} не совпадает типом ${validatorElement.type}`);
      if (validatorElement.type === "string" && validatorElement.enum && !validatorElement.enum[body[key]])
        throw ApiError.BadRequest(`Ключ ${key} не совпадает с вариантами ${Object.keys(validatorElement.enum).join(", ")}`);
      if (validatorElement.type === "number" && typeof validatorElement.min !== "undefined" && validatorElement.min > body[key])
        throw ApiError.BadRequest(`Ключе ${key} должен быть больше числа ${validatorElement.min}`);
      if (validatorElement.type === "number" && typeof validatorElement.max !== "undefined" && validatorElement.max < body[key])
        throw ApiError.BadRequest(`Ключе ${key} должен быть меньше числа ${validatorElement.max}`);
    }
    return body as Omit<FullSchema<CurretlyBodyValidator>, "id" | "createAt" | "updateAt">;
  }
}
