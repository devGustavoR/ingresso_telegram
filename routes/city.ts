import type { FastifyInstance } from "fastify";
import { getCidades } from "../services/ingresso.js";

interface RequestQuery {
  stateId: string;
}

export default async function cityRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: RequestQuery }>("/cidades", async (req) => {
    return getCidades(req.query.stateId);
  });
}
