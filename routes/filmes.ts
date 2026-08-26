import type { FastifyInstance } from "fastify";
import { getFilmes } from "../services/ingresso.js";

interface RequestQuery {
  cityId: string;
}

export default async function filmesRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: RequestQuery }>("/filmes", async (req) => {
    return getFilmes(req.query.cityId);
  });
}
