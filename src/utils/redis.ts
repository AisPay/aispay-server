import {createClient} from "redis";
import {env} from "../config/env";

type OneType = "string" | "number" | "boolean";
type ManyType = "array";

type EnumCustom = {
  [key: string]: string | number;
};

type StringType = {
  type: "string";
  required?: boolean;
  default?: string;
  enum?: EnumCustom;
  unique?: boolean;
};

type NumberType = {
  type: "number";
  required?: boolean;
  default?: number;
};

type BooleanType = {
  type: "boolean";
  required?: boolean;
  default?: boolean;
};

type ArrayStringType = {
  type: "array";
  mono: "string";
  required?: boolean;
  default?: string[];
  enum?: EnumCustom;
};

type ArrayNumberType = {
  type: "array";
  mono: "number";
  required?: boolean;
  default?: number[];
};

type toTypeSchema<Type extends OneType | ManyType> = Type extends "string" ? string : Type extends "number" ? number : Type extends "boolean" ? boolean : never;

export type Constructor = {
  [key: string]: StringType | NumberType | BooleanType | ArrayStringType | ArrayNumberType;
};

export type SchemaConstructor<CurretlyConstructor extends Constructor> = {
  key: string;
  fields: CurretlyConstructor;
};

type DefaultType = string | number | boolean | string[] | number[];

type RequiredKeys<CurretlyConstructor extends Constructor> = {
  [Key in keyof CurretlyConstructor]: CurretlyConstructor[Key]["required"] extends false ? never : Key;
}[keyof CurretlyConstructor];

type DefaultKeys<CurretlyConstructor extends Constructor> = {
  [Key in keyof CurretlyConstructor]: CurretlyConstructor[Key]["default"] extends DefaultType ? Key : never;
}[keyof CurretlyConstructor];

type DefKeys = {
  readonly id: number;
  readonly createAt: number;
  readonly updateAt: number;
};

type Sort<CurretlyConstructor extends Constructor, Key extends keyof CurretlyConstructor> = {key: Key | "createAt" | "updateAt"; type: "asc" | "desc"};
type MinMax<CurretlyConstructor extends Constructor, Key extends keyof CurretlyConstructor> = toValueOf<CurretlyConstructor, Key> extends number
  ? {min?: number; max?: number}
  : ToValue<CurretlyConstructor, Key>;
type ToValue<CurretlyConstructor extends Constructor, Key extends keyof CurretlyConstructor> = {value: toValueOf<CurretlyConstructor, Key>};
type CountOrValue<CurretlyConstructor extends Constructor, Key extends keyof CurretlyConstructor> = ToValue<CurretlyConstructor, Key> | MinMax<CurretlyConstructor, Key>;

type SchemaKey<CurretlyConstructor extends Constructor> = {
  [Key in keyof CurretlyConstructor]: toValueOf<CurretlyConstructor, Key>;
};

type CreateSchema<CurretlyConstructor extends Constructor> = Omit<Pick<SchemaKey<CurretlyConstructor>, RequiredKeys<CurretlyConstructor>>, DefaultKeys<CurretlyConstructor>> &
  Partial<SchemaKey<CurretlyConstructor>>;

export type FullSchema<CurretlyConstructor extends Constructor> = Pick<SchemaKey<CurretlyConstructor>, RequiredKeys<CurretlyConstructor> | DefaultKeys<CurretlyConstructor>> &
  Partial<Omit<SchemaKey<CurretlyConstructor>, RequiredKeys<CurretlyConstructor> | DefaultKeys<CurretlyConstructor>>> &
  DefKeys;

type toValueOf<CurretlyConstructor extends Constructor, Key extends keyof CurretlyConstructor> = CurretlyConstructor[Key] extends ArrayStringType
  ? CurretlyConstructor[Key]["enum"] extends EnumCustom
    ? Array<keyof CurretlyConstructor[Key]["enum"]>
    : Array<toTypeSchema<CurretlyConstructor[Key]["mono"]>>
  : CurretlyConstructor[Key] extends ArrayNumberType
  ? Array<toTypeSchema<CurretlyConstructor[Key]["mono"]>>
  : CurretlyConstructor[Key] extends StringType
  ? CurretlyConstructor[Key]["enum"] extends EnumCustom
    ? keyof CurretlyConstructor[Key]["enum"]
    : toTypeSchema<CurretlyConstructor[Key]["type"]>
  : toTypeSchema<CurretlyConstructor[Key]["type"]>;

