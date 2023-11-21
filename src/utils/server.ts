import fastify from "fastify";
import autoload from "@fastify/autoload";
import path from "node:path";
import {logger} from "./logger";
import {env} from "../config/env";
import {serializerCompiler, validatorCompiler, jsonSchemaTransform} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import ApiError from "./apiError";
import {ZodError} from "zod";
import websocketPlugin from "@fastify/websocket";

export async function buildServer() {
  let app = fastify({
    logger: process.argv.includes("--dev") ? logger : true,
  });

  // register zod module
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // error handle
  app.setErrorHandler((error, requset, reply) => {
    try {
      return reply.status(400).send({statusCode: error.statusCode ?? 500, message: JSON.parse(error.message)});
    } catch (e) {
      if (error instanceof ApiError) return reply.status(error.statusCode).send({statusCode: error.statusCode ?? 500, message: error.message});
      return reply.status(500).send({statusCode: error.statusCode ?? 500, message: error.message});
    }
  });

  // parser json
  app.addContentTypeParser("application/json", {parseAs: "string"}, function (req, body, done) {
    try {
      done(null, JSON.parse(body as string));
    } catch (error: any) {
      error.statusCode = 400;
      done(error, undefined);
    }
  });

  // register swagger
  app.register(fastifySwagger, {
    mode: "dynamic",
    transform: jsonSchemaTransform,
    swagger: {
      info: {
        title: "Documentation",
        description: "Documentation Rest-Api this server",
        version: "0.1",
      },
      security: [
        {
          authorization: ["authorization"],
        },
      ],
      securityDefinitions: {
        authorization: {
          type: "apiKey",
          name: "authorization",
          in: "headers",
        },
      },
      host: `${env.HOST}:${env.PORT}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });

  // register swagger ui
  app.register(fastifySwaggerUi, {
    routePrefix: "/documentations",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  // registrations plugins
  app.register(fastifyCors, {
    origin: "*",
    allowedHeaders: ["Origin", "X-Requested-With", "Accept", "Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  });
  app.register(fastifyCookie);
  app.register(websocketPlugin, {
    options: {maxPayload: 1048576},
  });

  // registration routers
  app.register(autoload, {
    dir: path.join(process.cwd(), "src", "routers", "v1"),
    dirNameRoutePrefix: false,
    options: {prefix: "/api/v1"},
    maxDepth: 2,
  });

  return app;
}
