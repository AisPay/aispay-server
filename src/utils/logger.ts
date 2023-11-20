import pino from "pino";

export const logger = pino({
  level: "debug",
  redact: ["ACCESS_SECRET_KEY", "REFRESH_SECRET_KEY"],
  transport: {
    target: "pino-pretty",
    translateTime: "HH:MM:ss Z",
    ignore: "pid,hostname",
  },
});
