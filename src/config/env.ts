import zennv from "zennv";
import {z} from "zod";

export const env = zennv({
  dotenv: true,
  schema: z.object({
    PORT: z.number().default(3000),
    HOST: z.string().default("127.0.0.1"),
    DATABASE_CONNECTION: z.string().default("redis://127.0.0.1:6379"),
    IS_TIME_MEMORY: z.boolean().default(false),
    TIME_MEMORY: z.number().default(1),
    DB_NAME: z.string().default("aispay-test"),
    SALT_ROUND: z.number().default(10),
    ACCESS_SECRET_KEY: z.string().default("zcnfkjefskdnemwgfnfejkvn"),
    REFRESH_SECRET_KEY: z.string().default("cxbfgdfasadfmsdfsfasdfrg"),
    INIT_ADMIN_LOGIN: z.string().default("admin"),
    INIT_ADMIN_PASSWORD: z.string().default("sdvcbcvbcvs"),
    INIT_TRADER_LOGIN: z.string().default("trader"),
    INIT_TRADER_PASSWORD: z.string().default("jtyjyhnfghcxcv"),
    INIT_PARTNER_LOGIN: z.string().default("partner"),
    INIT_PARTNER_PASSWORD: z.string().default("ghrthgfffxsdfw"),
    INIT_OPERATOR_LOGIN: z.string().default("operator"),
    INIT_OPERATOR_PASSWORD: z.string().default("ghrthgfffxsdfw"),
  }),
});
