import axios from "axios";

const client = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 10_000,
});

interface TmdbResultadoBusca {
  results: { poster_path: string | null }[];
}

export async function buscarPosterTMDB(
  titulo: string,
): Promise<string | undefined> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return undefined;

  try {
    const { data } = await client.get<TmdbResultadoBusca>("/search/movie", {
      params: { api_key: apiKey, query: titulo, language: "pt-BR" },
    });

    const posterPath = data.results.find((r) => r.poster_path)?.poster_path;
    return posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : undefined;
  } catch (err) {
    console.error("Erro ao buscar poster no TMDB:", err);
    return undefined;
  }
}
