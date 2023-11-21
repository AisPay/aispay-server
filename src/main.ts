import {env} from "./config/env";
import {init} from "./config/init";
import {startTimerClearToken} from "./events/clearToken.event";
import {startTimerEvent} from "./events/time.event";
import {logger} from "./utils/logger";
import {buildServer} from "./utils/server";

const main = async () => {
  const server = await buildServer();

  logger.debug(env, "using env");
  startTimerEvent();
  startTimerClearToken();

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
