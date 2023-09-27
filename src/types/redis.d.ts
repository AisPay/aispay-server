export type OneType = "string" | "number" | "boolean";
export type ManyType = "array";

export type EnumCustom = {
  [key: string]: string | number;
};

export type StringType = {
  type: "string";
  required?: boolean;
  default?: string;
  enum?: EnumCustom;
  unique?: boolean;
};

export type NumberType = {
  type: "number";
  required?: boolean;
  default?: number;
};

export type BooleanType = {
  type: "boolean";
  required?: boolean;
  default?: boolean;
};

export type ArrayStringType = {
  type: "array";
  mono: "string";
  required?: boolean;
  default?: string[];
  enum?: EnumCustom;
};

export type ArrayNumberType = {
  type: "array";
  mono: "number";
  required?: boolean;
  default?: number[];
};

export type toTypeSchema<Type extends OneType | ManyType> = Type extends "string" ? string : Type extends "number" ? number : Type extends "boolean" ? boolean : never;
