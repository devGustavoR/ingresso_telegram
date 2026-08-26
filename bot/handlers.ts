import { InlineKeyboard } from "grammy";
import {
  getCidades,
  getDatas,
  getEstados,
  getFilmes,
  getSala,
  getSessoesPorCinema,
} from "../services/ingresso.js";
import { buscarPosterTMDB } from "../services/tmdb.js";
import { buildPaginatedKeyboard } from "./keyboards.js";
import { renderSeatMap } from "./seatmap.js";
import type { BotContext, ResultadoAutomatico } from "./types.js";
import type { FilmeFormatado } from "../types/filmes.js";

function paginaAtual(ctx: BotContext, chave: string): number {
  return ctx.session.paginas[chave] ?? 0;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function responder(
  ctx: BotContext,
  texto: string,
  keyboard: InlineKeyboard,
  parseMode?: "Markdown",
) {
  const opts = parseMode
    ? { reply_markup: keyboard, parse_mode: parseMode }
    : { reply_markup: keyboard };
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(texto, opts);
    } catch (err) {
      const mensagemJaAtualizada =
        err instanceof Error && err.message.includes("message is not modified");
      if (!mensagemJaAtualizada) {
        // edição falhou por outro motivo (rede instável, etc.) — manda como mensagem nova
        await ctx.reply(texto, opts).catch((erroDeEnvio) => {
          console.error("Falha ao enviar mensagem de fallback:", erroDeEnvio);
        });
      }
    }
    // callback pode expirar por lentidão de rede ou clique duplicado — não é crítico
    await ctx.answerCallbackQuery().catch(() => {});
  } else {
    await ctx.reply(texto, opts);
  }
}

async function mostrarErro(
  ctx: BotContext,
  retryData: string,
  backData?: string,
) {
  const keyboard = new InlineKeyboard().text("🔄 Tentar novamente", retryData);
  if (backData) keyboard.row().text("🔙 Voltar", backData);

  await responder(
    ctx,
    "⚠️ Não consegui buscar os dados agora (instabilidade na API). Tente de novo:",
    keyboard,
  );
}

export async function mostrarEstados(ctx: BotContext) {
  if (ctx.session.estados.length === 0) {
    try {
      ctx.session.estados = await getEstados();
    } catch (err) {
      console.error("Erro ao buscar estados:", err);
      return mostrarErro(ctx, "retry:estados");
    }
  }

  const keyboard = buildPaginatedKeyboard({
    items: ctx.session.estados,
    page: paginaAtual(ctx, "uf"),
    pagePrefix: "ufpg",
    buildButton: (estado) => ({
      text: `${estado.nome} (${estado.sigla})`,
      data: `uf:${estado.sigla}`,
    }),
  });

  await responder(ctx, "🎬 Escolha o estado:", keyboard);
}

export async function mostrarCidades(ctx: BotContext) {
  const { uf } = ctx.session.escolha;
  if (!uf) return mostrarEstados(ctx);

  if (ctx.session.cidades.length === 0) {
    try {
      ctx.session.cidades = await getCidades(uf);
    } catch (err) {
      console.error("Erro ao buscar cidades:", err);
      return mostrarErro(ctx, "retry:cidades", "back:uf");
    }
  }

  const keyboard = buildPaginatedKeyboard({
    items: ctx.session.cidades,
    page: paginaAtual(ctx, "cidade"),
    pagePrefix: "cidpg",
    backButtonData: "back:uf",
    buildButton: (cidade) => ({
      text: cidade.nome,
      data: `cidade:${cidade.id}`,
    }),
  });

  await responder(ctx, `📍 Estado: ${uf}\nEscolha a cidade:`, keyboard);
}

export async function mostrarFilmes(ctx: BotContext) {
  const { cidadeId, cidadeNome } = ctx.session.escolha;
  if (!cidadeId) return mostrarCidades(ctx);

  if (ctx.session.filmes.length === 0) {
    try {
      ctx.session.filmes = await getFilmes(cidadeId);
    } catch (err) {
      console.error("Erro ao buscar filmes:", err);
      return mostrarErro(ctx, "retry:filmes", "back:cidade");
    }
  }

  const filtro = ctx.session.buscaFilme.texto;
  const filmesExibidos = filtro
    ? ctx.session.filmes.filter((filme) =>
        normalizarTexto(filme.title).includes(normalizarTexto(filtro)),
      )
    : ctx.session.filmes;

  const keyboard = buildPaginatedKeyboard({
    items: filmesExibidos,
    page: paginaAtual(ctx, "filme"),
    pagePrefix: "filmpg",
    backButtonData: "back:cidade",
    buildButton: (filme) => ({
      text: filme.title,
      data: `filme:${filme.id}`,
    }),
  });

  keyboard.row().text("🔎 Buscar por nome", "buscarfilme");
  if (filtro) {
    keyboard.row().text("❌ Limpar busca", "limparbuscafilme");
  }

  const cabecalho = filtro
    ? `🏙 Cidade: ${cidadeNome}\n🔎 Resultados para "${filtro}" (${filmesExibidos.length}):`
    : `🏙 Cidade: ${cidadeNome}\nEscolha o filme:`;

  await responder(ctx, cabecalho, keyboard);
}

