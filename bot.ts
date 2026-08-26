import "dotenv/config";
import { FileAdapter } from "@grammyjs/storage-file";
import { Bot, session } from "grammy";
import {
  apagarPosterAnterior,
  enviarPosterFilme,
  mostrarCidades,
  mostrarCinemas,
  mostrarConclusao,
  mostrarDatas,
  mostrarEstados,
  mostrarFilmes,
  mostrarModoBusca,
  mostrarPerguntaFormato,
  mostrarPerguntaIdioma,
  mostrarPerguntaNamoradeira,
  mostrarPerguntaVip,
  mostrarPromptBuscaFilme,
  mostrarResultadosAutomaticos,
  mostrarResumoSessao,
  mostrarSessoes,
} from "./bot/handlers.js";
import { initialSessionData, type BotContext } from "./bot/types.js";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("Defina BOT_TOKEN no arquivo .env (gerado pelo @BotFather)");
}

const bot = new Bot<BotContext>(token);

bot.use(
  session({
    initial: initialSessionData,
    storage: new FileAdapter({ dirName: "sessions" }),
  }),
);

// responde o callback assim que ele chega, antes de qualquer busca lenta
// (evita "query is too old" quando a resposta ao usuário demora)
bot.on("callback_query:data", async (ctx, next) => {
  await ctx.answerCallbackQuery().catch(() => {});
  await next();
});

function limparAPartirDaCidade(ctx: BotContext) {
  ctx.session.filmes = [];
  ctx.session.datas = [];
  ctx.session.cinemas = [];
  ctx.session.sessoesPorId = {};
  ctx.session.resultadosAutomaticos = [];
  ctx.session.resultadosProntos = false;
  ctx.session.preferencias = {};
  ctx.session.buscaFilme = { aguardando: false };
}

function limparAPartirDaData(ctx: BotContext) {
  ctx.session.cinemas = [];
  ctx.session.sessoesPorId = {};
  ctx.session.resultadosAutomaticos = [];
  ctx.session.resultadosProntos = false;
}

function limparAPartirDoFilme(ctx: BotContext) {
  ctx.session.escolha.filmeId = undefined;
  ctx.session.escolha.filmeTitulo = undefined;
  ctx.session.escolha.modo = undefined;
  ctx.session.escolha.date = undefined;
  ctx.session.escolha.cinemaId = undefined;
  ctx.session.datas = [];
  ctx.session.preferencias = {};
  ctx.session.buscaFilme = { aguardando: false };
  limparAPartirDaData(ctx);
}

bot.command("start", async (ctx) => {
  await apagarPosterAnterior(ctx);
  ctx.session.cidades = [];
  limparAPartirDaCidade(ctx);
  ctx.session.paginas = {};
  ctx.session.escolha = {};
  await mostrarEstados(ctx);
});

bot.callbackQuery(/^uf:(.+)$/, async (ctx) => {
  ctx.session.escolha = { uf: ctx.match[1]! };
  ctx.session.cidades = [];
  limparAPartirDaCidade(ctx);
  ctx.session.paginas.cidade = 0;
  await mostrarCidades(ctx);
});

bot.callbackQuery(/^cidade:(.+)$/, async (ctx) => {
  const id = ctx.match[1]!;
  const cidade = ctx.session.cidades.find((c) => c.id === id);
  ctx.session.escolha.cidadeId = id;
  ctx.session.escolha.cidadeNome = cidade?.nome;
  limparAPartirDaCidade(ctx);
  ctx.session.paginas.filme = 0;
  await mostrarFilmes(ctx);
});

bot.callbackQuery(/^filme:(.+)$/, async (ctx) => {
  const id = ctx.match[1]!;
  const filme = ctx.session.filmes.find((f) => f.id === id);
  ctx.session.escolha.filmeId = id;
  ctx.session.escolha.filmeTitulo = filme?.title;
  ctx.session.escolha.modo = undefined;
  limparAPartirDaCidade(ctx);
  if (filme) await enviarPosterFilme(ctx, filme);
  await mostrarModoBusca(ctx);
});

bot.callbackQuery(/^modo:(manual|automatica)$/, async (ctx) => {
  ctx.session.escolha.modo = ctx.match[1]! as "manual" | "automatica";
  ctx.session.preferencias = {};
  limparAPartirDaData(ctx);
  ctx.session.paginas.data = 0;
  await mostrarDatas(ctx);
});

bot.callbackQuery(/^data:(.+)$/, async (ctx) => {
  ctx.session.escolha.date = ctx.match[1]!;
  limparAPartirDaData(ctx);
  if (ctx.session.escolha.modo === "automatica") {
    await mostrarPerguntaIdioma(ctx);
  } else {
    ctx.session.paginas.cinema = 0;
    await mostrarCinemas(ctx);
  }
});

bot.callbackQuery(/^cinema:(.+)$/, async (ctx) => {
  ctx.session.escolha.cinemaId = ctx.match[1]!;
  ctx.session.paginas.sessao = 0;
  await mostrarSessoes(ctx);
});

