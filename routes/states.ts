import type { FastifyInstance } from "fastify";
import { getEstados } from "../services/ingresso.js";

export default async function statesRoutes(fastify: FastifyInstance) {
  fastify.get("/estados", async () => {
    return getEstados();
  });
}