export async function mostrarPromptBuscaFilme(ctx: BotContext) {
  ctx.session.buscaFilme.aguardando = true;

  const keyboard = new InlineKeyboard().text("❌ Cancelar", "cancelarbuscafilme");

  await responder(
    ctx,
    "🔎 Digite o nome (ou parte do nome) do filme que você procura:",
    keyboard,
  );
}

export async function apagarPosterAnterior(ctx: BotContext) {
  const chatId = ctx.chat?.id;
  const messageId = ctx.session.posterMessageId;
  ctx.session.posterMessageId = undefined;

  if (chatId && messageId) {
    await ctx.api.deleteMessage(chatId, messageId).catch(() => {});
  }
}

export async function enviarPosterFilme(ctx: BotContext, filme: FilmeFormatado) {
  await apagarPosterAnterior(ctx);

  const sinopse =
    filme.synopsis.length > 700
      ? `${filme.synopsis.slice(0, 700)}…`
      : filme.synopsis;

  const legenda =
    `🎬 ${filme.title}\n` +
    `🔞 ${filme.contentRating} · 🎭 ${filme.genres.join(", ")}\n` +
    `🏭 ${filme.distributor}\n\n` +
    sinopse;

  const posterUrl = filme.imageFeatured || (await buscarPosterTMDB(filme.title));

  try {
    const mensagem = posterUrl
      ? await ctx.replyWithPhoto(posterUrl, { caption: legenda })
      : await ctx.reply(legenda);
    ctx.session.posterMessageId = mensagem.message_id;
  } catch (err) {
    console.error("Erro ao enviar poster do filme:", err);
  }
}

export async function mostrarModoBusca(ctx: BotContext) {
  const { filmeTitulo } = ctx.session.escolha;

  const keyboard = new InlineKeyboard()
    .text("🔍 Busca manual", "modo:manual")
    .row()
    .text("⚡ Busca automática", "modo:automatica")
    .row()
    .text("🔙 Voltar", "back:filme");

  await responder(
    ctx,
    `🎞 Filme: ${filmeTitulo}\n\n` +
      "🔍 Manual: você escolhe a data, o cinema e a sessão.\n" +
      "⚡ Automática: você responde suas preferências (idioma, 3D, Vip, namoradeira) e eu já trago as melhores sessões pra você escolher.",
    keyboard,
  );
}

export async function mostrarDatas(ctx: BotContext) {
  const { cidadeId, filmeId, filmeTitulo } = ctx.session.escolha;
  if (!cidadeId || !filmeId) return mostrarFilmes(ctx);

  if (ctx.session.datas.length === 0) {
    try {
      ctx.session.datas = await getDatas(cidadeId, filmeId);
    } catch (err) {
      console.error("Erro ao buscar datas:", err);
      return mostrarErro(ctx, "retry:datas", "back:modo");
    }
  }

  if (ctx.session.datas.length === 0) {
    const keyboard = new InlineKeyboard().text("🔙 Voltar", "back:modo");
    await responder(
      ctx,
      `😕 Não há sessões disponíveis para "${filmeTitulo}" no momento.`,
      keyboard,
    );
    return;
  }

  const keyboard = buildPaginatedKeyboard({
    items: ctx.session.datas,
    page: paginaAtual(ctx, "data"),
    pagePrefix: "datapg",
    backButtonData: "back:modo",
    buildButton: (dia) => ({
      text: `${dia.dayOfWeek} (${dia.dateFormatted})${dia.isToday ? " · hoje" : ""}`,
      data: `data:${dia.date}`,
    }),
  });

  await responder(ctx, `🎞 Filme: ${filmeTitulo}\nEscolha a data:`, keyboard);
}

