import type { AssentoFormatado, SalaFormatada } from "../types/sala.js";

const SIMBOLO_DISPONIVEL: Record<string, string> = {
  Regular: "💺",
  Couple: "💕",
  Disability: "♿",
  Obese: "🔷",
  Companion: "🤝",
};

const NOME_AMIGAVEL: Record<string, string> = {
  Regular: "Livre",
  Couple: "Namoradeira",
  Disability: "PCD",
  Obese: "Obeso",
  Companion: "Acompanhante",
};

const SIMBOLO_OCUPADO = "⬛";
const SIMBOLO_BLOQUEADO = "🔒";
const SIMBOLO_VAZIO = "⠀⠀"; // colunas sem assento (corredor)

function simboloDoAssento(assento: AssentoFormatado): string {
  if (assento.status === "PhysicalDistance") return SIMBOLO_BLOQUEADO;
  if (!assento.available) return SIMBOLO_OCUPADO;
  return SIMBOLO_DISPONIVEL[assento.type] ?? "💺";
}

export function renderSeatMap(sala: SalaFormatada): string {
  const todosAssentos = sala.linhas.flatMap((linha) => linha.seats);

  const assentosPorLinha = new Map<number, AssentoFormatado[]>();
  for (const assento of todosAssentos) {
    const lista = assentosPorLinha.get(assento.line) ?? [];
    lista.push(assento);
    assentosPorLinha.set(assento.line, lista);
  }

  const letraPorLinha = new Map<number, string>();
  for (const rotulo of sala.labels) {
    if (!letraPorLinha.has(rotulo.line)) {
      letraPorLinha.set(rotulo.line, rotulo.label);
    }
  }

  const numerosDeLinha = [...assentosPorLinha.keys()].sort((a, b) => b - a);

  const linhasDesenhadas = numerosDeLinha.map((numeroLinha) => {
    const assentosDaLinha = assentosPorLinha.get(numeroLinha) ?? [];
    const assentoPorColuna = new Map(
      assentosDaLinha.map((assento) => [assento.column, assento]),
    );
    const letra = (letraPorLinha.get(numeroLinha) ?? "?").padEnd(2);

    let linhaTexto = letra;
    for (let coluna = 1; coluna <= sala.bounds.columns; coluna++) {
      const assento = assentoPorColuna.get(coluna);
      linhaTexto += assento ? simboloDoAssento(assento) : SIMBOLO_VAZIO;
    }
    return linhaTexto;
  });

  const tela = `${"▬".repeat(6)} 🎬 TELA 🎬 ${"▬".repeat(6)}`;

  const tiposPresentes = new Set(todosAssentos.map((assento) => assento.type));
  const legenda: string[] = [];
  for (const [tipo, simbolo] of Object.entries(SIMBOLO_DISPONIVEL)) {
    if (tiposPresentes.has(tipo)) {
      legenda.push(`${simbolo} ${NOME_AMIGAVEL[tipo]}`);
    }
  }
  if (
    todosAssentos.some(
      (assento) => !assento.available && assento.status !== "PhysicalDistance",
    )
  ) {
    legenda.push(`${SIMBOLO_OCUPADO} Ocupado`);
  }
  if (todosAssentos.some((assento) => assento.status === "PhysicalDistance")) {
    legenda.push(`${SIMBOLO_BLOQUEADO} Bloqueado`);
  }

  return [tela, "", ...linhasDesenhadas, "", legenda.join("  ")].join("\n");
}
