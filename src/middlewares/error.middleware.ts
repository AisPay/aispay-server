import {FastifyReply, FastifyRequest} from "fastify";
import ApiError from "../exceptions/apiError.exception";

export default function (err: Error | ApiError, req: FastifyRequest, reply: FastifyReply) {
  console.log(err);
  if (err instanceof ApiError) {
    return reply.status(err.status).send({message: err.message, errors: err.errors});
  }
  return reply.status(500).send({message: `Непредвиженная ошибка: ${err.message}`});
}