async function carregarCinemas(ctx: BotContext): Promise<boolean> {
  if (ctx.session.cinemas.length > 0) return true;

  const { cidadeId, filmeId, date } = ctx.session.escolha;
  if (!cidadeId || !filmeId || !date) return false;

  try {
    ctx.session.cinemas = await getSessoesPorCinema(cidadeId, filmeId, date);
  } catch (err) {
    console.error("Erro ao buscar sessões:", err);
    return false;
  }

  ctx.session.sessoesPorId = {};
  for (const cinema of ctx.session.cinemas) {
    for (const sessao of cinema.sessoes) {
      ctx.session.sessoesPorId[sessao.sessionId] = {
        cinemaId: cinema.id,
        sessao,
      };
    }
  }
  return true;
}

export async function mostrarCinemas(ctx: BotContext) {
  const { date, filmeTitulo } = ctx.session.escolha;
  if (!date) return mostrarDatas(ctx);

  const carregou = await carregarCinemas(ctx);
  if (!carregou) return mostrarErro(ctx, "retry:cinemas", "back:data");

  const cinemasComSessao = ctx.session.cinemas.filter(
    (cinema) => cinema.sessoes.length > 0,
  );

  if (cinemasComSessao.length === 0) {
    const keyboard = new InlineKeyboard().text("🔙 Voltar", "back:data");
    await responder(
      ctx,
      `😕 Nenhum cinema com sessão de "${filmeTitulo}" nessa data.`,
      keyboard,
    );
    return;
  }

  const keyboard = buildPaginatedKeyboard({
    items: cinemasComSessao,
    page: paginaAtual(ctx, "cinema"),
    pagePrefix: "cinemapg",
    backButtonData: "back:data",
    buildButton: (cinema) => ({
      text: `${cinema.name} (${cinema.sessoes.length} sessões)`,
      data: `cinema:${cinema.id}`,
    }),
  });

  await responder(ctx, `📅 Data: ${date}\nEscolha o cinema:`, keyboard);
}

export async function mostrarSessoes(ctx: BotContext) {
  const { cinemaId } = ctx.session.escolha;
  if (!cinemaId) return mostrarCinemas(ctx);

  const cinema = ctx.session.cinemas.find((c) => c.id === cinemaId);
  if (!cinema) return mostrarCinemas(ctx);

  const keyboard = buildPaginatedKeyboard({
    items: cinema.sessoes,
    page: paginaAtual(ctx, "sessao"),
    pagePrefix: "sessaopg",
    backButtonData: "back:cinema",
    buildButton: (sessao) => ({
      text: `${sessao.time} · ${sessao.room} · ${formatarPreco(sessao.price)} · ${sessao.type.join("/")}`,
      data: `sessao:${sessao.sessionId}`,
    }),
  });

  await responder(
    ctx,
    `🎥 Cinema: ${cinema.name}\nEscolha a sessão:`,
    keyboard,
  );
}

export async function mostrarPerguntaIdioma(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
    .text("🗣 Dublado", "idioma:Dublado")
    .text("📖 Legendado", "idioma:Legendado")
    .row()
    .text("🤷 Tanto faz", "idioma:qualquer")
    .row()
    .text("🔙 Voltar", "back:data");

  await responder(ctx, "🎙 Prefere dublado ou legendado?", keyboard);
}

export async function mostrarPerguntaFormato(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
    .text("🕶 Sim, 3D", "tresD:sim")
    .text("🚫 Não, 2D", "tresD:nao")
    .row()
    .text("🤷 Tanto faz", "tresD:qualquer")
    .row()
    .text("🔙 Voltar", "back:idioma");

  await responder(ctx, "🕶 Quer sessão em 3D?", keyboard);
}

export async function mostrarPerguntaVip(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
    .text("👑 Vip", "vip:sim")
    .text("💺 Normal", "vip:nao")
    .row()
    .text("🤷 Tanto faz", "vip:qualquer")
    .row()
    .text("🔙 Voltar", "back:tresD");

  await responder(ctx, "👑 Prefere sala Vip ou Normal?", keyboard);
}

export async function mostrarPerguntaNamoradeira(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
    .text("💕 Sim", "namoradeira:sim")
    .text("🚫 Não", "namoradeira:nao")
    .row()
    .text("🤷 Tanto faz", "namoradeira:qualquer")
    .row()
    .text("🔙 Voltar", "back:vip");

  await responder(
    ctx,
    "💕 Quer priorizar sessões com poltrona namoradeira disponível?",
    keyboard,
  );
}

