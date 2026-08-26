import type { FastifyInstance } from "fastify";
import { getSessoesPorCinema } from "../services/ingresso.js";

interface RequestQuery {
  cityId: string;
  eventId: string;
  date: string;
}

export default async function dataMovieRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: RequestQuery }>("/data-movie", async (req) => {
    const { cityId, eventId, date } = req.query;
    return getSessoesPorCinema(cityId, eventId, date);
  });
}
