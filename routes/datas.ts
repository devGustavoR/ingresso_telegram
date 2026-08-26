import type { FastifyInstance } from "fastify";
import { getDatas } from "../services/ingresso.js";

interface RequestQuery {
  cityId: string;
  eventId: string;
}

export default async function datasRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: RequestQuery }>("/datas", async (req) => {
    const { cityId, eventId } = req.query;
    return getDatas(cityId, eventId);
  });
}