bot.callbackQuery(/^idioma:(Dublado|Legendado|qualquer)$/, async (ctx) => {
  const valor = ctx.match[1]!;
  ctx.session.preferencias.idioma =
    valor === "qualquer" ? undefined : (valor as "Dublado" | "Legendado");
  await mostrarPerguntaFormato(ctx);
});

bot.callbackQuery(/^tresD:(sim|nao|qualquer)$/, async (ctx) => {
  const valor = ctx.match[1]!;
  ctx.session.preferencias.tresD =
    valor === "qualquer" ? undefined : valor === "sim";
  await mostrarPerguntaVip(ctx);
});

bot.callbackQuery(/^vip:(sim|nao|qualquer)$/, async (ctx) => {
  const valor = ctx.match[1]!;
  ctx.session.preferencias.vip =
    valor === "qualquer" ? undefined : valor === "sim";
  await mostrarPerguntaNamoradeira(ctx);
});

bot.callbackQuery(/^namoradeira:(sim|nao|qualquer)$/, async (ctx) => {
  const valor = ctx.match[1]!;
  ctx.session.preferencias.namoradeira =
    valor === "qualquer" ? undefined : valor === "sim";
  ctx.session.resultadosProntos = false;
  ctx.session.paginas.resultado = 0;
  await mostrarResultadosAutomaticos(ctx);
});

bot.callbackQuery(/^sessao:(.+)$/, async (ctx) => {
  await mostrarResumoSessao(ctx, ctx.match[1]!);
});

bot.callbackQuery(/^ufpg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.uf = Number(ctx.match[1]!);
  await mostrarEstados(ctx);
});

bot.callbackQuery(/^cidpg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.cidade = Number(ctx.match[1]!);
  await mostrarCidades(ctx);
});

bot.callbackQuery(/^filmpg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.filme = Number(ctx.match[1]!);
  await mostrarFilmes(ctx);
});

bot.callbackQuery(/^datapg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.data = Number(ctx.match[1]!);
  await mostrarDatas(ctx);
});

bot.callbackQuery(/^cinemapg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.cinema = Number(ctx.match[1]!);
  await mostrarCinemas(ctx);
});

bot.callbackQuery(/^sessaopg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.sessao = Number(ctx.match[1]!);
  await mostrarSessoes(ctx);
});

bot.callbackQuery(/^resultadopg:(\d+)$/, async (ctx) => {
  ctx.session.paginas.resultado = Number(ctx.match[1]!);
  await mostrarResultadosAutomaticos(ctx);
});

bot.callbackQuery("buscarfilme", mostrarPromptBuscaFilme);

bot.callbackQuery("cancelarbuscafilme", async (ctx) => {
  ctx.session.buscaFilme.aguardando = false;
  await mostrarFilmes(ctx);
});

bot.callbackQuery("limparbuscafilme", async (ctx) => {
  ctx.session.buscaFilme = { aguardando: false };
  ctx.session.paginas.filme = 0;
  await mostrarFilmes(ctx);
});

bot.on("message:text", async (ctx) => {
  if (!ctx.session.buscaFilme.aguardando) return;
  ctx.session.buscaFilme.aguardando = false;
  ctx.session.buscaFilme.texto = ctx.message.text.trim();
  ctx.session.paginas.filme = 0;
  await mostrarFilmes(ctx);
});

bot.callbackQuery("back:uf", mostrarEstados);
bot.callbackQuery("back:cidade", mostrarCidades);
bot.callbackQuery("back:filme", mostrarFilmes);
bot.callbackQuery("back:modo", mostrarModoBusca);
bot.callbackQuery("back:data", mostrarDatas);
bot.callbackQuery("back:cinema", mostrarCinemas);
bot.callbackQuery("back:sessao", mostrarSessoes);
bot.callbackQuery("back:idioma", mostrarPerguntaIdioma);
bot.callbackQuery("back:tresD", mostrarPerguntaFormato);
bot.callbackQuery("back:vip", mostrarPerguntaVip);
bot.callbackQuery("back:namoradeira", mostrarPerguntaNamoradeira);

bot.callbackQuery("retry:estados", mostrarEstados);
bot.callbackQuery("retry:cidades", mostrarCidades);
bot.callbackQuery("retry:filmes", mostrarFilmes);
bot.callbackQuery("retry:datas", mostrarDatas);
bot.callbackQuery("retry:cinemas", mostrarCinemas);
bot.callbackQuery("retry:automatica", mostrarResultadosAutomaticos);

bot.callbackQuery("concluir", mostrarConclusao);

bot.callbackQuery("nova_pesquisa", async (ctx) => {
  await apagarPosterAnterior(ctx);
  limparAPartirDoFilme(ctx);
  ctx.session.paginas.filme = 0;
  await mostrarFilmes(ctx);
});

bot.callbackQuery("noop", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
});

bot.catch((err) => {
  console.error("Erro no bot:", err.error);
});

bot.start();
console.log("Bot do Telegram rodando...");
