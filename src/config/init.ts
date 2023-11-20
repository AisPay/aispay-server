import {hashSync} from "bcrypt";
import {RoleModel} from "../models/role.model";
import {UserModel} from "../models/user.model";
import {logger} from "../utils/logger";
import {env} from "./env";

export const init = async () => {
  logger.info("Установка базовых данных");

  let roleCandidate = await RoleModel.findOne({search: [{key: "name", value: "admin"}]});
  if (!roleCandidate) {
    logger.info(`Создание роли "admin"`);
    await RoleModel.add({name: "admin", description: "Работа с админ панелью", functions: ["main", "users", "roles", "transactions"]});
  } else logger.warn('Роль "admin" уже существует');

  roleCandidate = await RoleModel.findOne({search: [{key: "name", value: "trader"}]});
  if (!roleCandidate) {
    logger.info(`Создание роли "trader"`);
    await RoleModel.add({name: "trader", description: "Работа с заявками", functions: ["main"]});
  } else logger.warn('Роль "trader" уже существует');

  roleCandidate = await RoleModel.findOne({search: [{key: "name", value: "partner"}]});
  if (!roleCandidate) {
    logger.info(`Создание роли "partner"`);
    await RoleModel.add({name: "partner", description: "Предоставление заявок", functions: ["main"]});
  } else logger.warn('Роль "partner" уже существует');

  roleCandidate = await RoleModel.findOne({search: [{key: "name", value: "operator"}]});
  if (!roleCandidate) {
    logger.info(`Создание роли "operator"`);
    await RoleModel.add({name: "operator", description: "Работа со спорными заявками", functions: ["main"]});
  } else logger.warn('Роль "operator" уже существует');

  let candidate = await UserModel.findOne({search: [{key: "login", value: env.INIT_ADMIN_LOGIN}]});
  if (!candidate) {
    logger.info(`Создание пользователя "${env.INIT_ADMIN_LOGIN}"(admin)`);
    let roleAdmin = await RoleModel.findOne({search: [{key: "name", value: "admin"}]});
    await UserModel.add({login: env.INIT_ADMIN_LOGIN, passwordHash: hashSync(env.INIT_ADMIN_PASSWORD, env.SALT_ROUND), roleId: roleAdmin!.id});
  } else logger.warn(`Пользователь "${env.INIT_ADMIN_LOGIN}"(admin) уже существует`);

  candidate = await UserModel.findOne({search: [{key: "login", value: env.INIT_TRADER_LOGIN}]});
  if (!candidate) {
    logger.info(`Создание пользователя "${env.INIT_TRADER_LOGIN}"(trader)`);
    let roleAdmin = await RoleModel.findOne({search: [{key: "name", value: "trader"}]});
    await UserModel.add({login: env.INIT_TRADER_LOGIN, passwordHash: hashSync(env.INIT_TRADER_PASSWORD, env.SALT_ROUND), roleId: roleAdmin!.id});
  } else logger.warn(`Пользователь "${env.INIT_TRADER_LOGIN}"(trader) уже существует`);

  candidate = await UserModel.findOne({search: [{key: "login", value: env.INIT_PARTNER_LOGIN}]});
  if (!candidate) {
    logger.info(`Создание пользователя "${env.INIT_PARTNER_LOGIN}"(partner)`);
    let roleAdmin = await RoleModel.findOne({search: [{key: "name", value: "partner"}]});
    await UserModel.add({login: env.INIT_PARTNER_LOGIN, passwordHash: hashSync(env.INIT_PARTNER_PASSWORD, env.SALT_ROUND), roleId: roleAdmin!.id});
  } else logger.warn(`Пользователь "${env.INIT_PARTNER_LOGIN}"(partner) уже существует`);

  candidate = await UserModel.findOne({search: [{key: "login", value: env.INIT_OPERATOR_LOGIN}]});
  if (!candidate) {
    logger.info(`Создание пользователя "${env.INIT_OPERATOR_LOGIN}"(partner)`);
    let roleAdmin = await RoleModel.findOne({search: [{key: "name", value: "partner"}]});
    await UserModel.add({login: env.INIT_OPERATOR_LOGIN, passwordHash: hashSync(env.INIT_OPERATOR_PASSWORD, env.SALT_ROUND), roleId: roleAdmin!.id});
  } else logger.warn(`Пользователь "${env.INIT_OPERATOR_LOGIN}"(partner) уже существует`);
};