class RedisSchema<CurretlyConstructor extends Constructor> {
  path: string;
  pathIds: string;
  pathMemory: string;
  fields: CurretlyConstructor;

  constructor(schema: SchemaConstructor<CurretlyConstructor>) {
    this.path = `${env.DB_NAME}:${schema.key}`;
    this.pathIds = `${this.path}:ids`;
    this.fields = schema.fields;
    this.pathMemory = `${this.path}:memory`;

    this.add = this.add.bind(this);
    this.convertString = this.convertString.bind(this);
    this.convertValue = this.convertValue.bind(this);
    this.findOne = this.findOne.bind(this);
    this.finds = this.finds.bind(this);
    this.generateId = this.generateId.bind(this);
    this.modify = this.modify.bind(this);
    this.pathSchema = this.pathSchema.bind(this);
    this.remove = this.remove.bind(this);
  }

  private convertString(value: any) {
    let type = typeof value;
    if (type === "object") return JSON.stringify(value);
    if (type === "string") return value;
    if (type === "boolean") return String(Number(value));
    if (type === "number") return String(value);

    return undefined;
  }

  private convertValue(key: string, value: any) {
    let isKey = Object.keys(this.fields).includes(key);
    if (["id"].includes(key)) return Number(value);
    if (["createAt", "updateAt"].includes(key)) return Number(value);
    if (!isKey || value === null) return undefined;
    let type = this.fields[key].type;

    if (type === "array") {
      let typeMono = (<any>this.fields[key])["mono"];
      if (typeMono === "string") return JSON.parse(value) as string[];
      return JSON.parse(value) as number[];
    }

    if (type === "string") return value;
    if (type === "number") return Number(value);
    if (type === "boolean") return Boolean(Number(value));

    return undefined;
  }

  private pathUniqueKey(key: string) {
    return `${this.path}:unique:${key}`;
  }