export async function mostrarResultadosAutomaticos(ctx: BotContext) {
  const { date, filmeTitulo } = ctx.session.escolha;
  if (!date) return mostrarDatas(ctx);

  const carregou = await carregarCinemas(ctx);
  if (!carregou) return mostrarErro(ctx, "retry:automatica", "back:namoradeira");

  if (!ctx.session.resultadosProntos) {
    const { idioma, tresD, vip, namoradeira } = ctx.session.preferencias;

    let candidatos: ResultadoAutomatico[] = ctx.session.cinemas.flatMap(
      (cinema) => cinema.sessoes.map((sessao) => ({ cinema, sessao })),
    );

    candidatos = candidatos.filter(({ sessao }) => {
      if (idioma && !sessao.type.includes(idioma)) return false;
      if (tresD === true && !sessao.type.includes("3D")) return false;
      if (tresD === false && sessao.type.includes("3D")) return false;
      if (vip === true && !sessao.type.includes("Vip")) return false;
      if (vip === false && sessao.type.includes("Vip")) return false;
      return true;
    });

    if (namoradeira !== undefined) {
      // checar assento namoradeira exige buscar o mapa de cada sessão candidata,
      // então limitamos a checagem às primeiras opções pra não sobrecarregar a API
      const candidatosParaChecar = candidatos.slice(0, 15);
      const verificados = await Promise.all(
        candidatosParaChecar.map(async (candidato) => {
          try {
            const sala = await getSala(
              candidato.sessao.sessionId,
              candidato.sessao.sectionId,
            );
            const temNamoradeiraLivre = sala.linhas
              .flatMap((linha) => linha.seats)
              .some(
                (assento) => assento.type === "Couple" && assento.available,
              );
            return { candidato, temNamoradeiraLivre };
          } catch {
            return { candidato, temNamoradeiraLivre: false };
          }
        }),
      );
      candidatos = verificados
        .filter((v) => v.temNamoradeiraLivre === namoradeira)
        .map((v) => v.candidato);
    }

    candidatos.sort((a, b) => a.sessao.time.localeCompare(b.sessao.time));

    ctx.session.resultadosAutomaticos = candidatos;
    ctx.session.resultadosProntos = true;
  }

  const resultados = ctx.session.resultadosAutomaticos;

  if (resultados.length === 0) {
    const keyboard = new InlineKeyboard().text("🔙 Voltar", "back:namoradeira");
    await responder(
      ctx,
      `😕 Nenhuma sessão de "${filmeTitulo}" encontrada com esses filtros.`,
      keyboard,
    );
    return;
  }

  const keyboard = buildPaginatedKeyboard({
    items: resultados,
    page: paginaAtual(ctx, "resultado"),
    pagePrefix: "resultadopg",
    backButtonData: "back:namoradeira",
    buildButton: ({ cinema, sessao }) => ({
      text: `${sessao.time} · ${cinema.name} · ${sessao.type.join("/")} · ${formatarPreco(sessao.price)}`,
      data: `sessao:${sessao.sessionId}`,
    }),
  });

  await responder(
    ctx,
    `⚡ ${resultados.length} sessões de "${filmeTitulo}" encontradas:`,
    keyboard,
  );
}

export async function mostrarResumoSessao(ctx: BotContext, sessionId: string) {
  const entrada = ctx.session.sessoesPorId[sessionId];
  if (!entrada) return mostrarCinemas(ctx);

  const { sessao } = entrada;
  const cinema = ctx.session.cinemas.find((c) => c.id === entrada.cinemaId);

  let mapaTexto = "";
  try {
    const sala = await getSala(sessao.sessionId, sessao.sectionId);
    const disponiveis = sala.linhas
      .flatMap((linha) => linha.seats)
      .filter((assento) => assento.available).length;
    mapaTexto =
      `\n💺 Assentos disponíveis: ${disponiveis}/${sala.totalSeats}\n\n` +
      "```\n" +
      renderSeatMap(sala) +
      "\n```";
  } catch {
    // sessão sem mapa de assentos (ex: streaming/drive-in) — segue sem essa info
  }

  const texto =
    `🍿 ${cinema?.name ?? ""}\n` +
    `🕒 ${sessao.time} · ${sessao.room}\n` +
    `🎫 ${sessao.type.join(" / ")} · ${formatarPreco(sessao.price)}` +
    mapaTexto;

  const keyboard = new InlineKeyboard()
    .url("🎟 Finalizar compra", sessao.checkoutUrl)
    .row()
    .text("🔙 Voltar", "back:sessao")
    .row()
    .text("✅ Concluir", "concluir");

  await responder(ctx, texto, keyboard, "Markdown");
}

export async function mostrarConclusao(ctx: BotContext) {
  const keyboard = new InlineKeyboard().text(
    "🔄 Fazer pesquisa novamente",
    "nova_pesquisa",
  );

  await responder(
    ctx,
    "🍿 Obrigado pela preferência!\n\n" +
      "Esperamos que você aproveite muito a sua sessão. Bom filme! 🎬✨",
    keyboard,
  );
}
