import "dotenv/config";
import fastify from "fastify";
import cityRoutes from "./routes/city.js";
import dataMovieRoutes from "./routes/dataMovie.js";
import datasRoutes from "./routes/datas.js";
import filmesRoutes from "./routes/filmes.js";
import salaRoutes from "./routes/sala.js";
import statesRoutes from "./routes/states.js";

const server = fastify({ logger: true });
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

await filmesRoutes(server);
await statesRoutes(server);
await cityRoutes(server);
await dataMovieRoutes(server);
await datasRoutes(server);
await salaRoutes(server);

server.get("/", async (req, res) => {
  return { hello: "world" };
});

server.listen({ port }, (err) => {
  if (err) throw err;
  console.log(`Servidor rodando na porta ${port}`);
});
