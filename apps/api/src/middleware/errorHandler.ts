import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../utils/errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        code: "validation_error",
        message: "Request validation failed",
        issues: error.issues
      });
      return;
    }

    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        code: error.code,
        message: error.message
      });
      return;
    }

    request.log.error({ error }, "Unhandled error");
    reply.status(500).send({
      code: "internal_error",
      message: "Internal server error"
    });
  });
}
