import type { Context, SessionFlavor } from "grammy";
import type { CidadeFormatada } from "../types/cidades.js";
import type { DataFormatada } from "../types/datas.js";
import type { EstadoFormatado } from "../types/estados.js";
import type { FilmeFormatado } from "../types/filmes.js";
import type { CinemaFormatado, SessaoFormatada } from "../types/sessoes.js";

export type ModoBusca = "manual" | "automatica";

export interface Escolha {
  uf?: string | undefined;
  cidadeId?: string | undefined;
  cidadeNome?: string | undefined;
  filmeId?: string | undefined;
  filmeTitulo?: string | undefined;
  modo?: ModoBusca | undefined;
  date?: string | undefined;
  cinemaId?: string | undefined;
}

export interface Preferencias {
  idioma?: "Dublado" | "Legendado" | undefined;
  tresD?: boolean | undefined;
  vip?: boolean | undefined;
  namoradeira?: boolean | undefined;
}

export interface ResultadoAutomatico {
  cinema: CinemaFormatado;
  sessao: SessaoFormatada;
}

export interface BuscaFilme {
  texto?: string | undefined;
  aguardando: boolean;
}

export interface SessionData {
  estados: EstadoFormatado[];
  cidades: CidadeFormatada[];
  filmes: FilmeFormatado[];
  datas: DataFormatada[];
  cinemas: CinemaFormatado[];
  sessoesPorId: Record<string, { cinemaId: string; sessao: SessaoFormatada }>;
  resultadosAutomaticos: ResultadoAutomatico[];
  resultadosProntos: boolean;
  posterMessageId?: number | undefined;
  paginas: Record<string, number>;
  escolha: Escolha;
  preferencias: Preferencias;
  buscaFilme: BuscaFilme;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function initialSessionData(): SessionData {
  return {
    estados: [],
    cidades: [],
    filmes: [],
    datas: [],
    cinemas: [],
    sessoesPorId: {},
    resultadosAutomaticos: [],
    resultadosProntos: false,
    paginas: {},
    escolha: {},
    preferencias: {},
    buscaFilme: { aguardando: false },
  };
}
