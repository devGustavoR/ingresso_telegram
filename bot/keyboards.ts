import { InlineKeyboard } from "grammy";

export const ITENS_POR_PAGINA = 8;

interface PaginatedKeyboardOptions<T> {
  items: T[];
  page: number;
  buildButton: (item: T) => { text: string; data: string };
  pagePrefix: string;
  backButtonData?: string;
}

export function buildPaginatedKeyboard<T>({
  items,
  page,
  buildButton,
  pagePrefix,
  backButtonData,
}: PaginatedKeyboardOptions<T>): InlineKeyboard {
  const totalPaginas = Math.max(1, Math.ceil(items.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(Math.max(page, 0), totalPaginas - 1);
  const inicio = paginaAtual * ITENS_POR_PAGINA;
  const itensDaPagina = items.slice(inicio, inicio + ITENS_POR_PAGINA);

  const keyboard = new InlineKeyboard();

  for (const item of itensDaPagina) {
    const { text, data } = buildButton(item);
    keyboard.text(text, data).row();
  }

  const navRow: { text: string; data: string }[] = [];
  if (paginaAtual > 0) {
    navRow.push({
      text: "◀️",
      data: `${pagePrefix}:${paginaAtual - 1}`,
    });
  }
  if (totalPaginas > 1) {
    navRow.push({
      text: `${paginaAtual + 1}/${totalPaginas}`,
      data: "noop",
    });
  }
  if (paginaAtual < totalPaginas - 1) {
    navRow.push({
      text: "▶️",
      data: `${pagePrefix}:${paginaAtual + 1}`,
    });
  }
  if (navRow.length > 0) {
    for (const { text, data } of navRow) {
      keyboard.text(text, data);
    }
    keyboard.row();
  }

  if (backButtonData) {
    keyboard.text("🔙 Voltar", backButtonData).row();
  }

  return keyboard;
}
