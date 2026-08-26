import axios from "axios";
import type { CidadeBruta, CidadeFormatada } from "../types/cidades.js";
import type { DataBruta, DataFormatada } from "../types/datas.js";
import type { EstadoBruto, EstadoFormatado } from "../types/estados.js";
import type { FilmeBruto, FilmeFormatado } from "../types/filmes.js";
import type { SalaBruta, SalaFormatada } from "../types/sala.js";
import type {
  CinemaFormatado,
  SessionsResponseBruta,
} from "../types/sessoes.js";

const client = axios.create({ timeout: 10_000 });

export async function getEstados(): Promise<EstadoFormatado[]> {
  const { data } = await client.get<EstadoBruto[]>(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
  );

  return data
    .map((estado) => ({ sigla: estado.sigla, nome: estado.nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function getCidades(
  stateId: string,
): Promise<CidadeFormatada[]> {
  const { data } = await client.get<{ cities: CidadeBruta[] }>(
    `https://api-content.ingresso.com/v0/states/${stateId}`,
  );

  return data.cities
    .map((cidade) => ({ id: cidade.id, nome: cidade.name }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function getFilmes(cityId: string): Promise<FilmeFormatado[]> {
  const { data } = await client.get<FilmeBruto[]>(
    `https://api-content.ingresso.com/v0/events/city/${cityId}`,
  );

  return data.map((filme) => ({
    id: filme.id,
    title: filme.title,
    contentRating: filme.contentRating,
    synopsis: filme.synopsis,
    imageFeatured: filme.imageFeatured,
    distributor: filme.distributor,
    genres: filme.genres,
    trailers: filme.trailers.map((trailer) => trailer.url),
    ratingDetails: filme.ratingDetails.name,
    ratingDetailsDescription: filme.ratingDetails.description,
  }));
}

export async function getDatas(
  cityId: string,
  eventId: string,
): Promise<DataFormatada[]> {
  const { data } = await client.get<DataBruta[]>(
    `https://api-content.ingresso.com/v0/sessions/city/${cityId}/event/${eventId}/dates`,
  );

  return data.map((dia) => ({
    date: dia.date,
    dateFormatted: dia.dateFormatted,
    dayOfWeek: dia.dayOfWeek,
    isToday: dia.isToday,
  }));
}

export async function getSessoesPorCinema(
  cityId: string,
  eventId: string,
  date: string,
): Promise<CinemaFormatado[]> {
  const { data } = await client.get<SessionsResponseBruta[]>(
    `https://api-content.ingresso.com/v0/sessions/city/${cityId}/event/${eventId}?date=${date}`,
  );

  return data.flatMap((entry) =>
    (entry.theaters ?? []).map((cinema) => ({
      id: cinema.id,
      name: cinema.name,
      address: cinema.address,
      addressComplement: cinema.addressComplement,
      number: cinema.number,
      neighborhood: cinema.neighborhood,
      geolocation: cinema.geolocation,
      siteURL: cinema.siteURL,
      sessoes: (cinema.rooms ?? []).flatMap((sala) =>
        sala.sessions.map((sessao) => ({
          sessionId: sessao.id,
          sectionId: sessao.defaultSector,
          room: sala.name,
          price: sessao.price,
          date: sessao.date.localDate,
          time: sessao.time,
          type: sessao.type,
          hasSeatSelection: sessao.hasSeatSelection,
          checkoutUrl: sessao.siteURL,
        })),
      ),
    })),
  );
}

export async function getSala(
  sessionId: string,
  sectionId: string,
): Promise<SalaFormatada> {
  const { data } = await client.get<SalaBruta>(
    `https://api.ingresso.com/v1/sessions/${sessionId}/sections/${sectionId}/seats`,
  );

  return {
    theaterName: data.theaterName,
    totalSeats: data.totalSeats,
    bounds: data.bounds,
    labels: data.labels ?? [],
    linhas: (data.lines ?? []).map((linha) => ({
      line: linha.line,
      seats: linha.seats.map((assento) => ({
        id: assento.id,
        label: assento.label,
        line: assento.line,
        column: assento.column,
        type: assento.type,
        status: assento.status,
        available: assento.status === "Available",
      })),
    })),
  };
}