  private async searchCondition<Key extends keyof CurretlyConstructor>(input: {key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>, ids: number[], one?: boolean): Promise<number[]>;
  private async searchCondition<Key extends keyof CurretlyConstructor>(
    input: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>,
    ids: number[],
    one?: boolean
  ): Promise<number[]>;
  private async searchCondition<Key extends keyof CurretlyConstructor>(
    input: {key: Key; force?: boolean} | Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>,
    ids: number[],
    one?: boolean
  ): Promise<number[]> {
    const pipeline = client.multi();
    let localIds = [...ids];
    let inputs = Array.isArray(input) ? input : [{key: input.key, value: (<any>input).value, force: input.force}];

    let keys = Array.isArray(input) ? input.map((el) => el.key).filter((key) => this.fields[key]) : [input.key];

    for (let indexId = 0; indexId < localIds.length; indexId++) {
      const id = localIds[indexId];
      for (let indexKey = 0; indexKey < keys.length; indexKey++) {
        const key = String(keys[indexKey]);
        pipeline.hGet(this.pathSchema(id), key);
      }
    }

    const checkArray = (body: any[], checked: any[]) => {
      let stringBody = JSON.stringify(body);
      for (let indexChecked = 0; indexChecked < checked.length; indexChecked++) {
        const element = checked[indexChecked];
        if (stringBody.includes(String(element))) return true;
      }
      return false;
    };

    let values = await pipeline.exec();

    let addition = 0;
    let newIds = [];
    // console.log(localIds);
    for (let indexId = 0; indexId < localIds.length; indexId++) {
      let localKeys: string[] = [];
      let isTry = true;
      for (let indexKey = 0; indexKey < keys.length; indexKey++) {
        const localValue = values[indexId + indexKey + addition];
        const key = String(keys[indexKey]);
        const inputValue = (<any>inputs[indexKey]).value;
        const inputForce = inputs[indexKey].force;
        const min = (<any>inputs[indexKey])["min"];
        const max = (<any>inputs[indexKey])["max"];
        // console.log(key, inputValue, localValue, inputForce);

        const isNull = typeof localValue === "undefined" && String(localValue) === "";
        const isNumber = this.fields[key].type === "number" && ("min" in inputs[indexKey] || "max" in inputs[indexKey]);
        const isArray = this.fields[key].type === "array";
        const isDate = inputValue instanceof Date;
        const isForceCheck =
          (inputForce && isArray && checkArray(this.convertValue(key, localValue), inputValue)) ||
          (isDate && this.convertValue(key, localValue).getTime() <= inputValue.getTime() + 86400000 && this.convertValue(key, localValue).getTime() >= inputValue.getTime() - 86400000) ||
          String(localValue).includes(String(inputValue));
        // this.convertString(localValue).includes(inputValue instanceof Date ? String(Number(inputValue)) : String(inputValue))
        const isNoForceCheck =
          (isArray && this.convertValue(key, localValue).includes(inputValue)) ||
          (isDate && this.convertValue(key, localValue).getTime() === inputValue.getTime()) ||
          this.convertValue(key, localValue) === inputValue;
        const isMinCheck = "min" in inputs[indexKey] && min < this.convertValue(key, localValue);
        const isMaxCheck = "max" in inputs[indexKey] && max > this.convertValue(key, localValue);
        const isIncludeKeys = localKeys.includes(key);
        // console.log(inputs[indexKey], inputValue, localValue, isNull, isForceCheck, isNoForceCheck, isNumber, isMinCheck, isMaxCheck);
        // console.log(localIds[indexId], key, localValue, inputValue);
        // console.log(`isNull: ${String(isNull)}, isForceCheck: ${String(isForceCheck)}, isNoForceCheck: ${String(isNoForceCheck)}, isIncludeKeys: ${String(isIncludeKeys)}`);

        if (one) {
          if (isNull || !(isForceCheck || isNoForceCheck || (isNumber && isMinCheck && isMaxCheck))) isTry = false;
        } else {
          if (isIncludeKeys && !isTry) {
            if (!isNull && (isForceCheck || isNoForceCheck || (isNumber && isMinCheck && isMaxCheck))) isTry = true;
          } else if (!isIncludeKeys) {
            if (isNull || !(isForceCheck || isNoForceCheck || (isNumber && isMinCheck && isMaxCheck))) isTry = false;
          }
        }

        localKeys.push(key);
        if (localKeys.length > 1 && indexKey === keys.length - 1) addition++;
      }
      if (isTry) newIds.push(localIds[indexId]);
    }

    return newIds;
  }

  private pathSchema(id: string | number) {
    return `${this.path}:${id}`;
  }

  private generateMemoryKey(...args: any[]) {
    let localArgs = [...args];
    let code = "";

    while (localArgs.length > 0) {
      const arg = localArgs.shift();
      if (Array.isArray(arg)) localArgs.push(...arg);
      else if (typeof arg === "object") {
        let keys = Object.keys(arg);
        for (let indexKey = 0; indexKey < keys.length; indexKey++) {
          const key = keys[indexKey];
          localArgs.push(key);
          localArgs.push(arg[key]);
        }
      } else code += String(arg);
    }

    return code;
  }

  private async saveMemory(code: string, value: any) {
    let isTimeMemory = env.IS_TIME_MEMORY;
    let timeMemory = env.TIME_MEMORY;
    if (isTimeMemory) await client.setEx(`${this.pathMemory}:${code}`, timeMemory, JSON.stringify(value));
  }

  private async checkMemory(code: string) {
    let result = await client.get(`${this.pathMemory}:${code}`);
    if (result !== null) return JSON.parse(result);
    else return;
  }

  public async modify(funcKey: "remove", callback: (this: RedisSchema<CurretlyConstructor>, ...args: [id: number]) => void | Promise<void>): Promise<void>;
  public async modify(funcKey: "add", callback: (this: RedisSchema<CurretlyConstructor>, ...args: [body: CreateSchema<CurretlyConstructor>, id: number]) => void | Promise<void>): Promise<void>;
  public async modify(
    funcKey: "update",
    callback: (this: RedisSchema<CurretlyConstructor>, ...args: [body: Partial<CreateSchema<CurretlyConstructor>>, id: number]) => void | Promise<void>
  ): Promise<void>;
  public async modify(
    funcKey: "add" | "remove" | "update",
    callback:
      | ((this: RedisSchema<CurretlyConstructor>, ...args: [body: CreateSchema<CurretlyConstructor>, id: number]) => void | Promise<void>)
      | ((this: RedisSchema<CurretlyConstructor>, ...args: [id: number]) => void | Promise<void>)
      | ((this: RedisSchema<CurretlyConstructor>, ...args: [body: Partial<CreateSchema<CurretlyConstructor>>, id: number]) => void | Promise<void>)
  ): Promise<void> {
    if (funcKey === "remove") {
      let oldRemove = this.remove;
      this.remove = async (...args: [id: number]) => {
        await oldRemove.call(this, ...args);
        await (callback as any).call(this, ...args);
      };
      this.remove = this.remove.bind(this);
    }

    if (funcKey === "add") {
      let oldAdd = this.add;
      this.add = async (...args: [body: CreateSchema<CurretlyConstructor>, id?: number]) => {
        if (!args[1]) args[1] = await this.generateId();
        try {
          let el = await oldAdd.call(this, ...args);
          await (callback as any).call(this, ...args);
          return el;
        } catch (error) {
          throw error;
        }
      };
      this.add = this.add.bind(this);
    }

    if (funcKey === "update") {
      let oldUpdate = this.update;
      this.update = async (...args: [body: Partial<CreateSchema<CurretlyConstructor>>, id: number]) => {
        try {
          await oldUpdate.call(this, ...args);
          await (callback as any).call(this, ...args);
        } catch (error) {
          throw error;
        }
      };
      this.update = this.update.bind(this);
    }
  }

  public async generateId() {
    let memoryIds = await client.sMembers(this.pathIds);
    let ids = memoryIds.map((el) => Number(el)).sort((aId, bId) => aId - bId);
    if (ids.length === 0) return 1;
    // console.log(ids, ids[ids.length - 1]);
    return ids[ids.length - 1] + 1;
  }

  async add(body: CreateSchema<CurretlyConstructor>, id?: number) {
    if (typeof id !== "undefined") {
      let isId = await client.sIsMember(this.pathIds, String(id));
      if (isId) throw new Error(`Id уже занят в данной схеме (${this.path})`);
    } else id = await this.generateId();

    const pipeline = client.multi();

    let keys = Object.keys(this.fields);
    for (let indexKey = 0; indexKey < keys.length; indexKey++) {
      const key = keys[indexKey];
      const fieldElement = this.fields[key];
      let value = (<any>body)[key];
      let isKey = typeof (<any>body)[key] !== "undefined";
      let isRequired = fieldElement.required === undefined || fieldElement.required === true;
      let isDefault = typeof fieldElement.default !== "undefined";
      let isEnum = (fieldElement.type === "string" && fieldElement.enum) || (fieldElement.type === "array" && fieldElement.mono === "string" && fieldElement.enum);
      let isUnique = fieldElement.type === "string" && fieldElement.unique;

      if (!isKey && isDefault) {
        pipeline.hSet(this.pathSchema(id!), key, this.convertString(fieldElement.default));
        continue;
      }

      if (!isKey && isRequired) throw new Error(`Ключ ${key} обязателен (${this.path})`);
      if (isUnique) {
        let path = this.pathUniqueKey(key);
        let isCheckUnique = !(await client.sIsMember(path, value));
        if (!isCheckUnique) throw new Error(`Ключ ${key} не является уникальным`);
        else if (typeof value !== "undefined") pipeline.sAdd(path, value);
      }

      if (!isKey) continue;

      if (isEnum) {
        let keysEnum = Object.keys((<any>fieldElement)["enum"]);
        if (Array.isArray(value)) {
          for (let index = 0; index < value.length; index++) {
            const el = value[index];
            if (!keysEnum.includes(el)) throw new Error(`Ключ ${key} не совпадает со списком enum (${this.path}, ${value}, ${keysEnum})`);
          }
        } else if (!keysEnum.includes(value)) throw new Error(`Ключ ${key} не совпадает со списком enum (${this.path}, ${value}, ${keysEnum})`);
      }

      if (fieldElement.type === "array" && !Array.isArray(value)) throw new Error(`Ключ ${key} не соотвествует типу (${this.path}, ${typeof value}, ${fieldElement.type})`);
      else if (fieldElement.type !== "array" && typeof value !== fieldElement.type) throw new Error(`Ключ ${key} не соотвествует типу (${this.path}, ${typeof value}, ${fieldElement.type})`);

      pipeline.hSet(this.pathSchema(id!), key, this.convertString(value));
    }

    let time = Date.now();
    pipeline.hSet(this.pathSchema(id!), "id", this.convertString(id));
    pipeline.hSet(this.pathSchema(id!), "createAt", this.convertString(time));
    pipeline.hSet(this.pathSchema(id!), "updateAt", this.convertString(time));
    pipeline.sAdd(this.pathIds, this.convertString(id));

    await pipeline.exec();

    return (await this.findOne({id: id!, save: false}))!;
  }

  async remove(id: number) {
    const pipeline = client.multi();

    pipeline.del(this.pathSchema(id));
    pipeline.sRem(this.pathIds, this.convertString(id));
    let keysField = Object.keys(this.fields);
    for (let indexKeyField = 0; indexKeyField < keysField.length; indexKeyField++) {
      const field = this.fields[keysField[indexKeyField]];
      if (field.type === "string" && field.unique) {
        let value = await client.hGet(this.pathSchema(id), keysField[indexKeyField]);
        if (typeof value !== "undefined") pipeline.sRem(this.pathUniqueKey(keysField[indexKeyField]), value);
      }
    }

    await pipeline.exec();
  }

  async update(body: Partial<CreateSchema<CurretlyConstructor>>, id: number) {
    if (!(await client.sIsMember(this.pathIds, String(id)))) return;

    const pipeline = client.multi();

    let keys = Object.keys(this.fields);

    for (let indexKey = 0; indexKey < keys.length; indexKey++) {
      const key = keys[indexKey];
      const fieldElement = this.fields[key];
      let value = (<any>body)[key];
      let isKey = !!(<any>body)[key];
      let isEnum = !!(<any>fieldElement)["enum"];

      if (!isKey) continue;

      if (typeof (<any>body)[key] === "undefined") {
        pipeline.hDel(this.pathSchema(id), key);
        continue;
      }

      if (fieldElement.type === "string" && fieldElement.unique) {
        let valueLocal = await client.hGet(this.pathSchema(id), key);
        if (typeof valueLocal !== "undefined" && value !== valueLocal) {
          let path = this.pathUniqueKey(key);
          pipeline.sRem(path, valueLocal);
          if (typeof value !== "undefined") pipeline.sAdd(path, value);
        }
      }

      if (isEnum) {
        let keysEnum = Object.keys((<any>fieldElement)["enum"]);
        if (!keysEnum.includes(value)) throw new Error(`Ключ ${key} не совпадает со списком enum (${this.path}, ${value}, ${keysEnum})`);
      }

      if ((fieldElement.type === "array" && !Array.isArray(value)) || (fieldElement.type !== "array" && typeof value !== fieldElement.type))
        throw new Error(`Ключ ${key} не соотвествует типу (${this.path}, ${typeof value}, ${fieldElement.type})`);
      pipeline.hSet(this.pathSchema(id), key, this.convertString(value));
    }

    let time = Date.now();
    pipeline.hSet(this.pathSchema(id), "updateAt", this.convertString(time));

    await pipeline.exec();
  }

  async findOne<Key extends keyof CurretlyConstructor>(input: {id: number; save?: boolean; sort?: Sort<CurretlyConstructor, Key>}): Promise<FullSchema<CurretlyConstructor> | undefined>;
  async findOne<Key extends keyof CurretlyConstructor>(input: {
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
    save?: boolean;
    sort?: Sort<CurretlyConstructor, Key>;
  }): Promise<FullSchema<CurretlyConstructor> | undefined>;
  async findOne<Key extends keyof CurretlyConstructor>(input: {
    id?: number;
    search?: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
    force?: boolean;
    save?: boolean;
    sort?: Sort<CurretlyConstructor, Key>;
  }): Promise<FullSchema<CurretlyConstructor> | undefined> {
    if (typeof input.save === "undefined") input.save = true;
    let code = this.generateMemoryKey(input);
    let memorySearch = await this.checkMemory(code);
    if (memorySearch) {
      return memorySearch;
    }

    let memoryIds = await client.sMembers(this.pathIds);
    let ids = memoryIds.map((el) => Number(el)).sort((aId, bId) => aId - bId);
    if (input.sort) {
      let localPipeline = client.multi();
      for (let indexIds = 0; indexIds < ids.length; indexIds++) {
        const id = ids[indexIds];
        if (typeof input.sort.key === "string") localPipeline.hGet(this.pathSchema(id), input.sort.key);
      }
      let result = await localPipeline.exec();
      let bodyKey: any = {};
      for (let indexIds = 0; indexIds < ids.length; indexIds++) {
        const id = ids[indexIds];
        bodyKey[result[indexIds] as string] = id;
      }
      if (input.sort.key === "createAt" || input.sort.key === "updateAt") (<any>result) = result.map((value) => new Date(value as string));
      else if (this.fields[input.sort.key].type === "number") (<any>result) = result.map((value) => Number(value));
      result = result.sort();
      if (input.sort.type === "desc") result = result.reverse();
      ids = result.map((value) => bodyKey[value as string]);
    }

    if (input.search) {
      ids = await this.searchCondition(input.search, ids, true);
      if (ids.length === 0) return;
      input.id = ids[0];
    }

    let id = input.id!;
    const pipeline = client.multi();
    if (!(await client.sIsMember(this.pathIds, String(id)))) return undefined;

    let keys = Object.keys(this.fields).concat(["id", "createAt", "updateAt"]);
    for (let indexKey = 0; indexKey < keys.length; indexKey++) {
      const key = keys[indexKey];
      pipeline.hGet(this.pathSchema(id), key);
    }

    let body = {} as any;
    let values = await pipeline.exec();
    for (let indexValue = 0; indexValue < values.length; indexValue++) {
      const value = values[indexValue];
      const key = keys[indexValue];
      body[key] = this.convertValue(key, value);
    }

    if (input.save) await this.saveMemory(code, body);

    return body as FullSchema<CurretlyConstructor>;
  }

  async finds(): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {start: number; sort?: Sort<CurretlyConstructor, Key>}): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {end: number; sort?: Sort<CurretlyConstructor, Key>}): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {start: number; end: number; sort?: Sort<CurretlyConstructor, Key>}): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {start: number; count: true; sort?: Sort<CurretlyConstructor, Key>}): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    start: number;
    sort?: Sort<CurretlyConstructor, Key>;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
    count: true;
  }): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {end: number; count: true; sort?: Sort<CurretlyConstructor, Key>}): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    end: number;
    sort?: Sort<CurretlyConstructor, Key>;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
    count: true;
  }): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {start: number; end: number; count: true; sort?: Sort<CurretlyConstructor, Key>}): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    start: number;
    sort?: Sort<CurretlyConstructor, Key>;
    end: number;
    search: Array<{key: Key; value: toValueOf<CurretlyConstructor, Key>}>;
    count: true;
  }): Promise<number>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    sort?: Sort<CurretlyConstructor, Key>;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
  }): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    start: number;
    sort?: Sort<CurretlyConstructor, Key>;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
  }): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    end: number;
    sort?: Sort<CurretlyConstructor, Key>;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
  }): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input: {
    start: number;
    sort?: Sort<CurretlyConstructor, Key>;
    end: number;
    search: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
  }): Promise<FullSchema<CurretlyConstructor>[]>;
  async finds<Key extends keyof CurretlyConstructor>(input?: {
    start?: number;
    end?: number;
    sort?: Sort<CurretlyConstructor, Key>;
    count?: true;
    search?: Array<{key: Key; force?: boolean} & CountOrValue<CurretlyConstructor, Key>>;
    force?: boolean;
  }): Promise<FullSchema<CurretlyConstructor>[] | number> {
    let code = this.generateMemoryKey(input);
    let memorySearch = await this.checkMemory(code);
    if (memorySearch) return memorySearch;

    let memoryIds = await client.sMembers(this.pathIds);
    let ids = memoryIds.map((el) => Number(el)).sort((aId, bId) => aId - bId);
    if (input && input.sort) {
      let localPipeline = client.multi();
      for (let indexIds = 0; indexIds < ids.length; indexIds++) {
        const id = ids[indexIds];
        if (typeof input.sort.key === "string") localPipeline.hGet(this.pathSchema(id), input.sort.key);
      }
      let result = await localPipeline.exec();
      let bodyKey: any = {};
      for (let indexIds = 0; indexIds < ids.length; indexIds++) {
        const id = ids[indexIds];
        bodyKey[result[indexIds] as string] = id;
      }
      if (input.sort.key === "createAt" || input.sort.key === "updateAt") (<any>result) = result.map((value) => new Date(value as string));
      else if (this.fields[input.sort.key].type === "number") (<any>result) = result.map((value) => Number(value));
      result = result.sort();
      if (input.sort.type === "desc") result = result.reverse();
      ids = result.map((value) => bodyKey[value as string]);
    }

    let array = [] as any[];

    if (input?.search) {
      ids = await this.searchCondition(input.search, ids);
    }

    if (input?.count) return ids.length;
    let start = input?.start ?? 0;
    let end = input?.end ? input.end : ids.length;
    ids = ids.slice(start, end);

    for (let indexId = 0; indexId < ids.length; indexId++) {
      const id = ids[indexId];
      let res = await this.findOne({id, save: false});
      if (res) array.push(res);
    }

    await this.saveMemory(code, array);

    return array;
  }
}

export const client = createClient({url: env.DATABASE_CONNECTION});
client.connect();

export default RedisSchema;
