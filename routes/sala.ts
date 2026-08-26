import type { FastifyInstance } from "fastify";
import { getSala } from "../services/ingresso.js";

interface RequestQuery {
  sessionId: string;
  sectionId: string;
}

export default async function salaRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: RequestQuery }>("/sala", async (req) => {
    const { sessionId, sectionId } = req.query;
    return getSala(sessionId, sectionId);
  });
}
