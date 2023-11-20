import {env} from "./config/env";
import {init} from "./config/init";
import {logger} from "./utils/logger";
import {buildServer} from "./utils/server";

const main = async () => {
  const server = await buildServer();

  logger.debug(env, "using env");

  server
    .listen({
      port: env.PORT,
      host: env.HOST,
    })
    .then(() => {
      server.swagger();
    });
};

if (process.argv.includes("--init")) init();
else main();
